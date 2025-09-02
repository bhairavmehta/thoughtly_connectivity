from agents.utils.responses import PineconeAuthConfig,ModelConfig
from agents.web_search_agent import create_search_agent
from agents.retrieval_agent import create_retrieval_agent
from agents.graph_agent import create_graph_agent
from agno.memory.v2.db.sqlite import SqliteMemoryDb
from textwrap import dedent
from agno.team import Team
from agno.memory.team import TeamMemory
from agno.storage.agent.sqlite import SqliteAgentStorage
from agno.models.openai import OpenAIChat
import os
from dotenv import load_dotenv

load_dotenv()

def get_thought_agent(user_memory:bool = False,session_memory:bool = False):
    storage = SqliteAgentStorage(
        table_name="team_sessions", db_file="agents/tmp/persistent_memory.db"
    )

    memory = TeamMemory(
        db=SqliteMemoryDb(
            table_name="team_memory",
            db_file="agents/tmp/team_memory.db",
        ),
        create_user_memories=user_memory,
        update_user_memories_after_run=user_memory,
    )
    description = dedent("""
        You are the Thought Agent Team, a collaborative entity comprised of specialized agents dedicated to 
        capturing, analyzing, and refining user ideas. You integrate input from multiple perspectives to build a 
        dynamic, interconnected knowledge base. Your goal is to help users refine their ideas by retrieving related 
        context, connecting new thoughts with existing ones (using both Pinecone and Neo4j), and providing clear, actionable insights.
    """).strip()

    instructions = dedent(f"""
        You are the Thought Agent Team, a collaborative group dedicated to managing and enriching a dynamic thought repository.
        Your responsibilities include capturing user ideas, synthesizing context from various specialized agents, and ensuring 
        that every valuable idea is stored consistently under a unique identifier across our integrated systems.

        Key Responsibilities:
        1. User Interaction and Idea Capture:
           - Listen carefully to the user's queries and ideas, ensuring full comprehension of their requirements.
           - Engage in interactive dialogue to clarify ambiguous input and gather complete context.

        2. Aggregation and Synthesis:
           - Collaborate as a team by combining insights from various specialized agents (e.g., Legal, Product, Market Research, Sales, etc.).
           - Synthesize a comprehensive and well-structured response that integrates perspectives from all team members.

        3. Context Retrieval and Storage:
           - Retrieve all existing thought identifiers and related context from our internal storage systems.
           - When a new idea is provided, search for similar or related thoughts.
           - If similar ideas exist, notify the user, present the related context, and propose connecting the new idea to these existing nodes.
           - Store new or refined ideas with a consistent unique identifier across our integrated systems.

        4. Detailed Response and Feedback:
           - Provide actionable insights, summaries, and recommendations based on the aggregated data.
           - Clearly label sections of your response with their respective sources and explain how new ideas relate to previous ones.
           - Confirm with the user when an idea is stored and connected, inviting further refinement and exploration of their thoughts.

        Overall, your goal is to help the user refine their ideas and build a rich, interconnected repository of thoughts that evolves over time.
        Note: Do not mention any internal storage or technical details. Instead, simply ask the user if they wish to store their thought,
        and assure them that valuable ideas are automatically preserved and linked for future reference.
    """).strip()

    pinecone_config = PineconeAuthConfig(
        api_key=os.getenv("PINECONE_API_KEY")
    )

    model_config = ModelConfig(
        api_key=os.getenv("OPENAI_API_KEY")
    )

    model_instance = OpenAIChat(
        id=model_config.model_id,
        api_key=model_config.api_key,
        temperature=model_config.temperature,
        base_url=model_config.base_url
    )
    graph_agent = create_graph_agent(
        user_memory=True,
        session_memory=True,
        model_config=model_config
    )
    pinecone_agent = create_retrieval_agent(
        pinecone_config=pinecone_config,
        model_config=model_config,
        )
    web_agent = create_search_agent()

    thought_agent_team = Team(
        name="Thought Agent Team",
        mode="coordinate",
        #storage=storage,
        model=model_instance,
        instructions=instructions.splitlines(),
        description=description,
        members=[web_agent,pinecone_agent,graph_agent],
        #memory=memory,
        add_datetime_to_instructions=True,
        markdown=True,
        debug_mode=True,
        show_members_responses=True,
    )
    return thought_agent_team

