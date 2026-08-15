"""Helpers Class."""

import re
import time
import uuid


class Helpers:
    """Helpers class."""

    @staticmethod
    def generate_transaction_id(email: str, telegram_id: str) -> str:
        """Create a unique input string by combining the email and telegram ID."""
        current_time = str(time.time())
        unique_input = f"{email}-{telegram_id}-{current_time}"
        namespace = uuid.NAMESPACE_OID
        unique_hash = uuid.uuid5(namespace, unique_input).hex
        allowed_id = re.sub(r"[^a-zA-Z0-9-.=]", "-", unique_hash)

        return allowed_id

    @staticmethod
    def generate_n_digit_uuid(value: int) -> str:
        """Generate n digit uuid."""
        return str(uuid.uuid4().hex[:value])

    @staticmethod
    def cedis_to_pesewas(amount: float) -> int:
        """1 GHS = 100 Pesewas."""
        return int(amount * 100)

    @staticmethod
    def pesewas_to_cedis(amount: int) -> float:
        """1 GHS = 100 Pesewas."""
        return amount / 100.0
