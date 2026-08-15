"""Safe, normalized provider errors."""

from __future__ import annotations

from typing import Any

from .models import ProviderName


class AIProviderError(Exception):
    """Base error that never exposes prompts or provider response bodies."""

    def __init__(
        self,
        message: str,
        *,
        provider: ProviderName | None = None,
        retryable: bool = False,
        provider_request_id: str | None = None,
        cause: BaseException | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.provider = provider
        self.retryable = retryable
        self.provider_request_id = provider_request_id
        self.cause = cause
        self.details = details or {}


class AIConfigurationError(AIProviderError):
    pass


class AuthenticationError(AIProviderError):
    pass


class RateLimitError(AIProviderError):
    pass


class ProviderTimeoutError(AIProviderError):
    pass


class ProviderUnavailableError(AIProviderError):
    pass


class InvalidProviderRequestError(AIProviderError):
    pass


class UnsupportedCapabilityError(InvalidProviderRequestError):
    pass


class SafetyBlockedError(AIProviderError):
    pass


class ProviderRefusalError(AIProviderError):
    pass


class MalformedProviderResponseError(AIProviderError):
    pass
