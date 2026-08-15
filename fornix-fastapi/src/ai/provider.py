"""The provider-neutral interface."""

from __future__ import annotations

from collections.abc import AsyncIterator, Mapping
from typing import Protocol, runtime_checkable

from .capabilities import ProviderCapabilities
from .events import AIStreamEvent
from .errors import AIConfigurationError
from .models import AIRequest, AIResponse, ModelProfile, ProviderName


@runtime_checkable
class AIProvider(Protocol):
    name: ProviderName
    capabilities: ProviderCapabilities

    async def generate(self, request: AIRequest) -> AIResponse:
        ...

    def stream(self, request: AIRequest) -> AsyncIterator[AIStreamEvent]:
        ...


def normalize_model_map(
    models: Mapping[ModelProfile | str, str],
) -> dict[ModelProfile, str]:
    normalized = {ModelProfile(key): value for key, value in models.items() if value}
    if ModelProfile.DEFAULT not in normalized:
        raise AIConfigurationError("a default model must be configured")
    return normalized


def resolve_model(
    models: Mapping[ModelProfile, str], profile: ModelProfile
) -> str:
    return models.get(profile, models[ModelProfile.DEFAULT])
