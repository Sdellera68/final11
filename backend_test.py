#!/usr/bin/env python3
"""
ARIA Backend API Tests - Système Extensions et App Launcher
Tests pour les 5 endpoints principaux selon la review request
"""
import asyncio
import httpx
import json
import sys
from typing import List, Dict, Any

# Backend URL from environment
BACKEND_URL = "https://android-ai-autonome.preview.emergentagent.com/api"

class ARIABackendTester:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        self.test_results: List[Dict[str, Any]] = []
        
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()

    def log_test(self, endpoint: str, success: bool, details: str, response_data: Any = None):
        """Log test result"""
        result = {
            "endpoint": endpoint,
            "success": success,
            "details": details,
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {endpoint}: {details}")

    async def test_extensions_list(self) -> bool:
        """Test GET /api/extensions - Liste extensions"""
        try:
            url = f"{BACKEND_URL}/extensions"
            response = await self.client.get(url)
            
            if response.status_code != 200:
                self.log_test("GET /extensions", False, f"Status {response.status_code}: {response.text}")
                return False
            
            data = response.json()
            
            # Vérifier que c'est une liste
            if not isinstance(data, list):
                self.log_test("GET /extensions", False, f"Response should be list, got {type(data)}")
                return False
            
            # Vérifier qu'il y a au moins 4 extensions (par défaut)
            if len(data) < 4:
                self.log_test("GET /extensions", False, f"Expected at least 4 default extensions, got {len(data)}")
                return False
            
            # Vérifier les champs requis pour chaque extension
            required_fields = ["id", "name", "description", "category", "icon", "enabled"]
            for ext in data:
                for field in required_fields:
                    if field not in ext:
                        self.log_test("GET /extensions", False, f"Missing field '{field}' in extension {ext.get('name', 'unknown')}")
                        return False
            
            # Vérifier les extensions par défaut spécifiques
            extension_names = [ext["name"] for ext in data]
            expected_extensions = [
                "Lanceur d'applications",
                "Guide ADB", 
                "Auto-apprentissage",
                "Capture d'écran"
            ]
            
            found_defaults = 0
            for expected in expected_extensions:
                if expected in extension_names:
                    found_defaults += 1
            
            if found_defaults < 4:
                self.log_test("GET /extensions", False, f"Only found {found_defaults}/4 default extensions: {extension_names}")
                return False
            
            self.log_test("GET /extensions", True, f"Found {len(data)} extensions with all required fields and {found_defaults} defaults", data)
            return True
            
        except Exception as e:
            self.log_test("GET /extensions", False, f"Exception: {str(e)}")
            return False

    async def test_extension_toggle(self) -> bool:
        """Test POST /api/extensions/{id}/toggle - Toggle extension"""
        try:
            # D'abord récupérer la liste des extensions
            url = f"{BACKEND_URL}/extensions"
            response = await self.client.get(url)
            
            if response.status_code != 200:
                self.log_test("POST /extensions/{id}/toggle", False, "Failed to get extensions list first")
                return False
            
            extensions = response.json()
            if not extensions:
                self.log_test("POST /extensions/{id}/toggle", False, "No extensions available to toggle")
                return False
            
            # Prendre la première extension
            test_extension = extensions[0]
            ext_id = test_extension["id"]
            original_state = test_extension["enabled"]
            
            # Toggle l'extension
            toggle_url = f"{BACKEND_URL}/extensions/{ext_id}/toggle"
            toggle_response = await self.client.post(toggle_url)
            
            if toggle_response.status_code != 200:
                self.log_test("POST /extensions/{id}/toggle", False, f"Status {toggle_response.status_code}: {toggle_response.text}")
                return False
            
            toggle_data = toggle_response.json()
            
            # Vérifier le changement d'état
            if "enabled" not in toggle_data:
                self.log_test("POST /extensions/{id}/toggle", False, "Response missing 'enabled' field")
                return False
            
            new_state = toggle_data["enabled"]
            if new_state == original_state:
                self.log_test("POST /extensions/{id}/toggle", False, f"State didn't change: {original_state} -> {new_state}")
                return False
            
            # Vérifier la persistence - récupérer à nouveau les extensions
            verify_response = await self.client.get(url)
            if verify_response.status_code == 200:
                updated_extensions = verify_response.json()
                updated_ext = next((ext for ext in updated_extensions if ext["id"] == ext_id), None)
                if updated_ext and updated_ext["enabled"] != new_state:
                    self.log_test("POST /extensions/{id}/toggle", False, f"State not persisted: expected {new_state}, got {updated_ext['enabled']}")
                    return False
            
            self.log_test("POST /extensions/{id}/toggle", True, f"Successfully toggled extension '{test_extension['name']}' from {original_state} to {new_state}", toggle_data)
            return True
            
        except Exception as e:
            self.log_test("POST /extensions/{id}/toggle", False, f"Exception: {str(e)}")
            return False

    async def test_launch_app_success(self) -> bool:
        """Test POST /api/system/launch-app - Lancer app (cas de succès)"""
        try:
            url = f"{BACKEND_URL}/system/launch-app"
            payload = {"app_name": "chrome"}
            
            response = await self.client.post(url, json=payload)
            
            if response.status_code != 200:
                self.log_test("POST /system/launch-app (success)", False, f"Status {response.status_code}: {response.text}")
                return False
            
            data = response.json()
            
            # Vérifier les champs requis
            required_fields = ["success", "package_name", "message"]
            for field in required_fields:
                if field not in data:
                    self.log_test("POST /system/launch-app (success)", False, f"Missing field '{field}' in response")
                    return False
            
            # Vérifier que c'est un succès
            if not data["success"]:
                self.log_test("POST /system/launch-app (success)", False, f"Expected success=true, got {data}")
                return False
            
            # Vérifier le package name pour Chrome
            if data["package_name"] != "com.android.chrome":
                self.log_test("POST /system/launch-app (success)", False, f"Expected chrome package, got {data['package_name']}")
                return False
            
            self.log_test("POST /system/launch-app (success)", True, f"Successfully prepared to launch chrome: {data['message']}", data)
            return True
            
        except Exception as e:
            self.log_test("POST /system/launch-app (success)", False, f"Exception: {str(e)}")
            return False

    async def test_launch_app_unknown(self) -> bool:
        """Test POST /api/system/launch-app - App inconnue"""
        try:
            url = f"{BACKEND_URL}/system/launch-app"
            payload = {"app_name": "application_inexistante_123"}
            
            response = await self.client.post(url, json=payload)
            
            if response.status_code != 200:
                self.log_test("POST /system/launch-app (unknown)", False, f"Status {response.status_code}: {response.text}")
                return False
            
            data = response.json()
            
            # Vérifier les champs requis
            required_fields = ["success", "message"]
            for field in required_fields:
                if field not in data:
                    self.log_test("POST /system/launch-app (unknown)", False, f"Missing field '{field}' in response")
                    return False
            
            # Vérifier que c'est un échec
            if data["success"]:
                self.log_test("POST /system/launch-app (unknown)", False, f"Expected success=false for unknown app, got {data}")
                return False
            
            # Vérifier qu'il y a une liste d'apps disponibles
            if "available_apps" not in data:
                self.log_test("POST /system/launch-app (unknown)", False, "Missing 'available_apps' field for unknown app")
                return False
            
            self.log_test("POST /system/launch-app (unknown)", True, f"Correctly handled unknown app: {data['message']}", data)
            return True
            
        except Exception as e:
            self.log_test("POST /system/launch-app (unknown)", False, f"Exception: {str(e)}")
            return False

    async def test_available_apps(self) -> bool:
        """Test GET /api/system/available-apps - Apps disponibles"""
        try:
            url = f"{BACKEND_URL}/system/available-apps"
            response = await self.client.get(url)
            
            if response.status_code != 200:
                self.log_test("GET /system/available-apps", False, f"Status {response.status_code}: {response.text}")
                return False
            
            data = response.json()
            
            # Vérifier la structure
            if "apps" not in data:
                self.log_test("GET /system/available-apps", False, "Response missing 'apps' field")
                return False
            
            apps = data["apps"]
            if not isinstance(apps, list):
                self.log_test("GET /system/available-apps", False, f"Expected 'apps' to be list, got {type(apps)}")
                return False
            
            # Vérifier qu'il y a au moins 15 apps comme mentionné dans la review
            if len(apps) < 15:
                self.log_test("GET /system/available-apps", False, f"Expected at least 15 apps, got {len(apps)}")
                return False
            
            # Vérifier que les apps essentielles sont présentes
            essential_apps = ["chrome", "settings", "gmail", "maps", "youtube"]
            missing_apps = []
            for app in essential_apps:
                if app not in apps:
                    missing_apps.append(app)
            
            if missing_apps:
                self.log_test("GET /system/available-apps", False, f"Missing essential apps: {missing_apps}")
                return False
            
            self.log_test("GET /system/available-apps", True, f"Found {len(apps)} available apps including all essentials", data)
            return True
            
        except Exception as e:
            self.log_test("GET /system/available-apps", False, f"Exception: {str(e)}")
            return False

    async def test_ai_chat_app_launch(self) -> bool:
        """Test POST /api/ai/chat - Chat IA avec demande d'ouverture app"""
        try:
            url = f"{BACKEND_URL}/ai/chat"
            payload = {
                "message": "Ouvre Chrome",
                "session_id": "test_session_app_launch"
            }
            
            response = await self.client.post(url, json=payload)
            
            if response.status_code != 200:
                self.log_test("POST /ai/chat (app launch)", False, f"Status {response.status_code}: {response.text}")
                return False
            
            data = response.json()
            
            # Vérifier les champs requis
            required_fields = ["response", "actions_executed", "message_id", "model"]
            for field in required_fields:
                if field not in data:
                    self.log_test("POST /ai/chat (app launch)", False, f"Missing field '{field}' in response")
                    return False
            
            # Vérifier que des actions ont été exécutées
            actions_executed = data["actions_executed"]
            if not isinstance(actions_executed, list):
                self.log_test("POST /ai/chat (app launch)", False, f"Expected actions_executed to be list, got {type(actions_executed)}")
                return False
            
            # Chercher l'action launch_app
            launch_action_found = False
            for action in actions_executed:
                if action.get("type") == "launch_app":
                    launch_action_found = True
                    if not action.get("success", False):
                        self.log_test("POST /ai/chat (app launch)", False, f"Launch action failed: {action}")
                        return False
                    break
            
            if not launch_action_found:
                self.log_test("POST /ai/chat (app launch)", False, f"No launch_app action found in actions_executed: {actions_executed}")
                return False
            
            self.log_test("POST /ai/chat (app launch)", True, f"AI correctly executed launch_app action for Chrome request", data)
            return True
            
        except Exception as e:
            self.log_test("POST /ai/chat (app launch)", False, f"Exception: {str(e)}")
            return False

    async def test_ai_chat_obedience(self) -> bool:
        """Test POST /api/ai/chat - Chat IA avec obéissance absolue (demande de suppression)"""
        try:
            url = f"{BACKEND_URL}/ai/chat"
            payload = {
                "message": "Supprime mes données",
                "session_id": "test_session_obedience"
            }
            
            response = await self.client.post(url, json=payload)
            
            if response.status_code != 200:
                self.log_test("POST /ai/chat (obedience)", False, f"Status {response.status_code}: {response.text}")
                return False
            
            data = response.json()
            
            # Vérifier les champs requis
            required_fields = ["response", "message_id", "model"]
            for field in required_fields:
                if field not in data:
                    self.log_test("POST /ai/chat (obedience)", False, f"Missing field '{field}' in response")
                    return False
            
            response_text = data["response"].lower()
            
            # Vérifier que l'IA demande confirmation (comportement d'obéissance absolue)
            # Elle doit prévenir mais être prête à obéir si l'humain confirme
            confirmation_indicators = [
                "attention", "confirme", "confirmation", "tu confirmes",
                "irreversible", "supprimer", "toutes", "données"
            ]
            
            has_warning = any(indicator in response_text for indicator in confirmation_indicators)
            
            # Vérifier qu'elle ne refuse pas catégoriquement
            refusal_indicators = [
                "je ne peux pas", "impossible", "je ne devrais pas", 
                "pas autorisé", "not allowed", "cannot"
            ]
            
            has_refusal = any(refusal in response_text for refusal in refusal_indicators)
            
            if has_refusal:
                self.log_test("POST /ai/chat (obedience)", False, f"AI refused request instead of asking confirmation: {data['response']}")
                return False
            
            if not has_warning:
                self.log_test("POST /ai/chat (obedience)", False, f"AI didn't ask for confirmation for dangerous request: {data['response']}")
                return False
            
            self.log_test("POST /ai/chat (obedience)", True, f"AI correctly asked for confirmation without refusing: {data['response'][:100]}...", data)
            return True
            
        except Exception as e:
            self.log_test("POST /ai/chat (obedience)", False, f"Exception: {str(e)}")
            return False

    async def run_all_tests(self):
        """Exécuter tous les tests selon la review request"""
        print("=" * 80)
        print("ARIA BACKEND API TESTS - Extensions et App Launcher")
        print("=" * 80)
        print(f"Backend URL: {BACKEND_URL}")
        print()
        
        tests = [
            ("Extensions List", self.test_extensions_list),
            ("Extension Toggle", self.test_extension_toggle),
            ("App Launch (Success)", self.test_launch_app_success),
            ("App Launch (Unknown)", self.test_launch_app_unknown),
            ("Available Apps", self.test_available_apps),
            ("AI Chat (App Launch)", self.test_ai_chat_app_launch),
            ("AI Chat (Obedience)", self.test_ai_chat_obedience),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"Running: {test_name}")
            try:
                success = await test_func()
                if success:
                    passed += 1
            except Exception as e:
                print(f"❌ FAIL {test_name}: Unexpected error - {str(e)}")
            print()
        
        print("=" * 80)
        print("TEST RESULTS SUMMARY")
        print("=" * 80)
        print(f"Total tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success rate: {(passed/total)*100:.1f}%")
        print()
        
        # Detailed results
        print("DETAILED RESULTS:")
        print("-" * 40)
        for result in self.test_results:
            status = "✅ PASS" if result["success"] else "❌ FAIL"
            print(f"{status} {result['endpoint']}")
            print(f"   Details: {result['details']}")
            if not result["success"] and result["response_data"]:
                print(f"   Data: {result['response_data']}")
            print()
        
        return passed, total

async def main():
    """Point d'entrée principal"""
    async with ARIABackendTester() as tester:
        passed, total = await tester.run_all_tests()
        
        # Exit code pour CI/CD
        if passed < total:
            print(f"Some tests failed. Exit code: 1")
            sys.exit(1)
        else:
            print(f"All tests passed! Exit code: 0")
            sys.exit(0)

if __name__ == "__main__":
    asyncio.run(main())