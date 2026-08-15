"""Provider capability declarations and early request validation."""

from __future__ import annotations

from pydantic import BaseModel

from .errors import UnsupportedCapabilityError
from .models import AIRequest, ProviderName


class ProviderCapabilities(BaseModel):
    text: bool = True
    vision: bool = False
    streaming: bool = False
    structured_output: bool = False
    structured_streaming: bool = False
    function_calling: bool = False

    def ensure_request_supported(
        self,
        request: AIRequest,
        *,
        provider: ProviderName,
        streaming: bool,
    ) -> None:
        missing: list[str] = []
        if request.has_images and not self.vision:
            missing.append("vision")
        if streaming and not self.streaming:
            missing.append("streaming")
        if request.response_schema is not None and not self.structured_output:
            missing.append("structured_output")
        if (
            streaming
            and request.response_schema is not None
            and not self.structured_streaming
        ):
            missing.append("structured_streaming")
        if request.tools and not self.function_calling:
            missing.append("function_calling")
        if missing:
            raise UnsupportedCapabilityError(
                f"{provider.value} does not support required capabilities: "
                f"{', '.join(missing)}",
                provider=provider,
            )
