from types import SimpleNamespace

import pytest

from src.ai import (
    AIProviderRegistry,
    AISettings,
    ProviderName,
    create_ai_provider,
)
from src.ai.errors import AIConfigurationError
from src.ai.providers.gemini import GeminiProvider
from src.ai.providers.openai import OpenAIProvider


def test_factory_selects_openai_with_an_injected_client() -> None:
    settings = AISettings(
        ai_provider=ProviderName.OPENAI,
        openai_api_key=None,
        openai_model_default="openai-test-model",
    )

    provider = create_ai_provider(settings, client=SimpleNamespace())

    assert isinstance(provider, OpenAIProvider)


def test_factory_selects_gemini_with_an_injected_client() -> None:
    settings = AISettings(
        ai_provider=ProviderName.GEMINI,
        gemini_api_key=None,
        gemini_model_default="gemini-test-model",
    )

    provider = create_ai_provider(settings, client=SimpleNamespace())

    assert isinstance(provider, GeminiProvider)


def test_factory_requires_provider_models() -> None:
    settings = AISettings(
        ai_provider=ProviderName.GEMINI,
        gemini_api_key="test-key",
        gemini_model_default=None,
    )

    with pytest.raises(AIConfigurationError, match="no models"):
        create_ai_provider(settings)


def test_factory_can_override_the_default_provider() -> None:
    settings = AISettings(
        ai_provider=ProviderName.OPENAI,
        openai_model_default="openai-test-model",
        gemini_model_default="gemini-test-model",
    )

    provider = create_ai_provider(
        settings,
        provider=ProviderName.GEMINI,
        client=SimpleNamespace(),
    )

    assert isinstance(provider, GeminiProvider)


def test_registry_caches_both_providers_for_per_task_selection() -> None:
    settings = AISettings(
        ai_provider=ProviderName.OPENAI,
        openai_model_default="openai-test-model",
        gemini_model_default="gemini-test-model",
    )
    registry = AIProviderRegistry(
        settings,
        clients={
            ProviderName.OPENAI: SimpleNamespace(),
            ProviderName.GEMINI: SimpleNamespace(),
        },
    )

    default_provider = registry.default()
    gemini_provider = registry.get(ProviderName.GEMINI)

    assert isinstance(default_provider, OpenAIProvider)
    assert isinstance(gemini_provider, GeminiProvider)
    assert registry.get("openai") is default_provider
    assert registry.get("gemini") is gemini_provider
    assert registry.initialized_providers == (
        ProviderName.OPENAI,
        ProviderName.GEMINI,
    )


def test_registry_only_validates_a_provider_when_it_is_requested() -> None:
    settings = AISettings(
        ai_provider=ProviderName.OPENAI,
        openai_model_default="openai-test-model",
        gemini_model_default=None,
    )
    registry = AIProviderRegistry(
        settings,
        clients={ProviderName.OPENAI: SimpleNamespace()},
    )

    assert isinstance(registry.default(), OpenAIProvider)
    with pytest.raises(AIConfigurationError, match="no models"):
        registry.get(ProviderName.GEMINI)


def test_factory_rejects_an_invalid_explicit_provider() -> None:
    settings = AISettings(openai_model_default="openai-test-model")

    with pytest.raises(AIConfigurationError, match="unsupported AI provider"):
        create_ai_provider(settings, provider="")
