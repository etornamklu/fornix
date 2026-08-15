from pydantic_settings import BaseSettings, SettingsConfigDict


env_path = ".env"


class Settings(BaseSettings):
    db_user: str
    db_password: str
    db_name: str
    db_host: str
    db_port: int
    openai_api_key: str
    llm: str = "gpt-4o"
    llm_provider: str = "openai"
    llm_temperature: float
    langchain_tracing_v2: bool
    langchain_endpoint: str
    tavily_api_key: str
    assemblyai_api_key: str
    access_token_expire_minutes: int
    algorithm: str
    secret_key: str
    redis_url: str
    external_api_key: str

    model_config = SettingsConfigDict(
        env_file=env_path,
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def database_url(self):
        return f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"


def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
