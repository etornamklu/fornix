# FornixAI FastAPI Server

API Wrapper for FornixAI

## Steps to run

1. Clone the repository
2. Install the dependencies in the requirements.txt file
3. Copy `.env.sample` to `.env` and configure an AI provider
4. Run ```uvicorn main:app --reload```
*Outputs from the model are in Pydantic model*

## Local PostgreSQL and Redis

Copy the sample environment file, then start both backing services:

```bash
cp .env.sample .env
docker compose up -d
docker compose ps
```

The defaults expose PostgreSQL at `localhost:5432` and Redis at
`localhost:6379`. Data is retained in named Docker volumes when the containers
are stopped:

```bash
docker compose down
```

The application runs Alembic migrations during startup. You can also run them
manually with `alembic upgrade head` after PostgreSQL becomes healthy.

## Provider-neutral AI interface

New AI workflows should import from `src.ai`, not from a provider SDK or an AI
framework. Configure both providers and select one as the application default:

```env
AI_PROVIDER=openai
AI_MEDFIND_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_MODEL_DEFAULT=gpt-4o
GEMINI_API_KEY=...
GEMINI_MODEL_DEFAULT=your-gemini-model
```

Callers use the same request and response types for both providers:

```python
from src.ai import AIMessage, AIRequest, Role, create_ai_provider

provider = create_ai_provider()
response = await provider.generate(
    AIRequest(messages=[AIMessage.text(Role.USER, "Hello")])
)
print(response.text)
```

Different tasks can explicitly select and reuse either configured provider:

```python
from src.ai import ProviderName, get_ai_provider_registry

providers = get_ai_provider_registry()
chat_provider = providers.get(ProviderName.OPENAI)
report_provider = providers.get(ProviderName.GEMINI)

chat_response = await chat_provider.generate(chat_request)
report_response = await report_provider.generate(report_request)
```

Use `providers.default()` when a task should follow `AI_PROVIDER`. Providers are
constructed lazily, so credentials and models are checked only when that provider
is first used.

The patient Medfind route uses `AI_MEDFIND_PROVIDER`, allowing it to use OpenAI or
Gemini independently of the application default.

The interface also supports inline images, Pydantic response schemas, function
tools, model profiles, normalized usage, and streaming via `provider.stream()`.
Existing LangChain workflows are unchanged and can be migrated incrementally.
