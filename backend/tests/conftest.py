import pytest
import requests
import os

@pytest.fixture(scope="session")
def base_url():
    """Base URL from environment - no default to fail fast if missing"""
    url = os.environ.get('EXPO_PUBLIC_BACKEND_URL')
    if not url:
        pytest.skip("EXPO_PUBLIC_BACKEND_URL not set")
    return url.rstrip('/')

@pytest.fixture(scope="session")
def api_client():
    """Shared requests session for all tests"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture(scope="session")
def test_session_id():
    """Unique session ID for test isolation"""
    return "test_session_aria"
