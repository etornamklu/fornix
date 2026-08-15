from typing import Literal
from functools import lru_cache


def load_model(
    llm: Literal[
        "gpt-3.5-turbo-0125",
        "gpt-4-turbo",
        "gpt-4o",
        "claude-3-sonnet-20240229",
        "claude-3-haiku-20240307",
        "claude-3-opus-20240229",
        "Llama3-70b-8192",
    ] = "gpt-3.5-turbo-0125",
    temperature: float = 0.3,
    **kwargs,
):
    """
    Load a language model with the given parameters.

    Args:
        llm (Literal["gpt-3.5-tubo-0125", "gpt-4-turbo", "gpt-4o", "claude-3-sonnet", "claude-3-haiku", "claude-3-opus"], optional): The language model to load. Defaults to "gpt-3.5-tubo-0125".
        temperature (float, optional): The temperature to use for sampling. Defaults to 0.3.

    Returns:
        BaseChatModel: The loaded language model.
    """
    if "gpt" in llm:
        try:
            from langchain_openai.chat_models import ChatOpenAI
        except ImportError:
            raise ImportError(
                "Please install the 'langchain-openai' package to use OpenAI language models. Run 'pip install langchain-openai' to install the package."
            )

        return ChatOpenAI(model=llm, temperature=temperature, streaming=True, **kwargs)
    elif "claude" in llm:
        try:
            from langchain_anthropic.chat_models import ChatAnthropic
        except ImportError:
            raise ImportError(
                "Please install the 'langchain-claude' package to use Claude language models. Run 'pip install langchain-claude' to install the package."
            )

        return ChatAnthropic(
            model=llm, temperature=temperature, streaming=True, **kwargs
        )
    elif "Llama" in llm:
        try:
            from langchain_groq.chat_models import ChatGroq
        except ImportError:
            raise ImportError(
                "Please install the 'langchain-llama' package to use Llama language models. Run 'pip install langchain-llama' to install the package."
            )

        return ChatGroq(model=llm, temperature=temperature, streaming=True, **kwargs)
    else:
        raise ValueError(f"Invalid language model: {llm}")
