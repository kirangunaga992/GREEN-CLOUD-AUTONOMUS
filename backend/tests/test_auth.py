"""Tests for GreenOps Authentication"""
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.routes.auth import (
    hash_password,
    create_jwt,
    verify_jwt,
    gen_user_id
)


def test_hash_password():
    """Test password hashing works"""
    result = hash_password("test123")
    assert isinstance(result, str)
    assert len(result) == 64


def test_same_password_same_hash():
    """Same password gives same hash"""
    hash1 = hash_password("mypassword")
    hash2 = hash_password("mypassword")
    assert hash1 == hash2


def test_different_passwords_different_hashes():
    """Different passwords give different hashes"""
    assert hash_password("pass1") != hash_password("pass2")


def test_create_jwt_returns_string():
    """JWT is created as string"""
    token = create_jwt("user123", "test@test.com")
    assert isinstance(token, str)
    assert len(token) > 50


def test_verify_valid_jwt():
    """Valid JWT is verified"""
    token = create_jwt("user123", "test@test.com")
    payload = verify_jwt(token)
    assert payload is not None
    assert payload["user_id"] == "user123"


def test_verify_invalid_jwt():
    """Invalid JWT returns None"""
    result = verify_jwt("bad.token.here")
    assert result is None


def test_user_id_is_unique():
    """Each user ID is unique"""
    ids = [gen_user_id() for _ in range(10)]
    assert len(set(ids)) == 10


def test_user_id_length():
    """User ID is 16 characters"""
    uid = gen_user_id()
    assert len(uid) == 16
