import asyncio
from functools import lru_cache
from pathlib import Path
from typing import AsyncGenerator

from dotenv import load_dotenv
from fastapi import Depends, FastAPI
from fastapi.responses import StreamingResponse
from langchain.callbacks import AsyncIteratorCallbackHandler
from langchain.chains import ConversationChain
from langchain_openai.chat_models import ChatOpenAI
from langchain.memory import ConversationTokenBufferMemory
from langchain.prompts import (
    ChatPromptTemplate,
    MessagesPlaceholder,
    SystemMessagePromptTemplate,
)
from pydantic_settings import BaseSettings
from pydantic import BaseModel
from deprecated import deprecated

load_dotenv()


class Settings(BaseSettings):
    openai_api_key: str

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()

@deprecated(version="0.0.1", reason="No longer in use")
class StreamingConversationChain:
    def __init__(self, openai_api_key: str, temperature: float = 0.0):
        self.memories = {}
        self.openai_api_key = openai_api_key
        self.temperature = temperature

    async def generate_response(
        self, conversation_id: str, message: str
    ) -> AsyncGenerator[str, None]:
        callback_handler = AsyncIteratorCallbackHandler()
        llm = ChatOpenAI(
            temperature=self.temperature,
            model="gpt-3.5-turbo-16k",
            streaming=True,
            callbacks=[callback_handler],
            max_tokens=6000,
            api_key=self.openai_api_key,
            model_kwargs={
                "stop": ["It's important", "It is important", "Please", "Note"]
            },
        )

        memory = self.memories.get(conversation_id)
        if memory is None:
            memory = ConversationTokenBufferMemory(
                llm=llm,
                human_prefix="human",
                max_token_limit=4000,
                return_messages=True,
            )
            self.memories[conversation_id] = memory

        chain = ConversationChain(
            memory=memory, prompt=CHAT_PROMPT_TEMPLATE, llm=llm, verbose=True
        )

        run = asyncio.create_task(chain.arun(input=message))
        try:
            async for token in callback_handler.aiter():
                yield token
        except Exception as e:
            print(f"Caught Exception: {e}")
        finally:
            callback_handler.done.set()

        await run


class ChatRequest(BaseModel):
    conversation_id: str
    message: str


BASE_PATH = Path("src/core/DoctorGPT/templates")
TEMPLATE_FILE_PATH = BASE_PATH / "template_str.txt"

CHAT_PROMPT_TEMPLATE = ChatPromptTemplate.from_messages(
    [
        SystemMessagePromptTemplate.from_template_file(
            TEMPLATE_FILE_PATH, input_variables=[]
        ),
        MessagesPlaceholder(variable_name="history"),
        ("user", "{input}"),
    ]
)

app = FastAPI(dependencies=[Depends(get_settings)])

streaming_conversation_chain = StreamingConversationChain(
    openai_api_key=get_settings().openai_api_key
)


@app.post("/chat", response_class=StreamingResponse)
async def generate_response(data: ChatRequest) -> StreamingResponse:
    return StreamingResponse(
        streaming_conversation_chain.generate_response(
            data.conversation_id, data.message
        ),
        media_type="text/event-stream",
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app)
