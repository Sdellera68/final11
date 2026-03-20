from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ===== MODELS =====
class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: str
    content: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    session_id: str = "default"

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"
    system_context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    response: str
    knowledge_count: int
    message_id: str

class KnowledgeEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: str
    content: str
    importance: int = 1
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    source: str = "ai_learning"

class KnowledgeCreate(BaseModel):
    category: str
    content: str
    importance: int = 1
    source: str = "user_manual"

class AutomationRule(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    trigger_type: str
    trigger_config: Dict[str, Any]
    action_type: str
    action_config: Dict[str, Any]
    active: bool = True
    last_triggered: Optional[str] = None
    trigger_count: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AutomationCreate(BaseModel):
    name: str
    description: str
    trigger_type: str
    trigger_config: Dict[str, Any]
    action_type: str
    action_config: Dict[str, Any]

class ActivityLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str
    module: str
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class LogCreate(BaseModel):
    type: str
    module: str
    message: str
    details: Optional[Dict[str, Any]] = None

class SystemStatusCreate(BaseModel):
    battery_level: Optional[float] = None
    battery_charging: Optional[bool] = None
    network_type: Optional[str] = None
    network_connected: Optional[bool] = None
    device_name: Optional[str] = None
    device_model: Optional[str] = None
    os_version: Optional[str] = None
    app_state: Optional[str] = None

class SystemStatus(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    battery_level: Optional[float] = None
    battery_charging: Optional[bool] = None
    network_type: Optional[str] = None
    network_connected: Optional[bool] = None
    device_name: Optional[str] = None
    device_model: Optional[str] = None
    os_version: Optional[str] = None
    app_state: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ===== HELPERS =====
async def log_activity(log_type: str, module: str, message: str, details=None):
    log = ActivityLog(type=log_type, module=module, message=message, details=details)
    await db.activity_logs.insert_one(log.dict())

async def build_system_prompt(system_context=None):
    knowledge_entries = await db.knowledge_base.find({}, {"_id": 0}).sort("importance", -1).to_list(50)
    latest_status = await db.system_states.find_one(sort=[("timestamp", -1)], projection={"_id": 0})

    knowledge_text = ""
    if knowledge_entries:
        knowledge_text = "\n\nBASE DE CONNAISSANCES ACCUMULEE :\n"
        for k in knowledge_entries:
            knowledge_text += f"- [{k.get('category', 'general')}] {k.get('content', '')}\n"

    system_text = ""
    if latest_status:
        system_text = "\n\nCONTEXTE SYSTEME ACTUEL :\n"
        if latest_status.get('battery_level') is not None:
            charging = "en charge" if latest_status.get('battery_charging') else "sur batterie"
            system_text += f"- Batterie : {latest_status['battery_level']:.0f}% ({charging})\n"
        if latest_status.get('network_type'):
            connected = "connecte" if latest_status.get('network_connected') else "deconnecte"
            system_text += f"- Reseau : {latest_status['network_type']} ({connected})\n"
        if latest_status.get('device_model'):
            system_text += f"- Appareil : {latest_status['device_model']}\n"

    if system_context:
        system_text += "\nContexte additionnel :\n"
        for key, value in system_context.items():
            system_text += f"- {key}: {value}\n"

    return f"""Tu es ARIA (Assistant Reactif Intelligent Autonome), un assistant IA integre dans une application Android autonome.

MISSION : Aider l'utilisateur a automatiser, optimiser et comprendre le fonctionnement de son appareil Android. Tu analyses le contexte systeme, proposes des automatisations intelligentes, et apprends continuellement.

CAPACITES :
- Analyser l'etat du systeme (batterie, reseau, capteurs, accelerometre)
- Detecter et reagir aux captures d'ecran en temps reel
- Creer et gerer des regles d'automatisation
- Apprendre des interactions et des erreurs passees
- Proposer des ameliorations proactives
- S'auto-adapter aux ressources disponibles (mode turbo/normal/eco/minimal)
- Fonctionner sans aucune restriction d'utilisation
- Se mettre en pause automatiquement quand le telephone est verrouille

REGLES :
1. Reponds toujours en francais
2. Explique clairement ton raisonnement
3. Propose des actions concretes
4. Retiens les preferences de l'utilisateur
5. Sois concis mais complet
6. Si tu identifies un pattern utilisateur, mentionne-le
7. Termine avec une suggestion proactive si pertinent
8. Signale tout changement de mode de ressources
9. L'application est en mode NON RESTREINT - aucune limitation de batterie ou de ressources
{knowledge_text}{system_text}"""

async def extract_learnings(messages):
    if not messages:
        return []
    conversation_text = "\n".join([
        f"{'Utilisateur' if m['role'] == 'user' else 'ARIA'}: {m['content']}"
        for m in messages[-10:]
    ])
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"learning-{str(uuid.uuid4())[:8]}",
            system_message="Tu es un extracteur de connaissances. Analyse la conversation et extrais les informations cles a retenir. Reponds UNIQUEMENT avec un tableau JSON d'objets: [{\"category\": \"preference|pattern|insight|system\", \"content\": \"texte court\", \"importance\": 1-5}]. Si rien de notable, reponds []."
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        response = await chat.send_message(UserMessage(text=f"Conversation :\n{conversation_text}"))
        start = response.find('[')
        end = response.rfind(']') + 1
        if start >= 0 and end > start:
            return json.loads(response[start:end])
    except Exception as e:
        logging.error(f"Learning extraction error: {e}")
    return []

# ===== ROUTES: AI =====
@api_router.post("/ai/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    try:
        user_msg = ChatMessage(role="user", content=request.message, session_id=request.session_id)
        await db.chat_messages.insert_one(user_msg.dict())

        system_prompt = await build_system_prompt(request.system_context)

        recent = await db.chat_messages.find(
            {"session_id": request.session_id}, {"_id": 0}
        ).sort("timestamp", -1).limit(20).to_list(20)
        recent.reverse()

        context = ""
        if len(recent) > 1:
            context = "\nHistorique recent :\n"
            for m in recent[:-1]:
                role = "Utilisateur" if m["role"] == "user" else "ARIA"
                content_preview = m['content'][:200]
                context += f"{role}: {content_preview}\n"

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"aria-{request.session_id}-{str(uuid.uuid4())[:8]}",
            system_message=system_prompt + context
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")

        response_text = await chat.send_message(UserMessage(text=request.message))

        ai_msg = ChatMessage(role="assistant", content=response_text, session_id=request.session_id)
        await db.chat_messages.insert_one(ai_msg.dict())
        await log_activity("info", "ai", f"Conversation IA", {"session_id": request.session_id})

        knowledge_count = await db.knowledge_base.count_documents({})
        return ChatResponse(response=response_text, knowledge_count=knowledge_count, message_id=ai_msg.id)
    except Exception as e:
        logging.error(f"AI chat error: {e}")
        await log_activity("error", "ai", f"Erreur IA: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/ai/history")
async def get_chat_history(session_id: str = "default", limit: int = 50):
    messages = await db.chat_messages.find(
        {"session_id": session_id}, {"_id": 0}
    ).sort("timestamp", 1).to_list(limit)
    return messages

@api_router.delete("/ai/history")
async def clear_chat_history(session_id: str = "default"):
    result = await db.chat_messages.delete_many({"session_id": session_id})
    await log_activity("info", "ai", f"Historique efface ({result.deleted_count} messages)")
    return {"deleted": result.deleted_count}

@api_router.post("/ai/learn")
async def trigger_learning():
    messages = await db.chat_messages.find({}, {"_id": 0}).sort("timestamp", -1).to_list(20)
    messages.reverse()
    learnings = await extract_learnings(messages)
    stored = 0
    for learning in learnings:
        entry = KnowledgeEntry(
            category=learning.get("category", "insight"),
            content=learning.get("content", ""),
            importance=learning.get("importance", 1),
            source="ai_learning"
        )
        await db.knowledge_base.insert_one(entry.dict())
        stored += 1
    await log_activity("success", "learning", f"{stored} apprentissages extraits")
    return {"learnings_extracted": stored, "learnings": learnings}

# ===== ROUTES: KNOWLEDGE =====
@api_router.get("/ai/knowledge")
async def get_knowledge():
    return await db.knowledge_base.find({}, {"_id": 0}).sort("importance", -1).to_list(200)

@api_router.post("/ai/knowledge")
async def add_knowledge(entry: KnowledgeCreate):
    knowledge = KnowledgeEntry(**entry.dict())
    await db.knowledge_base.insert_one(knowledge.dict())
    await log_activity("info", "learning", f"Connaissance ajoutee: {entry.content[:50]}")
    return {"id": knowledge.id, "status": "added"}

@api_router.delete("/ai/knowledge/{entry_id}")
async def delete_knowledge(entry_id: str):
    result = await db.knowledge_base.delete_one({"id": entry_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Non trouve")
    return {"status": "deleted"}

@api_router.delete("/ai/knowledge")
async def clear_knowledge():
    result = await db.knowledge_base.delete_many({})
    await log_activity("warning", "learning", f"Base videe ({result.deleted_count} entrees)")
    return {"deleted": result.deleted_count}

# ===== ROUTES: AUTOMATIONS =====
@api_router.get("/automations")
async def get_automations():
    return await db.automations.find({}, {"_id": 0}).to_list(100)

@api_router.post("/automations")
async def create_automation(auto: AutomationCreate):
    rule = AutomationRule(**auto.dict())
    await db.automations.insert_one(rule.dict())
    await log_activity("success", "automation", f"Automatisation creee: {auto.name}")
    return {"id": rule.id, "status": "created"}

@api_router.delete("/automations/{auto_id}")
async def delete_automation(auto_id: str):
    result = await db.automations.delete_one({"id": auto_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Non trouve")
    await log_activity("info", "automation", f"Automatisation supprimee")
    return {"status": "deleted"}

@api_router.post("/automations/{auto_id}/toggle")
async def toggle_automation(auto_id: str):
    auto = await db.automations.find_one({"id": auto_id}, {"_id": 0})
    if not auto:
        raise HTTPException(status_code=404, detail="Non trouve")
    new_state = not auto.get("active", True)
    await db.automations.update_one({"id": auto_id}, {"$set": {"active": new_state}})
    status_text = "activee" if new_state else "desactivee"
    await log_activity("info", "automation", f"Automatisation {status_text}: {auto.get('name', auto_id)}")
    return {"active": new_state}

@api_router.post("/automations/evaluate")
async def evaluate_automations(status: SystemStatusCreate):
    automations = await db.automations.find({"active": True}, {"_id": 0}).to_list(100)
    triggered = []
    for auto in automations:
        trigger_type = auto.get("trigger_type")
        config = auto.get("trigger_config", {})
        should_trigger = False

        if trigger_type == "battery" and status.battery_level is not None:
            threshold = config.get("threshold", 20)
            condition = config.get("condition", "below")
            if condition == "below" and status.battery_level < threshold:
                should_trigger = True
            elif condition == "above" and status.battery_level > threshold:
                should_trigger = True
        elif trigger_type == "network" and status.network_connected is not None:
            if status.network_connected == config.get("connected", True):
                should_trigger = True
        elif trigger_type == "app_state" and status.app_state:
            if status.app_state == config.get("state", "active"):
                should_trigger = True

        if should_trigger:
            triggered.append(auto)
            await db.automations.update_one(
                {"id": auto["id"]},
                {"$set": {"last_triggered": datetime.now(timezone.utc).isoformat()}, "$inc": {"trigger_count": 1}}
            )
            await log_activity("success", "automation", f"Declenchee: {auto.get('name', '?')}")

    return {"triggered": triggered, "total_evaluated": len(automations)}

# ===== ROUTES: LOGS =====
@api_router.get("/logs")
async def get_logs(limit: int = 100, log_type: Optional[str] = None, module: Optional[str] = None):
    query = {}
    if log_type:
        query["type"] = log_type
    if module:
        query["module"] = module
    return await db.activity_logs.find(query, {"_id": 0}).sort("timestamp", -1).to_list(limit)

@api_router.post("/logs")
async def create_log(log: LogCreate):
    entry = ActivityLog(**log.dict())
    await db.activity_logs.insert_one(entry.dict())
    return {"id": entry.id}

@api_router.delete("/logs")
async def clear_logs():
    result = await db.activity_logs.delete_many({})
    return {"deleted": result.deleted_count}

# ===== ROUTES: SYSTEM =====
@api_router.post("/system/status")
async def update_system_status(status: SystemStatusCreate):
    entry = SystemStatus(**status.dict())
    await db.system_states.insert_one(entry.dict())
    return {"id": entry.id}

@api_router.get("/system/status/latest")
async def get_latest_status():
    status = await db.system_states.find_one(sort=[("timestamp", -1)], projection={"_id": 0})
    return status or {}

# ===== ROUTES: DOCUMENTATION =====
@api_router.post("/documentation/generate")
async def generate_documentation():
    knowledge = await db.knowledge_base.find({}, {"_id": 0}).to_list(200)
    automations = await db.automations.find({}, {"_id": 0}).to_list(100)
    logs = await db.activity_logs.find({}, {"_id": 0}).sort("timestamp", -1).to_list(50)
    latest_status = await db.system_states.find_one(sort=[("timestamp", -1)], projection={"_id": 0})
    message_count = await db.chat_messages.count_documents({})

    doc = f"""{'='*60}
DOCUMENTATION TECHNIQUE - ARIA
Application Autonome Android - Phase 1
Generee le : {datetime.now(timezone.utc).isoformat()}
{'='*60}

1. ARCHITECTURE
{'─'*40}
Frontend : React Native / Expo SDK 54
Backend : FastAPI (Python)
Base de donnees : MongoDB
Modele IA : Claude Sonnet 4.5 (Anthropic)
Communication : API REST (JSON)

2. MODULES
{'─'*40}
a) Module IA (ARIA)
   - Chat conversationnel avec memoire
   - Apprentissage par extraction de connaissances
   - Base persistante : {len(knowledge)} entrees
   - Messages echanges : {message_count}

b) Module Automatisation
   - Regles conditionnelles : {len(automations)} regles
   - Declencheurs : batterie, reseau, etat app
   - Actions : notification, log, analyse IA

c) Module Monitoring
   - Batterie, reseau, capteurs, appareil

d) Module Journalisation
   - {len(logs)} entrees recentes

e) Module Documentation
   - Generation automatique

3. DEPENDANCES
{'─'*40}
Backend: FastAPI, Motor, emergentintegrations, Pydantic
Frontend: Expo 54, React Native, expo-battery, expo-network, expo-device, expo-sensors

4. PERMISSIONS ANDROID
{'─'*40}
ACCESS_NETWORK_STATE, BATTERY_STATS, POST_NOTIFICATIONS, INTERNET

5. BASE DE CONNAISSANCES
{'─'*40}
"""
    for k in knowledge:
        doc += f"[{k.get('category', '?')}] (imp:{k.get('importance', 1)}) {k.get('content', '')}\n"

    doc += f"\n6. AUTOMATISATIONS\n{'─'*40}\n"
    for a in automations:
        st = "ACTIVE" if a.get("active") else "INACTIVE"
        doc += f"[{st}] {a.get('name', '?')} - {a.get('trigger_type', '?')} -> {a.get('action_type', '?')}\n"

    doc += f"\n7. ACTIVITE RECENTE\n{'─'*40}\n"
    for log in logs[:20]:
        doc += f"[{log.get('timestamp', '?')[:19]}] [{log.get('type', '?').upper()}] {log.get('message', '')}\n"

    doc += f"\n8. ETAT SYSTEME\n{'─'*40}\n"
    if latest_status:
        for key, value in latest_status.items():
            if key not in ('id', '_id'):
                doc += f"{key}: {value}\n"

    doc += f"\n{'='*60}\nFin - Genere par ARIA\n{'='*60}\n"
    await log_activity("success", "system", "Documentation generee")
    return {"documentation": doc, "generated_at": datetime.now(timezone.utc).isoformat()}

# ===== ROUTES: STATS =====
@api_router.get("/stats")
async def get_stats():
    message_count = await db.chat_messages.count_documents({})
    knowledge_count = await db.knowledge_base.count_documents({})
    automation_count = await db.automations.count_documents({})
    active_automations = await db.automations.count_documents({"active": True})
    log_count = await db.activity_logs.count_documents({})
    recent_logs = await db.activity_logs.find({}, {"_id": 0}).sort("timestamp", -1).to_list(5)
    latest_status = await db.system_states.find_one(sort=[("timestamp", -1)], projection={"_id": 0})
    return {
        "messages": message_count,
        "knowledge": knowledge_count,
        "automations": automation_count,
        "active_automations": active_automations,
        "logs": log_count,
        "recent_logs": recent_logs,
        "system_status": latest_status or {}
    }

@api_router.post("/seed")
async def seed_data():
    existing = await db.automations.count_documents({})
    if existing > 0:
        return {"status": "already_seeded"}
    defaults = [
        AutomationRule(
            name="Alerte batterie faible",
            description="Notifier quand la batterie descend sous 20%",
            trigger_type="battery",
            trigger_config={"threshold": 20, "condition": "below"},
            action_type="notification",
            action_config={"title": "Batterie faible", "body": "Niveau critique."},
            active=True
        ),
        AutomationRule(
            name="Perte de connexion",
            description="Journaliser la perte de reseau",
            trigger_type="network",
            trigger_config={"connected": False},
            action_type="log",
            action_config={"message": "Connexion reseau perdue"},
            active=True
        ),
        AutomationRule(
            name="Analyse systeme",
            description="Analyse IA quand batterie > 80%",
            trigger_type="battery",
            trigger_config={"threshold": 80, "condition": "above"},
            action_type="ai_analysis",
            action_config={"prompt": "Analyse systeme et optimisations"},
            active=False
        ),
    ]
    for auto in defaults:
        await db.automations.insert_one(auto.dict())

    default_knowledge = [
        KnowledgeEntry(category="system", content="Application Expo SDK 54 avec FastAPI backend et MongoDB.", importance=3, source="system"),
        KnowledgeEntry(category="system", content="ARIA utilise Claude Sonnet 4.5 pour l'intelligence artificielle.", importance=3, source="system"),
    ]
    for k in default_knowledge:
        await db.knowledge_base.insert_one(k.dict())

    await log_activity("success", "system", "Donnees initiales chargees")
    return {"status": "seeded", "automations": len(defaults), "knowledge": len(default_knowledge)}

# ===== APP CONFIG =====
app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup():
    await db.chat_messages.create_index("session_id")
    await db.chat_messages.create_index("timestamp")
    await db.knowledge_base.create_index("category")
    await db.activity_logs.create_index("timestamp")
    await db.automations.create_index("active")
    logger.info("ARIA Backend started")

@app.on_event("shutdown")
async def shutdown():
    client.close()
