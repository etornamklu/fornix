# DoctorGPT

This is a FastAPI application that exposes an endpoint for querying an AI agent based on the LangChain framework. The
agent can be initialized with various language models, and the chat history is persisted in a SQLite database that is
created automatically.

## Agent Workflow

<img src="https://github.com/Zomujo/FornixAI/blob/main/doctorGPT_rebuilt/graph.png" alt="Graph">

## Requirements

- Python 3.7+
- FastAPI
- LangChain
- SQLAlchemy
- SQLite
- DuckDuckGo API
- Tavily AI API

## Installation

1. Clone the repository:

```bash
git https://github.com/Zomujo/FornixAI.git
cd FornixAI\doctorGPT_rebuilt
```

2. Install the required packages:

```bash
pip install -r requirements.txt
```

## Usage

1. Start the FastAPI server:

```bash
uvicorn main:app --reload
```

The server will start on `http://localhost:8000`, and a SQLite database file `chat_history.db` will be created
automatically with the required table.

2. Send a POST request to the `/query` endpoint with a JSON payload containing the messages:

```json
{
  "messages": [
    {
      "content": "Hello, how are you?",
      "additional_kwargs": {},
      "response_metadata": {},
      "type": "human",
      "name": "User",
      "id": "uuid-123",
      "example": false
    }
  ]
}
```

You can optionally include a `session_id` in the query parameters to continue an existing conversation.

The server will respond with the AI agent's response in JSON format:

```json
{
  "content": "I'm doing well, thanks for asking! How can I assist you today?",
  "additional_kwargs": {},
  "response_metadata": {
    "links": [
      "https://example.com/ai-info"
    ]
  },
  "type": "ai",
  "name": null,
  "id": null,
  "example": false,
  "tool_calls": [],
  "invalid_tool_calls": []
}
```

## Human Message Schema

The human message should be sent in the following format:

```json
{
  "messages": [
    {
      "content": "string",
      "additional_kwargs": {},
      "response_metadata": {},
      "type": "human",
      "name": "string",
      "id": "string",
      "example": false
    }
  ]
}
```

## Response Schema

The AI agent's response will have the following schema:

```json
{
  "content": "string",
  "additional_kwargs": {},
  "response_metadata": {
    "links": [
      "Links to URLs where the AI pulled the information from"
    ]
  },
  "type": "ai",
  "name": null,
  "id": null,
  "example": false,
  "tool_calls": [],
  "invalid_tool_calls": []
}
```

- `content` (string): The response content.
- `additional_kwargs` (object): Additional keyword arguments (optional).
- `response_metadata` (object): Response metadata, including links to URLs where the AI pulled information from.
- `type` (string): The message type, should be "ai".
- `name` (null): The name of the AI agent (null).
- `id` (null): The ID of the message (null).
- `example` (bool): Whether the message is an example or not (optional).
- `tool_calls` (list): A list of tool calls made by the AI agent (optional).
- `invalid_tool_calls` (list): A list of invalid tool calls made by the AI agent (optional).

## Endpoints

### POST `/query`

Query the AI agent with a list of messages.

#### Request Body

- `messages` (List[HumanMessage]): A list of messages from the user.

#### Query Parameters

- `session_id` (str, optional): The ID of the session to continue. If not provided, a new session will be created.

#### Responses

- `200 OK` (AIMessage): The response from the AI agent.
- `400 Bad Request`: If the session ID is not provided.
- `500 Internal Server Error`: If there's an exception during processing.

## Configuration

- `llm_name` (str): The name of the language model to use for the AI agent. Default is `"gpt-3.5-turbo-0125"`.
