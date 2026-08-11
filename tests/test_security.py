"""Unit tests for password hashing and JWT session tokens.

The JWT implementation is hand-written (HMAC-SHA256 over base64url segments),
so these tests exist to prove it actually rejects the attacks it is supposed to
reject: forged signatures, tampered payloads and expired sessions.
"""

import base64
import json
import time

import pytest

from App import security


# --- Password hashing -------------------------------------------------------

def test_password_hash_is_not_the_plaintext():
    hashed = security.get_password_hash("correct horse battery staple")
    assert hashed != "correct horse battery staple"
    assert hashed.startswith("$2b$")


def test_correct_password_verifies():
    hashed = security.get_password_hash("s3cret-pass")
    assert security.verify_password("s3cret-pass", hashed) is True


def test_wrong_password_does_not_verify():
    hashed = security.get_password_hash("s3cret-pass")
    assert security.verify_password("wrong-pass", hashed) is False


def test_same_password_hashes_differently_each_time():
    """bcrypt salts every hash, so two hashes of the same password differ."""
    first = security.get_password_hash("same-password")
    second = security.get_password_hash("same-password")
    assert first != second
    assert security.verify_password("same-password", first)
    assert security.verify_password("same-password", second)


def test_verify_password_against_garbage_hash_returns_false():
    assert security.verify_password("anything", "not-a-bcrypt-hash") is False


def test_passwords_longer_than_bcrypt_limit_are_handled():
    """bcrypt truncates at 72 bytes; make sure that does not raise."""
    long_password = "a" * 200
    hashed = security.get_password_hash(long_password)
    assert security.verify_password(long_password, hashed) is True


# --- JWT: happy path --------------------------------------------------------

def test_token_roundtrip_preserves_claims():
    token = security.create_access_token({"user_id": 42, "role": "professor"})
    payload = security.decode_access_token(token)
    assert payload["user_id"] == 42
    assert payload["role"] == "professor"


def test_token_has_three_segments():
    token = security.create_access_token({"user_id": 1})
    assert len(token.split(".")) == 3


def test_token_carries_an_expiry_claim():
    token = security.create_access_token({"user_id": 1}, expires_minutes=30)
    payload = security.decode_access_token(token)
    assert payload["exp"] > time.time()


# --- JWT: rejection paths (the ones that matter) ----------------------------

def test_expired_token_is_rejected():
    token = security.create_access_token({"user_id": 1}, expires_minutes=-1)
    with pytest.raises(ValueError):
        security.decode_access_token(token)


def test_token_with_forged_signature_is_rejected():
    token = security.create_access_token({"user_id": 1, "role": "student"})
    header, payload, _ = token.split(".")
    forged = f"{header}.{payload}.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    with pytest.raises(ValueError):
        security.decode_access_token(forged)


def test_privilege_escalation_by_editing_the_payload_is_rejected():
    """A student rewriting their role to 'professor' must not pass verification."""
    token = security.create_access_token({"user_id": 7, "role": "student"})
    header, _, signature = token.split(".")

    tampered_payload = {"user_id": 7, "role": "professor", "exp": time.time() + 3600}
    encoded = base64.urlsafe_b64encode(
        json.dumps(tampered_payload).encode()
    ).rstrip(b"=").decode()

    with pytest.raises(ValueError):
        security.decode_access_token(f"{header}.{encoded}.{signature}")


def test_malformed_token_is_rejected():
    with pytest.raises(ValueError):
        security.decode_access_token("this-is-not-a-token")


def test_token_signed_with_a_different_key_is_rejected():
    token = security.create_access_token({"user_id": 1})
    original_key = security.SECRET_KEY
    try:
        security.SECRET_KEY = "a-completely-different-key"
        with pytest.raises(ValueError):
            security.decode_access_token(token)
    finally:
        security.SECRET_KEY = original_key
