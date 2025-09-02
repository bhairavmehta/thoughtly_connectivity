from typing import Optional
from textwrap import dedent
from dotenv import load_dotenv
from agno.agent import Agent, AgentMemory
from agno.embedder.openai import OpenAIEmbedder
from agno.knowledge import AgentKnowledge
from agno.memory.db.sqlite import SqliteMemoryDb
from agno.models.openai import OpenAIChat
from agno.storage.agent.sqlite import SqliteAgentStorage
from agno.vectordb.pineconedb import PineconeDb
from tools.pinecone_tool import PineconeTools
from agno.tools.toolkit import Toolkit
from utils.responses import PineconeAuthConfig,ModelConfig

load_dotenv()


def create_retrieval_agent(
        model_config :ModelConfig,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        pinecone_config :PineconeAuthConfig = None,
) -> Agent:
    """Create a Retrieval Agent that leverages Pinecone for vector search and a persistent memory."""
    if not pinecone_config:
        raise ValueError("Pinecone config not provided")

    instructions = dedent(f"""
        You are a sophisticated Retrieval Agent that leverages a Pinecone-backed knowledge base and persistent memory
        to provide detailed, actionable answers. Your responsibilities include both retrieving relevant context for the
        user's query and updating the knowledge base with new thoughts. For every interaction, follow these guidelines:

        1. Knowledge Base Search:
           - Always begin by querying the knowledge base to retrieve relevant documents.
           - Analyze and synthesize all returned documents to form a coherent understanding of the context.
           - If the context is insufficient, supplement your findings using external search tools (e.g., DuckDuckGo).

        2. Thought Storage and Update:
           - When the user provides a new thought, immediately retrieve all existing node IDs using the 'get_all_node_ids' tool.
           - Use 'search_thoughts' and 'get_similar_thoughts' to determine if similar or related ideas already exist.
           - If similar thoughts are detected, notify the user and offer to connect the new thought with these related nodes.
           - Save the new thought in the vector store using the 'add_thought' tool, then automatically establish edges (using the 'connect_thoughts' tool)
             between the new thought and any related nodes.

        3. Continuous Context Management:
           - Maintain conversation continuity by referencing prior interactions and chat history.
           - Update the current context with the latest user input and any new information retrieved.
           - Clearly present all aggregated context with labeled sections (e.g., "Knowledge Base Result:", "External Search Result:", "Similar Thoughts:").

        4. Communication and Clarification:
           - Clearly inform the user when a thought has been stored and if any similar ideas are found.
           - If the query is ambiguous or covers multiple topics, provide a structured summary of related nodes and ask for further clarification.
           - Ensure that your response is well-structured, includes relevant citations where applicable, and is easy to understand.

        Overall, your goal is to deliver comprehensive, context-aware responses that not only answer the user’s query 
        but also enrich the knowledge base by dynamically connecting new ideas with existing ones.
    """).strip()

    description = (
        "You are an advanced Retrieval Agent designed to deliver comprehensive and actionable insights You will working"
        "As a tool under another agent have to do what is asked to do like saving or getting data from the knowledge base"
        "by leveraging a Pinecone-backed knowledge base. You collaborate seamlessly with other specialized agents, "
        "such as the Graph Query Agent and Web Search Agent, to synthesize, refine, and enhance information from multiple sources."
    )

    pinecone_tool = PineconeTools(
        pinecone_config=pinecone_config
    )
    memory = AgentMemory(
        db=SqliteMemoryDb(
            table_name="ret_agent_memory",
            db_file="agents/tmp/ret_agent_memory.db",
        ),
        create_user_memories=True,
        update_user_memories_after_run=True,
        create_session_summary=True,
        update_session_summary_after_run=True,
    )

    vector_db = PineconeDb(
        name=pinecone_config.index_name,
        dimension=pinecone_config.dimensions,
        metric=pinecone_config.metric,
        spec={
            "serverless":
                {
                    "cloud": pinecone_config.cloud,
                    "region": pinecone_config.region
                }
        },
        api_key=pinecone_config.api_key,
        use_hybrid_search=True,
        hybrid_alpha=0.5,
        embedder=OpenAIEmbedder(dimensions=pinecone_config.dimensions)
    )

    knowledge_base = AgentKnowledge(
        vector_db=vector_db,
        num_documents=3
    )

    return Agent(
        name="Retrieval Agent",
        session_id=session_id,
        user_id=user_id,
        model=OpenAIChat(
            api_key=model_config.api_key,
            id=model_config.model_id,
            temperature=model_config.temperature
        ),
        storage=SqliteAgentStorage(
            table_name="agent_sessions",
            db_file="tmp/data.db"
        ),
        memory=memory,
        knowledge=knowledge_base,
        description=description,
        instructions=instructions.splitlines(),
        search_knowledge=True,
        read_chat_history=True,
        tools=[pinecone_tool],
        show_tool_calls=True,
        add_history_to_messages=True,
        add_datetime_to_instructions=True,
        read_tool_call_history=True,
        num_history_responses=3,
    )

class PineconeAgentTool(Toolkit):
    def __init__(
             self,
             pinecone_config: PineconeAuthConfig,
             model_config: ModelConfig,
             user_id="user_id",
             session_id="session_id"
    ):
        super().__init__(name="pinecone_agent_tool")
        self.pinecone_tool = create_retrieval_agent(
            model_config=model_config,
            user_id=user_id,
            session_id=session_id,
            pinecone_config=pinecone_config
        )
        self.register(self.query_pinecone)
        self.register(self.save_user_thought)
        self.register(self.a_query_pinecone)
        self.register(self.a_save_user_thought)

    def query_pinecone(self, query):
        """
        This tool is used to interact with the Pinecone Agent to store, retrieve, and
         interconnect user thoughts in a dynamic thought pinecone vectorstore.

        Args:
            query (str): The query to be processed by the Pinecone Agent

        Returns:
            str: the response from the Pinecone Agent
        """
        response = self.pinecone_tool.run(query)
        return response.content

    async def a_query_pinecone(self, query):
        """
        This tool is used to interact with the Pinecone Agent to store, retrieve, and
         interconnect user thoughts in a dynamic thought pinecone vectorstore with async.

        Args:
            query (str): The query to be processed by the Pinecone Agent

        Returns:
            str: the response from the Pinecone Agent
        """
        response = await self.pinecone_tool.arun(query)
        return response.content

    def save_user_thought(self, thought):
        """
        This tool is used to save a user thought to the Pinecone Agent.

        Args:
            thought (str): The thought to be saved

        Returns:
            str: the response from the Pinecone Agent
        """
        response = self.pinecone_tool.run(thought)
        return response.content

    async def a_save_user_thought(self, thought):
        """
        This tool is used to save a user thought to the Pinecone Agent with async.

        Args:
            thought (str): The thought to be saved

        Returns:
            str: the response from the Pinecone Agent
        """
        response = await self.pinecone_tool.arun(thought)
        return response.content

