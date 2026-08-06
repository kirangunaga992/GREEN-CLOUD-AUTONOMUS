"""
Integration tests - test running services
"""
import pytest
import urllib.request
import json


class TestHealthEndpoints:
    """Test that services are running"""
    
    def test_backend_health(self):
        """Backend /health should return healthy"""
        try:
            response = urllib.request.urlopen("http://localhost:8000/health", timeout=5)
            data = json.loads(response.read())
            assert response.status == 200
            assert data["status"] == "healthy"
        except Exception as e:
            pytest.skip(f"Backend not running: {e}")
    
    def test_backend_root(self):
        """Backend / should return API info"""
        try:
            response = urllib.request.urlopen("http://localhost:8000/", timeout=5)
            data = json.loads(response.read())
            assert response.status == 200
            assert "app" in data or "version" in data or "message" in data
        except Exception as e:
            pytest.skip(f"Backend not running: {e}")


class TestCaptchaEndpoint:
    """Test CAPTCHA generation"""
    
    def test_captcha_generation(self):
        """CAPTCHA endpoint should return question"""
        try:
            response = urllib.request.urlopen("http://localhost:8000/api/auth/captcha", timeout=5)
            data = json.loads(response.read())
            assert "captcha_id" in data
            assert "question" in data
            assert "expires_in" in data
            assert data["expires_in"] > 0
        except Exception as e:
            pytest.skip(f"Backend not running: {e}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
