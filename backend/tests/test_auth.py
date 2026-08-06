"""
Tests for Authentication Module
Tests: signup, login, password hashing, JWT, CAPTCHA
"""
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.routes.auth import (
    hash_password,
    verify_jwt,
    create_jwt,
    gen_user_id,
    b64url_encode,
    b64url_decode
)


class TestPasswordHashing:
    """Test password hashing functionality"""
    
    def test_hash_password_returns_string(self):
        """Password hash should return a string"""
        result = hash_password("test123")
        assert isinstance(result, str)
        assert len(result) == 64  # SHA-256 hex length
    
    def test_same_password_same_hash(self):
        """Same password should always produce same hash"""
        hash1 = hash_password("mypassword")
        hash2 = hash_password("mypassword")
        assert hash1 == hash2
    
    def test_different_passwords_different_hashes(self):
        """Different passwords should have different hashes"""
        hash1 = hash_password("password1")
        hash2 = hash_password("password2")
        assert hash1 != hash2
    
    def test_empty_password(self):
        """Empty password should still produce valid hash"""
        result = hash_password("")
        assert len(result) == 64


class TestJWT:
    """Test JWT token creation and verification"""
    
    def test_create_jwt_returns_string(self):
        """JWT creation should return string"""
        token = create_jwt("user123", "test@example.com")
        assert isinstance(token, str)
        assert len(token) > 50
    
    def test_jwt_has_three_parts(self):
        """JWT should have 3 parts separated by dots"""
        token = create_jwt("user123", "test@example.com")
        parts = token.split(".")
        assert len(parts) == 3
    
    def test_verify_valid_jwt(self):
        """Valid JWT should be verified successfully"""
        token = create_jwt("user123", "test@example.com")
        payload = verify_jwt(token)
        assert payload is not None
        assert payload["user_id"] == "user123"
        assert payload["email"] == "test@example.com"
    
    def test_verify_invalid_jwt(self):
        """Invalid JWT should return None"""
        result = verify_jwt("invalid.token.here")
        assert result is None
    
    def test_verify_tampered_jwt(self):
        """Tampered JWT should fail verification"""
        token = create_jwt("user123", "test@example.com")
        # Tamper with token
        tampered = token[:-5] + "XXXXX"
        result = verify_jwt(tampered)
        assert result is None


class TestUserIdGeneration:
    """Test user ID generation"""
    
    def test_generates_string(self):
        """User ID should be a string"""
        uid = gen_user_id()
        assert isinstance(uid, str)
    
    def test_correct_length(self):
        """User ID should be 16 chars (8 bytes hex)"""
        uid = gen_user_id()
        assert len(uid) == 16
    
    def test_unique_ids(self):
        """Each user ID should be unique"""
        ids = [gen_user_id() for _ in range(100)]
        assert len(set(ids)) == 100


class TestBase64Encoding:
    """Test URL-safe base64 encoding"""
    
    def test_encode_decode_roundtrip(self):
        """Encoded data should decode to original"""
        original = b"Hello, World!"
        encoded = b64url_encode(original)
        decoded = b64url_decode(encoded)
        assert decoded == original
    
    def test_encode_removes_padding(self):
        """Encoded string should not contain padding (=)"""
        encoded = b64url_encode(b"test")
        assert "=" not in encoded


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
