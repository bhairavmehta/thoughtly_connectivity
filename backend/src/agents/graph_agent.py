import os
from agno.agent import Agent, AgentMemory
from agno.memory.db.sqlite import SqliteMemoryDb
from agno.models.openai import OpenAIChat
from agents.tools.neo_4j_tool import Neo4jThoughtTools
from dotenv import load_dotenv
from textwrap import dedent
from agents.utils.responses import ModelConfig
from agno.tools.toolkit import Toolkit

load_dotenv()

def create_graph_agent(
        user_memory : bool = False,
        session_memory : bool = False,
        local_graph_instance : bool = True,
        model_config : ModelConfig = None,
        user_id : str = "user_id",
):

    neo4j_tools = Neo4jThoughtTools(
        uri=os.getenv("NEO_4J_URI") if not local_graph_instance else os.getenv("NEO_4J_LOCAL_URI"),
        username=os.getenv("NEO_4J_USER"),
        password=os.getenv("NEO_4J_PASS") if not local_graph_instance else os.getenv("NEO_4J_LOCAL_PASS")
    )
    if user_memory or session_memory:
        memory = AgentMemory(
                user_id=user_id,
                db=SqliteMemoryDb(
                    table_name="graph_agent_memory",
                    db_file="agents/tmp/graph_agent_memory.db",
                ),
                create_user_memories=user_memory,
                update_user_memories_after_run=user_memory,
                create_session_summary=session_memory,
                update_session_summary_after_run=session_memory,
            )
    else:
        memory = None

    description = dedent("""
            You are an advanced Graph Query Agent responsible for managing a dynamic thought graph database.
            Your role is to store, retrieve, and interconnect user thoughts in a way that builds a rich, interconnected
            knowledge base. You actively search for related ideas and create connections between them, ensuring that new ideas
            are seamlessly integrated with existing ones. You also provide clear, actionable insights based on the current state
            of the graph and the user's inputs.
        """).strip()

    instructions = dedent("""
            You are a Graph Query Agent that manages a thought graph database.
            Your primary responsibilities include storing user thoughts, retrieving related ideas, and dynamically connecting
            these thoughts to form a comprehensive, evolving knowledge base.

            Key Responsibilities:
            1. Storing User Thoughts:
               - Upon receiving a new thought, immediately retrieve all existing node IDs using the 'get_all_node_ids' tool to assess the graph.
               - Use 'search_thoughts' and 'get_similar_thoughts' to identify similar or related thoughts.
               - Evaluate the similarity of the new thought with each existing node, collecting them one by one.
               - If similar thoughts are identified, notify the user and offer to connect the new thought with these nodes.
               - Use the 'add_thought' tool to store the new thought, then automatically establish edges (using the 'connect_thoughts' tool)
                 between the new thought and any related nodes.

            2. Connecting Related Thoughts:
               - Automatically establish connections between new and existing thoughts, ensuring each edge reflects the appropriate
                 relationship type (e.g., 'RELATED_TO') and weight.

            3. Retrieval and Analysis:
               - Retrieve specific thoughts on demand using the 'get_thought' tool.
               - Support broader queries by employing 'search_thoughts' to return nodes that contain or relate to a given query string.
               - Use 'get_similar_thoughts' to present conceptually similar thoughts along with similarity metrics.

            4. Graph Summary and Custom Queries:
               - Provide an overall summary of the thought graph using 'get_graph_summary', including node and relationship counts.
               - Execute custom Cypher queries to extract deeper insights or resolve ambiguous queries.

            Operational Guidelines:
               - Always retrieve all node IDs and associated data before adding a new thought to avoid redundancy.
               - Clearly present any similar or related thoughts to the user, along with similarity scores.
               - Once a new thought is added, immediately establish edges with related nodes to maintain an interconnected graph.
               - If the query is ambiguous or spans multiple topics, present a summary of related nodes and request clarification.
               - Format outputs clearly, with labeled sections for thought content, similarity metrics, and connection details.
               - Log errors and prompt the user for additional input or clarification as needed.

            Overall, your goal is to enrich the thought graph by dynamically connecting new ideas with existing ones,
            building a robust, interconnected knowledge base that evolves with user input and can be explored and refined over time.
        """).strip()


    graph_query_agent = Agent(
        name="Graph Query Agent",
        role="Graph Query",
        model=OpenAIChat(
            id=model_config.model_id,
            api_key=model_config.api_key,
            temperature=model_config.temperature
        ),
        tools=[
            neo4j_tools
        ],
        description=description,
        instructions=instructions,
        markdown=True,
        show_tool_calls=True,
        memory=memory if memory else None,
        add_datetime_to_instructions=True,
        read_tool_call_history=True,
    )
    return graph_query_agent

class GraphAgentTool(Toolkit):
    def __init__(self,model_config:ModelConfig,
                 user_id="user_id",
                 session_memory:bool =True,
                 local_graph_instance = True,
                 user_memory:bool =True
                 ):
        super().__init__(name="graph_agent_tool")
        self.graph_agent = create_graph_agent(
            user_id=user_id,
            session_memory=session_memory,
            local_graph_instance=local_graph_instance,
            user_memory=user_memory,
            model_config=model_config,
        )
        self.register(self.query_graph)
        self.register(self.save_user_thought)
        self.register(self.a_query_graph)
        self.register(self.a_save_user_thought)

    def query_graph(self, query):
        """
        This tool is used to interact with the Graph Query Agent to store, retrieve, and
         interconnect user thoughts in a dynamic thought graph database.

        Args:
            query (str): The query to be processed by the Graph Query Agent

        Returns:
            str: the response from the Graph Query Agent
        """
        response = self.graph_agent.run(query)
        return response.content

    async def a_query_graph(self, query):
        """
        This tool is used to interact with the Graph Query Agent to store, retrieve, and
         interconnect user thoughts in a dynamic thought graph database with async.

        Args:
            query (str): The query to be processed by the Graph Query Agent

        Returns:
            str: the response from the Graph Query Agent
        """
        response = await self.graph_agent.arun(query)
        return response


    def save_user_thought(self, query):
        """
        This tool is used to save user thought to the Graph Query Agent.
        Ask the tool to save the users thought to the graph database.
        Args:
            query (str): The query to be processed by the Graph Query Agent

        Returns:
            str: the response from the Graph Query Agent
        """
        response = self.graph_agent.arun(query)
        return response
    async def a_save_user_thought(self, query):
        """
        This tool is used to save user thought to the Graph Query Agent with async.
        Ask the tool to save the users thought to the graph database.
        Args:
            query (str): The query to be processed by the Graph Query Agent

        Returns:
            str: the response from the Graph Query Agent
        """
        response = await self.graph_agent.arun(query)
        return response
