import pytest
import requests
import time

# Module: Core API endpoints for ARIA

class TestHealthAndStats:
    """Health check and stats endpoints"""

    def test_stats_endpoint(self, base_url, api_client):
        """Test /api/stats returns correct structure"""
        response = api_client.get(f"{base_url}/api/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "messages" in data
        assert "knowledge" in data
        assert "automations" in data
        assert "active_automations" in data
        assert "logs" in data
        assert "recent_logs" in data
        assert "system_status" in data
        
        # Verify seeded data exists
        assert data["automations"] >= 3, "Expected 3 default automations from seed"
        assert data["knowledge"] >= 2, "Expected 2 default knowledge entries from seed"
        print(f"✓ Stats endpoint working: {data['automations']} automations, {data['knowledge']} knowledge entries")


class TestAutomations:
    """Automation CRUD operations"""

    def test_get_automations(self, base_url, api_client):
        """Test GET /api/automations returns list"""
        response = api_client.get(f"{base_url}/api/automations")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3, "Should have at least 3 seeded automations"
        
        # Validate structure
        for auto in data:
            assert "id" in auto
            assert "name" in auto
            assert "trigger_type" in auto
            assert "action_type" in auto
            assert "active" in auto
            assert isinstance(auto["active"], bool)
        print(f"✓ GET automations: {len(data)} automations found")

    def test_create_automation_and_verify(self, base_url, api_client):
        """Test POST /api/automations creates and persists data"""
        payload = {
            "name": "TEST_Battery_Alert",
            "description": "Test automation for low battery",
            "trigger_type": "battery",
            "trigger_config": {"threshold": 15, "condition": "below"},
            "action_type": "notification",
            "action_config": {"title": "Test Alert", "body": "Battery low"}
        }
        
        # Create
        create_response = api_client.post(f"{base_url}/api/automations", json=payload)
        assert create_response.status_code == 200
        
        created = create_response.json()
        assert "id" in created
        assert created["status"] == "created"
        auto_id = created["id"]
        
        # Verify persistence with GET
        get_response = api_client.get(f"{base_url}/api/automations")
        assert get_response.status_code == 200
        
        automations = get_response.json()
        found = next((a for a in automations if a["id"] == auto_id), None)
        assert found is not None, "Created automation should be retrievable"
        assert found["name"] == payload["name"]
        assert found["trigger_type"] == payload["trigger_type"]
        assert found["active"] is True
        print(f"✓ Created automation {auto_id} and verified persistence")
        
        # Cleanup
        api_client.delete(f"{base_url}/api/automations/{auto_id}")

    def test_toggle_automation(self, base_url, api_client):
        """Test POST /api/automations/{id}/toggle changes state"""
        # Get first automation
        response = api_client.get(f"{base_url}/api/automations")
        automations = response.json()
        if not automations:
            pytest.skip("No automations available to test toggle")
        
        auto = automations[0]
        auto_id = auto["id"]
        initial_state = auto["active"]
        
        # Toggle
        toggle_response = api_client.post(f"{base_url}/api/automations/{auto_id}/toggle")
        assert toggle_response.status_code == 200
        
        toggle_data = toggle_response.json()
        assert "active" in toggle_data
        assert toggle_data["active"] != initial_state
        
        # Verify with GET
        get_response = api_client.get(f"{base_url}/api/automations")
        automations = get_response.json()
        updated = next((a for a in automations if a["id"] == auto_id), None)
        assert updated["active"] == toggle_data["active"]
        print(f"✓ Toggled automation {auto_id}: {initial_state} -> {updated['active']}")
        
        # Toggle back
        api_client.post(f"{base_url}/api/automations/{auto_id}/toggle")

    def test_delete_automation(self, base_url, api_client):
        """Test DELETE /api/automations/{id} removes automation"""
        # Create test automation
        payload = {
            "name": "TEST_Delete_Me",
            "description": "Will be deleted",
            "trigger_type": "network",
            "trigger_config": {"connected": False},
            "action_type": "log",
            "action_config": {"message": "test"}
        }
        create_response = api_client.post(f"{base_url}/api/automations", json=payload)
        auto_id = create_response.json()["id"]
        
        # Delete
        delete_response = api_client.delete(f"{base_url}/api/automations/{auto_id}")
        assert delete_response.status_code == 200
        
        # Verify deletion with GET
        get_response = api_client.get(f"{base_url}/api/automations")
        automations = get_response.json()
        found = next((a for a in automations if a["id"] == auto_id), None)
        assert found is None, "Deleted automation should not be retrievable"
        print(f"✓ Deleted automation {auto_id} and verified removal")


class TestKnowledge:
    """Knowledge base operations"""

    def test_get_knowledge(self, base_url, api_client):
        """Test GET /api/ai/knowledge returns list"""
        response = api_client.get(f"{base_url}/api/ai/knowledge")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2, "Should have at least 2 seeded knowledge entries"
        
        for entry in data:
            assert "id" in entry
            assert "category" in entry
            assert "content" in entry
            assert "importance" in entry
        print(f"✓ GET knowledge: {len(data)} entries found")

    def test_add_knowledge_and_verify(self, base_url, api_client):
        """Test POST /api/ai/knowledge creates entry"""
        payload = {
            "category": "test",
            "content": "TEST_Knowledge_Entry",
            "importance": 3,
            "source": "test_suite"
        }
        
        # Create
        create_response = api_client.post(f"{base_url}/api/ai/knowledge", json=payload)
        assert create_response.status_code == 200
        
        created = create_response.json()
        assert "id" in created
        assert created["status"] == "added"
        entry_id = created["id"]
        
        # Verify with GET
        get_response = api_client.get(f"{base_url}/api/ai/knowledge")
        knowledge = get_response.json()
        found = next((k for k in knowledge if k["id"] == entry_id), None)
        assert found is not None
        assert found["content"] == payload["content"]
        print(f"✓ Created knowledge entry {entry_id} and verified")
        
        # Cleanup
        api_client.delete(f"{base_url}/api/ai/knowledge/{entry_id}")

    def test_delete_knowledge(self, base_url, api_client):
        """Test DELETE /api/ai/knowledge/{id}"""
        # Create entry
        payload = {"category": "test", "content": "TEST_Delete", "importance": 1}
        create_response = api_client.post(f"{base_url}/api/ai/knowledge", json=payload)
        entry_id = create_response.json()["id"]
        
        # Delete
        delete_response = api_client.delete(f"{base_url}/api/ai/knowledge/{entry_id}")
        assert delete_response.status_code == 200
        
        # Verify with GET
        get_response = api_client.get(f"{base_url}/api/ai/knowledge")
        knowledge = get_response.json()
        found = next((k for k in knowledge if k["id"] == entry_id), None)
        assert found is None
        print(f"✓ Deleted knowledge entry {entry_id}")


class TestLogs:
    """Activity logs operations"""

    def test_get_logs(self, base_url, api_client):
        """Test GET /api/logs returns list"""
        response = api_client.get(f"{base_url}/api/logs?limit=100")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET logs: {len(data)} log entries")

    def test_get_logs_with_filter(self, base_url, api_client):
        """Test GET /api/logs with type filter"""
        response = api_client.get(f"{base_url}/api/logs?limit=50&log_type=success")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        # All entries should be success type if any exist
        if data:
            for log in data:
                assert log["type"] == "success"
        print(f"✓ GET logs with filter: {len(data)} success logs")

    def test_create_log_and_verify(self, base_url, api_client):
        """Test POST /api/logs creates entry"""
        payload = {
            "type": "info",
            "module": "test",
            "message": "TEST_Log_Entry",
            "details": {"test": True}
        }
        
        # Create
        create_response = api_client.post(f"{base_url}/api/logs", json=payload)
        assert create_response.status_code == 200
        
        created = create_response.json()
        assert "id" in created
        log_id = created["id"]
        
        # Verify with GET
        get_response = api_client.get(f"{base_url}/api/logs?limit=200")
        logs = get_response.json()
        found = next((l for l in logs if l["id"] == log_id), None)
        assert found is not None
        assert found["message"] == payload["message"]
        print(f"✓ Created log entry {log_id} and verified")


class TestAIChat:
    """AI chat functionality"""

    def test_chat_with_ai(self, base_url, api_client, test_session_id):
        """Test POST /api/ai/chat returns AI response with V2 fields"""
        payload = {
            "message": "Bonjour ARIA, comment ça va?",
            "session_id": test_session_id
        }
        
        response = api_client.post(f"{base_url}/api/ai/chat", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "response" in data
        assert "knowledge_count" in data
        assert "message_id" in data
        
        # V2 NEW FIELDS
        assert "model" in data, "V2: 'model' field must be present"
        assert data["model"] in ["claude", "mistral", "local"], f"V2: model must be claude/mistral/local, got {data['model']}"
        assert "actions_executed" in data, "V2: 'actions_executed' array must be present"
        assert isinstance(data["actions_executed"], list), "V2: actions_executed must be a list"
        
        assert len(data["response"]) > 0, "AI should return non-empty response"
        assert isinstance(data["knowledge_count"], int)
        print(f"✓ AI chat response received: {len(data['response'])} chars, knowledge_count={data['knowledge_count']}, model={data['model']}, actions={len(data['actions_executed'])}")

    def test_get_chat_history(self, base_url, api_client, test_session_id):
        """Test GET /api/ai/history returns messages with V2 model field"""
        response = api_client.get(f"{base_url}/api/ai/history?session_id={test_session_id}&limit=50")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        # Should have at least 2 messages from previous test (user + assistant)
        if len(data) >= 2:
            assert data[0]["role"] in ["user", "assistant"]
            assert "content" in data[0]
            assert "timestamp" in data[0]
            # V2: Check that assistant messages have model field
            ai_msgs = [m for m in data if m["role"] == "assistant"]
            if ai_msgs:
                assert "model" in ai_msgs[0], "V2: AI messages should have 'model' field"
                assert ai_msgs[0]["model"] in ["claude", "mistral", "local"], f"V2: model must be claude/mistral/local"
        print(f"✓ Chat history: {len(data)} messages")
    
    def test_get_chat_history_limit_500(self, base_url, api_client, test_session_id):
        """V2: Test GET /api/ai/history with limit=500 (full conversation persistence)"""
        response = api_client.get(f"{base_url}/api/ai/history?session_id={test_session_id}&limit=500")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ V2: Chat history with limit=500: {len(data)} messages retrieved")

    def test_clear_chat_history(self, base_url, api_client, test_session_id):
        """Test DELETE /api/ai/history"""
        response = api_client.delete(f"{base_url}/api/ai/history?session_id={test_session_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "deleted" in data
        print(f"✓ Cleared chat history: {data['deleted']} messages deleted")


class TestSystemStatus:
    """System status endpoints"""

    def test_update_system_status(self, base_url, api_client):
        """Test POST /api/system/status"""
        payload = {
            "battery_level": 75.0,
            "battery_charging": True,
            "network_type": "WiFi",
            "network_connected": True,
            "device_name": "TEST_Device",
            "device_model": "Test Model",
            "os_version": "16",
            "app_state": "active"
        }
        
        response = api_client.post(f"{base_url}/api/system/status", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        print(f"✓ System status updated: {data['id']}")

    def test_get_latest_status(self, base_url, api_client):
        """Test GET /api/system/status/latest"""
        response = api_client.get(f"{base_url}/api/system/status/latest")
        assert response.status_code == 200
        
        data = response.json()
        # Could be empty or have data
        if data:
            assert "battery_level" in data or "device_name" in data or "timestamp" in data
        print(f"✓ Latest system status retrieved")


class TestDocumentation:
    """Documentation generation"""

    def test_generate_documentation(self, base_url, api_client):
        """Test POST /api/documentation/generate"""
        response = api_client.post(f"{base_url}/api/documentation/generate")
        assert response.status_code == 200
        
        data = response.json()
        assert "documentation" in data
        assert "generated_at" in data
        assert len(data["documentation"]) > 100, "Documentation should be substantial"
        assert "ARIA" in data["documentation"]
        print(f"✓ Documentation generated: {len(data['documentation'])} characters")


class TestAutomationEvaluation:
    """Automation evaluation endpoint"""


class TestADBEndpoints:
    """V2: ADB wireless endpoints"""

    def test_get_adb_guide(self, base_url, api_client):
        """V2: Test GET /api/adb/guide returns guide structure"""
        response = api_client.get(f"{base_url}/api/adb/guide")
        assert response.status_code == 200
        
        data = response.json()
        assert "steps_auto" in data, "V2: Guide must have 'steps_auto' array"
        assert "steps_manual" in data, "V2: Guide must have 'steps_manual' array"
        assert "permissions_unlocked" in data, "V2: Guide must have 'permissions_unlocked' array"
        
        assert isinstance(data["steps_auto"], list)
        assert isinstance(data["steps_manual"], list)
        assert isinstance(data["permissions_unlocked"], list)
        
        assert len(data["steps_auto"]) >= 3, "Auto steps should have at least 3 steps"
        assert len(data["steps_manual"]) >= 5, "Manual steps should have at least 5 steps"
        assert len(data["permissions_unlocked"]) >= 3, "Should list several permissions"
        
        print(f"✓ V2: ADB guide returned: {len(data['steps_auto'])} auto steps, {len(data['steps_manual'])} manual steps, {len(data['permissions_unlocked'])} permissions")

    def test_adb_consent_flow(self, base_url, api_client):
        """V2: Test POST and GET /api/adb/consent"""
        # Initial state (should be False or not exist)
        get_response = api_client.get(f"{base_url}/api/adb/consent")
        assert get_response.status_code == 200
        initial_state = get_response.json()
        assert "accepted" in initial_state
        assert isinstance(initial_state["accepted"], bool)
        
        # Set consent to True
        set_response = api_client.post(f"{base_url}/api/adb/consent", json={"accepted": True})
        assert set_response.status_code == 200
        set_data = set_response.json()
        assert "status" in set_data
        assert set_data["accepted"] is True
        
        # Verify persistence
        verify_response = api_client.get(f"{base_url}/api/adb/consent")
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        assert verify_data["accepted"] is True
        
        # Set back to False (cleanup)
        api_client.post(f"{base_url}/api/adb/consent", json={"accepted": False})
        
        print(f"✓ V2: ADB consent flow working (initial={initial_state['accepted']}, set=True, verified=True)")


    def test_evaluate_automations(self, base_url, api_client):
        """Test POST /api/automations/evaluate with low battery"""
        payload = {
            "battery_level": 15.0,
            "battery_charging": False,
            "network_connected": True,
            "network_type": "WiFi",
            "app_state": "active"
        }
        
        response = api_client.post(f"{base_url}/api/automations/evaluate", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "triggered" in data
        assert "total_evaluated" in data
        assert isinstance(data["triggered"], list)
        assert data["total_evaluated"] >= 0
        print(f"✓ Automation evaluation: {len(data['triggered'])} triggered, {data['total_evaluated']} evaluated")
