from app.core.security import hash_code, hash_password, verify_code, verify_password

def test_password_hash_roundtrip() -> None:
    hashed = hash_password("secret123")
    assert verify_password("secret123", hashed)
    assert not verify_password("wrong", hashed)


def test_invite_code_hash_roundtrip() -> None:
    hashed = hash_code("DEMO2026")
    assert verify_code("demo2026", hashed)
    assert not verify_code("OTHER", hashed)
