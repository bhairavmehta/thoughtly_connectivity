import logging
from textwrap import dedent
from agno.agent import Agent, AgentMemory
from agno.memory.db.sqlite import SqliteMemoryDb
from agno.models.openai import OpenAIChat
from agno.tools.toolkit import Toolkit
from dotenv import load_dotenv
from agents.utils.responses import ModelConfig
from agents.tools.lightrag_tool import LightRAGTool, LightRAGToolConfig

load_dotenv()
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
log = logging.getLogger(__name__)


def create_lightrag_agent(
        tool: LightRAGTool,
        user_memory: bool = False,
        session_memory: bool = False,
        model_config: ModelConfig = None,
        user_id: str = "user_id",

):
    """
    Create a minimal LightRAG Agent for managing a persistent thought knowledge base.

    This agent follows clear instructions:
      - When given new text input, it stores the text for later retrieval.
      - When asked for context, it retrieves the most relevant information using a naive retrieval.
      - When managing entities, it creates, edits, merges, or deletes them as instructed.
      - Before merging entities, it retrieves and checks the details of the involved entities.

    The agent uses only a minimal set of tools to keep operations straightforward.
    """
    lightrag_tool = tool
    """if user_memory or session_memory:
        memory = AgentMemory(
            user_id=user_id,
            db=SqliteMemoryDb(
                table_name="lightrag_agent_memory",
                db_file="agents/tmp/lightrag_agent_memory.db",
            ),
            create_user_memories=user_memory,
            update_user_memories_after_run=user_memory,
            create_session_summary=session_memory,
            update_session_summary_after_run=session_memory,
        )
    else:
        memory = None"""

    description = dedent("""
        You are a LightRAG Agent responsible for managing a persistent thought knowledge base.
        Your job is to store text content, retrieve context when needed, and manage knowledge graph entities.
    """).strip()

    instructions = dedent("""
        Follow these detailed instructions to ensure data integrity and prevent redundant operations:

        1. **Storing Text:**
           - Use 'store_text' to save new information into the knowledge base.

        2. **Retrieving Context:**
           - Use relevant retrival method to fetch the best matching stored content based on a query.
           - Always verify that the retrieved context accurately reflects the intended information.

        3. **Entity Management:**
           - **Creation:**
             - Use 'create_entity' to add a new entity when a new concept is introduced.
             - **Always first check with 'get_entity_details'** to ensure the entity does not already exist.
           - **Editing:**
             - Use 'edit_entity' to update an entity’s details.
             - **Before editing, use 'get_entity_details'** to confirm the entity exists and to determine the current state.
           - **Merging:**
             - Use 'merge_entities' to combine similar entities.
             - **Prior to merging, always retrieve details using 'get_entity_details'** for all entities involved to ensure they are indeed duplicates or need consolidation.
           - **Deletion:**
             - Use 'delete_entity' to remove an entity when it is no longer relevant.
             - **Verify its existence and details with 'get_entity_details'** before deletion to prevent accidental data loss.

        4. **Relation Management (Optional):**
           - Use 'get_relation_details' to review relationship data before creating or modifying any relation.
           - Ensure both entities in a relation are verified to exist and that the relationship is accurately defined.

        **General Rule:** Always use the relevant verification tools (like 'get_entity_details' or 'get_relation_details') to check the current state of the data before making any function call. This ensures that any creation, modification, or deletion is based on accurate and up-to-date information.

        Follow these instructions exactly and use the most appropriate tool for every task.
    """).strip()

    # Create and return the agent instance.
    lightrag_agent = Agent(
        name="LightRAG Agent",
        role="Knowledge Base Manager",
        model=OpenAIChat(
            id=model_config.model_id,
            api_key=model_config.api_key,
            temperature=model_config.temperature
        ),
        tools=[lightrag_tool],
        description=description,
        instructions=instructions,
        markdown=True,
        show_tool_calls=True,
        #memory=memory,
        add_datetime_to_instructions=True,
        read_tool_call_history=True,
    )
    return lightrag_agent


class LightRAGAgentTool(Toolkit):
    """
    A minimal Agno Toolkit for interacting with the LightRAG Agent.

    This toolkit exposes a few core operations:
      - Storing text content.
      - Retrieving context.
      - Managing entities: create, edit, merge, and delete.
      - Retrieving detailed information for entities and relations.

    Detailed comments are provided in each method to ensure clarity.
    """

    def __init__(
            self,
            model_config: ModelConfig,
            user_id: str = "user_id",
            session_memory: bool = True,
            user_memory: bool = True,
            tool: LightRAGTool = None
    ):
        super().__init__(name="lightrag_agent_tool")
        self.lightrag_tool = tool
        self.lightrag_agent = create_lightrag_agent(
            user_id=user_id,
            session_memory=session_memory,
            user_memory=user_memory,
            model_config=model_config,
            tool = self.lightrag_tool
        )

        self.register(self.store_text)
        self.register(self.retrieve_info)
        self.register(self.create_entity)
        self.register(self.edit_entity)
        self.register(self.merge_entities)
        self.register(self.delete_entity)
        self.register(self.get_entity_details)
        self.register(self.get_relation_details)
        self.register(self.custom_query)

    async def store_text(self, text: str) -> str:
        """
        Save text content into the knowledge base.
        """
        response = await self.lightrag_agent.arun(f"store text: {text}")
        return response.content

    async def retrieve_info(self, query: str) -> str:
        """
        Retrieve context based on a query.

        Instructs the agent to fetch the most relevant stored text using a naive retrieval method.
        """
        response = await self.lightrag_agent.arun(f"retrieve for: {query}")
        return response.content

    async def create_entity(self, instruction: str) -> str:
        """
        Create a new entity in the knowledge graph based on the provided instruction.

        The instruction should fully describe the entity to be created, including its name,
        description, and any other relevant details. For example:
          "create entity: AI Language Model, description: A model for NLP tasks, type: Concept"

        This method sends the complete instruction to the agent for processing.
        """
        response = await self.lightrag_agent.arun(instruction)
        return response.content

    async def edit_entity(self, instruction: str) -> str:
        """
        Update an existing entity in the knowledge graph according to the provided instruction.

        The instruction must include details on which entity to update and what modifications
        to apply. For example:
          "edit entity: AI Language Model, update: set description to 'An advanced NLP model for language processing.'"

        This approach allows the agent to parse and execute the desired update without explicit parameters.
        """
        response = await self.lightrag_agent.arun(instruction)
        return response.content

    async def merge_entities(self, instruction: str) -> str:
        """
        Merge multiple entities based on the provided instruction.

        The instruction should specify the source entities and the target entity, along with any conditions
        or checks to be performed prior to merging. For example:
          "merge entities: source: ['Entity A', 'Entity B'], target: 'Unified Entity',
           verify details before merging"

        This ensures the agent is directed by a complete, self-contained instruction.
        """
        response = await self.lightrag_agent.arun(instruction)
        return response.content

    async def delete_entity(self, instruction: str) -> str:
        """
        Delete an entity from the knowledge graph as described in the instruction.

        The instruction should clearly specify which entity to delete and any prerequisites to check
        (e.g., verifying its current details). For example:
          "delete entity: AI Language Model after confirming it exists"

        The agent will execute the deletion based on the given command.
        """
        response = await self.lightrag_agent.arun(instruction)
        return response.content

    async def get_entity_details(self, instruction: str) -> str:
        """
        Retrieve detailed information about an entity as specified in the instruction.

        The instruction should include the entity identification details. For example:
          "get entity details: AI Language Model"

        This method directs the agent to fetch and return the current state of the entity.
        """
        response = await self.lightrag_agent.arun(instruction)
        return response.content

    async def get_relation_details(self, instruction: str) -> str:
        """
        Retrieve detailed information about a relationship between entities based on the provided instruction.

        The instruction should specify the relationship to be inspected. For example:
          "get relation details: between Framework X and Application Y"

        The agent processes the instruction to return the current state of the relationship.
        """
        response = await self.lightrag_agent.arun(instruction)
        return response.content

    async def custom_query(self, instruction: str) -> str:
        """
        Execute a custom query or perform a specialized task based on the provided instruction.

        The instruction should clearly describe the task or query. For example:
          "custom query: retrieve all entities with 'LLM' in their description and list their details"
          "custom query: summarize all stored text related to AI frameworks"

        This method allows the agent to process any custom, non-standard operation based on natural language instructions.
        """
        response = await self.lightrag_agent.arun(instruction)
        return response.content

    def store_text_sync(self, text: str) -> str:
        """
        Sync version of store_text
        """
        response = self.lightrag_agent.run(f"store text: {text}")
        return response.content

    def retrieve_info_sync(self, query: str) -> str:
        """
        Sync version of retrieve_info
        """
        response = self.lightrag_agent.run(f"retrieve for: {query}")
        return response.content

    def create_entity_sync(self, instruction: str) -> str:
        """
        Sync version of create_entity
        """
        response = self.lightrag_agent.run(instruction)
        return response.content

    def edit_entity_sync(self, instruction: str) -> str:
        """
        Sync version of edit_entity
        """
        response = self.lightrag_agent.run(instruction)
        return response.content

    def merge_entities_sync(self, instruction: str) -> str:
        """
        Sync version of merge_entities
        """
        response = self.lightrag_agent.run(instruction)
        return response.content

    def delete_entity_sync(self, instruction: str) -> str:
        """
        Sync version of delete_entity
        """
        response = self.lightrag_agent.run(instruction)
        return response.content

    def get_entity_details_sync(self, instruction: str) -> str:
        """
        Sync version of get_entity_details
        """
        response = self.lightrag_agent.run(instruction)
        return response.content

    def get_relation_details_sync(self, instruction: str) -> str:
        """
        Sync version of get_relation_details
        """
        response = self.lightrag_agent.run(instruction)
        return response.content

    def custom_query_sync(self, instruction: str) -> str:
        """
        Sync version of custom_query
        """
        response = self.lightrag_agent.run(instruction)
        return response.content

