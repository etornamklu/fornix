"""Provider construction kept outside routers and workflows."""

from __future__ import annotations

from typing import Any

from .errors import AIConfigurationError
from .models import ProviderName
from .provider import AIProvider
from .settings import AISettings, get_ai_settings


def create_ai_provider(
    settings: AISettings | None = None,
    *,
    provider: ProviderName | str | None = None,
    client: Any | None = None,
) -> AIProvider:
    settings = settings or get_ai_settings()
    provider_value = settings.ai_provider if provider is None else provider
    try:
        selected_provider = ProviderName(provider_value)
    except ValueError as exc:
        raise AIConfigurationError(f"unsupported AI provider: {provider}") from exc

    models = settings.model_map(selected_provider)
    if not models:
        raise AIConfigurationError(
            f"no models are configured for {selected_provider.value}",
            provider=selected_provider,
        )

    api_key = settings.api_key(selected_provider)
    if client is None and not api_key:
        raise AIConfigurationError(
            f"{selected_provider.value} API key is required",
            provider=selected_provider,
        )

    if selected_provider is ProviderName.OPENAI:
        from .providers.openai import OpenAIProvider

        return OpenAIProvider(
            api_key=api_key,
            models=models,
            timeout=settings.ai_timeout_seconds,
            client=client,
        )

    if selected_provider is ProviderName.GEMINI:
        from .providers.gemini import GeminiProvider

        return GeminiProvider(
            api_key=api_key,
            models=models,
            timeout=settings.ai_timeout_seconds,
            client=client,
        )

    raise AIConfigurationError(f"unsupported AI provider: {selected_provider}")
