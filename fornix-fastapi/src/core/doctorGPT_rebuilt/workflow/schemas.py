from langchain_core.pydantic_v1 import Field, validator, BaseModel as BaseModel_V1
from typing import Dict, Literal, List, Optional

from pydantic import BaseModel


class MedicalEvaluationOutput(BaseModel_V1):
    """
    Pydantic model for the output of the medical/health-related evaluation task.
    """

    evaluation: Literal["related", "unrelated", "greetings"] = Field(
        ...,
        description="The evaluation of the medical/health-related query as related, unrelated, or greetings.",
    )

    class Config:
        """Pydantic config class to modify model behavior."""

        schema_extra = {"example": {"evaluation": "related"}}


class InputClassification(BaseModel_V1):
    """
    Pydantic model for classifying user inputs into medically-related, greetings, personal, non-medical.
    """

    evaluation: Literal["medically-related", "greetings", "personal", "non-medical"] = (
        Field(
            ...,
            description="The classification of the user's input into one of the following categories: 'medically-related', 'greetings', 'personal', or 'non-medical'.",
        )
    )


EvaluationOptions = Literal[
    "Relevant and Sufficient", "Relevant but Insufficient", "Not Relevant"
]


class SearchResultsEvaluation(BaseModel_V1):
    """
    Pydantic model for the output of evaluating search results for a medical/health query.
    """

    evaluation: EvaluationOptions = Field(
        ..., description="Evaluation of the search results' relevance and sufficiency."
    )

    class Config:
        """Pydantic config class to modify model behavior."""

        schema_extra = {"example": {"evaluation": "This is a sample evaluation."}}


class SearchQuery(BaseModel_V1):
    """
    Pydantic model for a single search query.
    """

    query: str = Field(..., description="The search query string.")


class SearchQueryOutput(BaseModel_V1):
    """
    Your response must strictly adhere to this schema.
    """

    search_queries: List[SearchQuery] = Field(
        ...,
        description="A list of 1-3 advanced search queries needed to search a search engine to find information relevant to the doctor's query.",
    )
    doctor_query: str = Field(
        ..., description="The original medical query posed by the doctor."
    )


class AnswerEvaluation(BaseModel_V1):
    """
    Pydantic model for evaluating an AI-generated answer to a doctor's medical query.
    """

    evaluation: Literal[
        "complete",
        "partially_complete",
        "unrelated",
    ] = Field(
        ...,
        description="The assessment of whether the AI answer addresses the doctor's query.",
    )
    feedback: Optional[str] = Field(
        None,
        description="Feedback on missing or inaccurate information if the evaluation is 'Partially answers the query' or 'Does not answer the query'.",
    )

    @validator("feedback", always=True)
    def validate_feedback(cls, feedback, values):
        evaluation = values.get("evaluation")
        if (
            evaluation in ["Partially answers the query", "Does not answer the query"]
            and not feedback
        ):
            raise ValueError(
                "Feedback is required if the evaluation is 'Partially answers the query' or 'Does not answer the query'."
            )
        return feedback


class SourceLink(BaseModel_V1):
    """
    A model representing a source link for additional information.
    """

    url: str = Field(..., description="The URL of the source link.")
    description: str = Field(..., description="A brief description of the source.")


class MedicalResponse(BaseModel_V1):
    """
    Use this schema to format your response to the doctor's query.
    """

    response: str = Field(
        ...,
        description="A clear and concise answer to the doctor's query. No links or disclaimer here!",
    )
    related_questions: List[str] = Field(
        ...,
        description="A list of 3-5 related questions or topics for further exploration.",)
    # source_links: List[SourceLink] = Field(
    #     ..., description="A list of source links for additional information."
    # )

    # class Config:
    #     """
    #     Configuration for the MedicalResponse model.
    #     """

    #     schema_extra = {
    #         "example": {
    #             "response": "This is the concise response including summaries of search results, additional insights, without disclaimer.",
    #             "source_links": [
    #                 {
    #                     "url": "https://example.com/source1",
    #                     "description": "Description of the source link.",
    #                 },
    #                 {
    #                     "url": "https://example.com/source2",
    #                     "description": "Description of another source link.",
    #                 },
    #             ],
    #         }
    #     }


class Message(BaseModel):
    content: str | List[str | Dict]
    additional_kwargs: dict = {}
    response_metadata: dict = {}
    type: Literal["human"] = "human"
    name: str | None = None
    id: str | None = None
    example: bool = False