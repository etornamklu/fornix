# import asyncio
# from contextlib import asynccontextmanager
# from typing import Any, AsyncIterator, Iterator, List, Optional, Union
#
# from langchain_core.runnables import RunnableConfig
# from psycopg import AsyncConnection, AsyncCursor, AsyncPipeline
# from psycopg.errors import UndefinedTable
# from psycopg.rows import dict_row
# from psycopg.types.json import Jsonb
# from psycopg_pool import AsyncConnectionPool
#
# from langgraph.checkpoint.base import (
#     ChannelVersions,
#     Checkpoint,
#     CheckpointMetadata,
#     CheckpointTuple,
#     get_checkpoint_id,
# )
# from langgraph.checkpoint.postgres.base import BasePostgresSaver
# from langgraph.checkpoint.serde.base import SerializerProtocol
#
#
#
# @asynccontextmanager
# async def _get_connection(
#     conn: Union[AsyncConnection, AsyncConnectionPool],
# ) -> AsyncIterator[AsyncConnection]:
#     if isinstance(conn, AsyncConnection):
#         yield conn
#     elif isinstance(conn, AsyncConnectionPool):
#         async with conn.connection() as conn:
#             yield conn
#     else:
#         raise TypeError(f"Invalid connection type: {type(conn)}")