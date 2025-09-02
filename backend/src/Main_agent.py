
import os
import logging
import uuid
from textwrap import dedent
from dotenv import load_dotenv
from typing import Optional

from agno.agent.agent import Agent
"""
from agno.memory.v2.db.sqlite import SqliteMemoryDb
from agno.memory.v2.memory import Memory
from agno.storage.sqlite import SqliteStorage
"""
from agno.models.openai import OpenAIChat

try:
    from agents.utils.responses import ModelConfig
except ImportError:
     try:
        from utils.responses import ModelConfig
     except ImportError as e:
         logging.error(f"Failed to import ModelConfig: {e}")
         raise

from agents.web_search_agent import WebSearchAgentTool
try:
    from agents.Light_agent import LightRAGAgentTool
    from agents.tools.lightrag_tool import LightRAGToolConfig,LightRAGTool
except ImportError as e:
    logging.basicConfig(level=logging.ERROR)
    logging.error(f"Failed to import LightRAG tools: {e}.")
    raise

load_dotenv()

USER_DATA_BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "user_data"))
os.makedirs(USER_DATA_BASE_DIR, exist_ok=True)

db_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "db"))
os.makedirs(db_dir, exist_ok=True)

# the memory and storage are not used in this agent currently, and we will be giving session chat history instead
# later we will be removing that and replacing it with the memory and storage
# TODO2: ADD the memory and storage to the agent when it is more stable and working properly
#  and remove the session chat history

def get_thought_agent(
    user_memory: bool = True,
    session_memory: bool = True,
    user_id: str = "default_user",
    session_id: str = "default_session",
    lightrag_tool: Optional[LightRAGTool] = None
):

    """storage = SqliteStorage(
        table_name="thought_agent_sessions",
        db_file=os.path.join(db_dir, "persistent_agent_state.db")
    )

    memory_db = SqliteMemoryDb(
        table_name="conversation_memory",
        db_file=os.path.join(db_dir, "conversation_memory.db"),
    )
    memory = Memory(db=memory_db)"""

    description = dedent("""
        You are the Thought Agent, an AI assistant using specialized tools (like LightRAG for knowledge and Web Search)
        to help users capture, retrieve, and manage their thoughts and ideas.
        You remember past interactions based on user and session context.
        And always help in polishing the ideas more.
    """).strip()

    instructions = dedent(f"""
        Your primary goal is to help the user based on their current query and the provided conversation history.
        The history, if available, will appear at the beginning of the prompt like this:
        --- Conversation History ---
        user: Previous message
        assistant: Previous response
        --- Current Query ---
        The user's latest message
        Your main focus will be on the latest query the earlier queries and the answers are for your reference only.
        Use this history for context, but focus on answering the 'Current Query'.
        Also retrive the contexts from the light rag agent to make sure that you are getting as much relevant context as possible
        Tool Usage:
        1.  **LightRAG Agent Tool (`lightrag_agent_tool`):** Use this for managing the user's persistent knowledge base 
        (storing text, retrieving info, managing entities). Follow its specific methods (`store_text`, `retrieve_info`,
         `get_entity_details`, `create_entity`, etc.) carefully. Always verify entity existence with `get_entity_details`
          before modifying or deleting. This tool instance manages data for user '{user_id}'.
        2.  **Web Search (`web_agent_tool`):** Use this *only* for external, real-time, or general web information not 
        expected in the user's personal knowledge base or the immediate conversation history.

        Workflow:
        - Analyze the 'Current Query'.
        - Refer to the 'Conversation History' section for context if needed.
        - Decide if a tool is needed (LightRAG for personal knowledge, Web Search for external).
        - If using a tool, call the appropriate method with clear instructions.
        - Formulate a helpful response based on the query, history, and any tool results.
        - Make sure to save any idea given by the user in the LightRAG tool. Always save the idea if not already stored and then 
        connect it to the existing nodes. and retrieve the existing nodes and tell the user about those ideas and tell the user 
        Also make sure to store any information given by the user is stored for them to be used in making the responses for them later 
        Like there college,companty name, etc. and also make sure to connect the ideas with the existing nodes.
        Also store these information whenever the user gives you any information about them and also try to retrive those 
        from the lightrag agent 
        how they can be connected and make a better solid idea.
    """).strip()

    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise ValueError("OPENAI_API_KEY environment variable not set.")

    model_config = ModelConfig(
        api_key=openai_api_key,
        model_id=os.getenv("OPENAI_MODEL_ID", "gpt-4o-mini"),
    )

    model_instance = OpenAIChat(
        id=model_config.model_id,
        api_key=model_config.api_key,
        temperature=model_config.temperature,
        base_url=getattr(model_config, 'base_url', None)
    )

    web_agent_tool = WebSearchAgentTool()

    if lightrag_tool is None:
        # This is a bug fix - we should NOT be reassigning lightrag_tool to itself when it's None
        lightrag_agent_tool = None
        logging.warning(f"No LightRAG tool provided for user {user_id}")
    else:
        logging.info(f"Using pre-initialized LightRAGAgentTool for user {user_id}")
        lightrag_agent_tool = lightrag_tool


    agent_user_id = user_id if user_memory else None
    agent_session_id = session_id if session_memory else "fallback_session_" + str(uuid.uuid4())[:8]

    tools = [web_agent_tool]
    if lightrag_agent_tool:
        tools.append(lightrag_agent_tool)

    thought_agent = Agent(
        model=model_instance,
        name="Thought Agent",
        description=description,
        instructions=instructions.splitlines(),
        tools=tools,
        #storage=storage,
        #memory=memory,
        user_id=agent_user_id,
        session_id=agent_session_id,
        enable_user_memories=user_memory,
        show_tool_calls=True,
        add_datetime_to_instructions=True,
        markdown=True,
    )

    return thought_agent


class ThoughtAgentManager:
    def __init__(
        self,
        user_memory: bool = True,
        session_memory: bool = True,
        user_id: str = "default_user",
        session_id: str = "default_session",
        lightrag_tool: Optional[LightRAGTool] = None
    ):
        self.thought_agent = get_thought_agent(
            user_memory=user_memory,
            session_memory=session_memory,
            user_id=user_id,
            session_id=session_id,
            lightrag_tool=lightrag_tool
        )
        self.lightrag_tool = lightrag_tool

    async def ask(self, prompt: str):
        response = await self.thought_agent.arun(prompt)
        return response.content

    def ask_sync(self, prompt: str):
        response = self.thought_agent.run(prompt)
        return response.content

    async def add_content(self, content: str):
        """
        Add content to the LightRAG tool.
        Not in use rn...
        """
        return await self.lightrag_tool.store_text(content)
