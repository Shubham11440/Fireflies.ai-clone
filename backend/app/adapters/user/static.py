"""Static user adapter — always returns the seeded default user."""
from __future__ import annotations


class StaticUserAdapter:
    def get_default_user(self) -> dict:
        return {
            "id": "user-default",
            "name": "Default User",
            "email": "user@fireflies.local",
        }
