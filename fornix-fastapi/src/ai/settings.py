"""Configuration for the native AI provider layer."""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

from .models import ModelProfile, ProviderName


class AISettings(BaseSettings):
    ai_provider: ProviderName = ProviderName.OPENAI
    ai_medfind_provider: ProviderName = ProviderName.OPENAI

    openai_api_key: SecretStr | None = None
    openai_model_default: str = "gpt-4o"
    openai_model_fast: str | None = None
    openai_model_structured: str | None = None
    openai_model_vision: str | None = None

    gemini_api_key: SecretStr | None = None
    gemini_model_default: str | None = None
    gemini_model_fast: str | None = None
    gemini_model_structured: str | None = None
    gemini_model_vision: str | None = None

    ai_timeout_seconds: float = Field(default=60.0, gt=0)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    def model_map(self, provider: ProviderName) -> dict[ModelProfile, str]:
        prefix = provider.value
        default = getattr(self, f"{prefix}_model_default")
        if not default:
            return {}
        result = {ModelProfile.DEFAULT: default}
        for profile in (
            ModelProfile.FAST,
            ModelProfile.STRUCTURED,
            ModelProfile.VISION,
        ):
            value = getattr(self, f"{prefix}_model_{profile.value}")
            if value:
                result[profile] = value
        return result

    def api_key(self, provider: ProviderName) -> str | None:
        value = getattr(self, f"{provider.value}_api_key")
        return value.get_secret_value() if value else None


@lru_cache
def get_ai_settings() -> AISettings:
    return AISettings()
