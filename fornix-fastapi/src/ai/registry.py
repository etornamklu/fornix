"""Lazy, reusable access to multiple configured AI providers."""

from __future__ import annotations

from collections.abc import Mapping
from functools import lru_cache
from threading import Lock
from typing import Any

from .errors import AIConfigurationError
from .factory import create_ai_provider
from .models import ProviderName
from .provider import AIProvider
from .settings import AISettings, get_ai_settings


class AIProviderRegistry:
    """Construct and cache one client for each provider when first requested."""

    def __init__(
        self,
        settings: AISettings | None = None,
        *,
        clients: Mapping[ProviderName | str, Any] | None = None,
    ) -> None:
        self._settings = settings or get_ai_settings()
        try:
            self._clients = {
                ProviderName(name): client for name, client in (clients or {}).items()
            }
        except ValueError as exc:
            raise AIConfigurationError("an injected client has an invalid provider") from exc
        self._providers: dict[ProviderName, AIProvider] = {}
        self._lock = Lock()

    def get(self, provider: ProviderName | str) -> AIProvider:
        """Return a cached provider, constructing it lazily on first use."""

        try:
            selected_provider = ProviderName(provider)
        except ValueError as exc:
            raise AIConfigurationError(f"unsupported AI provider: {provider}") from exc

        existing = self._providers.get(selected_provider)
        if existing is not None:
            return existing

        with self._lock:
            existing = self._providers.get(selected_provider)
            if existing is None:
                existing = create_ai_provider(
                    self._settings,
                    provider=selected_provider,
                    client=self._clients.get(selected_provider),
                )
                self._providers[selected_provider] = existing
            return existing

    def default(self) -> AIProvider:
        """Return the provider selected by the ``AI_PROVIDER`` setting."""

        return self.get(self._settings.ai_provider)

    @property
    def initialized_providers(self) -> tuple[ProviderName, ...]:
        """Providers already constructed by this registry."""

        with self._lock:
            return tuple(self._providers)


@lru_cache
def get_ai_provider_registry() -> AIProviderRegistry:
    """Application-wide registry suitable for FastAPI dependency injection."""

    return AIProviderRegistry()
