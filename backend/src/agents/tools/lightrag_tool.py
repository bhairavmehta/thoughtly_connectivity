import os
import logging
from typing import Dict, Any, Optional, List, Union, Literal
from dotenv import load_dotenv
from pydantic import BaseModel, Field, DirectoryPath
from agno.tools.toolkit import Toolkit

try:
    from lightrag import LightRAG, QueryParam
    from lightrag.utils import EmbeddingFunc
    from lightrag.llm.openai import gpt_4o_mini_complete, openai_embed
    from lightrag.kg.shared_storage import initialize_pipeline_status
    LIGHTRAG_AVAILABLE = True
except ImportError as e:
    logging.error(f"Failed to import LightRAG components. Ensure library is installed correctly relative to this tool. Error: {e}")
    class LightRAG: pass
    class QueryParam: pass
    class EmbeddingFunc: pass
    def gpt_4o_mini_complete(*args, **kwargs): pass
    def openai_embed(*args, **kwargs): pass
    LIGHTRAG_AVAILABLE = False

load_dotenv()
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
log = logging.getLogger(__name__)

# --- Configuration ---
class LightRAGToolConfig(BaseModel):
    """Configuration settings for the LightRAG Tool based on HKUDS/LightRAG."""
    working_dir: DirectoryPath = Field(default="./lightrag_workspace", description="Directory for LightRAG to store its data (KG, vector index, etc.). Will be created if it doesn't exist.")
    openai_api_key: str = Field(default_factory=lambda: os.getenv("OPENAI_API_KEY"), description="OpenAI API Key.")

    # Embedding Model Configuration
    embedding_model_name: str = Field(default="text-embedding-3-small", description="OpenAI embedding model name used by openai_embed.")
    embedding_dimensions: int = Field(default=1536, description="Dimensions of the embedding model (1536 for text-embedding-3-small).")
    embedding_batch_num: int = Field(default=32, description="Batch size for embedding computations.")
    embedding_func_max_async: int = Field(default=16, description="Max concurrent embedding calls.")

    # LLM Configuration
    llm_model_name: str = Field(default="gpt-4o-mini", description="OpenAI model ID used by llm_model_func.")
    llm_model_max_async: int = Field(default=4, description="Max concurrent LLM calls.")

    vector_storage_type: str = Field(default="FaissVectorDBStorage", description="Type of vector storage to use.")
    vector_storage_kwargs: Dict[str, Any] = Field(
        default={"index_factory_string": "Flat", "skip_initialization": True},
        description="Keyword arguments for the vector storage class. 'index_factory_string': 'Flat' uses FAISS CPU basic index."
    )
    cosine_better_than_threshold: float = Field(default=0.2, description="Threshold for cosine similarity checks.")


    chunk_token_size: int = Field(default=1200)
    chunk_overlap_token_size: int = Field(default=100)
    tiktoken_model_name: str = Field(default="gpt-4o-mini")
    default_top_k: int = Field(default=5, description="Default number of results for retrieval queries.")


    class Config:
        env_file = '.env'
        extra = 'ignore'

class LightRAGTool(Toolkit):
    """
    An Agno Toolkit for interacting with a persistent thought knowledge base using HKUDS/LightRAG.
    Provides tools for storing text, retrieving information via various modes (vector search, KG traversal, hybrid),
    and managing knowledge graph entities and relationships (create, edit, delete).

    **Requires calling the async `initialize()` method after instantiation and before use.**
    Uses FAISS CPU for vector storage by default.
    """
    def __init__(self, config: Optional[LightRAGToolConfig] = None):
        super().__init__(name="lightrag_tool")
        self.config = config or LightRAGToolConfig()
        self.rag_instance: Optional[LightRAG]
        self.is_initialized: bool = False

        log.info(f"Instantiating LightRAGTool (requires async initialization) with config: {self.config.model_dump(exclude={'openai_api_key'})}")

        if not LIGHTRAG_AVAILABLE:
            log.error("LightRAG components could not be imported. LightRAGTool will not function.")
            return

        if not self.config.openai_api_key:
            log.error("OpenAI API Key not found in config or environment variables.")
            return

        try:
            _llm_func = gpt_4o_mini_complete
            log.info(f"Instantiating LightRAG object (storage init deferred)...")
            self.rag_instance = LightRAG(
                working_dir=str(self.config.working_dir),
                embedding_func=openai_embed,
                embedding_batch_num=self.config.embedding_batch_num,
                embedding_func_max_async=self.config.embedding_func_max_async,
                llm_model_func=_llm_func,
                llm_model_name=self.config.llm_model_name,
                llm_model_max_async=self.config.llm_model_max_async,
                vector_storage=self.config.vector_storage_type,
                vector_db_storage_cls_kwargs=self.config.vector_storage_kwargs,
                cosine_better_than_threshold=self.config.cosine_better_than_threshold,
                chunk_token_size=self.config.chunk_token_size,
                chunk_overlap_token_size=self.config.chunk_overlap_token_size,
                tiktoken_model_name=self.config.tiktoken_model_name,
                auto_manage_storages_states=False
            )
            log.info("LightRAG object instantiated.")

        except Exception as e:
            log.exception("Failed to instantiate LightRAG object in __init__.", exc_info=e)
            self.rag_instance = None

        if LIGHTRAG_AVAILABLE:
            self.register(self.initialize)
            self.register(self.store_text)
            self.register(self.retrieve_naive)
            self.register(self.retrieve_local_kg)
            self.register(self.retrieve_global_kg)
            self.register(self.retrieve_hybrid)
            self.register(self.retrieve_mix_kg_vector)

            # KG Management
            self.register(self.create_entity)
            self.register(self.edit_entity)
            self.register(self.delete_entity)
            self.register(self.create_relation)
            self.register(self.edit_relation)
            self.register(self.delete_relation)
            self.register(self.merge_entities)

            # Utility / Inspection
            self.register(self.get_entity_details)
            self.register(self.get_relation_details)
            self.register(self.get_doc_processing_status)
            self.register(self.delete_document) # Added document deletion
            self.register(self.clear_llm_cache) # Added cache clearing
        else:
            log.warning("LightRAGTool methods not registered as components are unavailable.")

    async def initialize(self) -> str:
        """
        Initializes the LightRAG storage components (Vector DB, KV Stores, Graph DB).
        Must be called once after creating the tool instance and before using other methods.
        Returns 'Initialization successful.' or an error message.
        """
        if self.is_initialized:
            msg = "LightRAGTool is already initialized."
            log.info(msg)
            return msg
        if not self.rag_instance:
             msg = "Error: Cannot initialize, LightRAG instance was not created during instantiation."
             log.error(msg)
             return msg

        log.info("Starting asynchronous initialization of LightRAG storages...")
        try:
            # Directly await the coroutine here
            await self.rag_instance.initialize_storages()
            await initialize_pipeline_status()
            self.is_initialized = True
            msg = "Initialization successful."
            log.info(msg)
            return msg
        except Exception as e:
            log.exception("Failed to initialize LightRAG storages.", exc_info=e)
            self.is_initialized = False
            return f"Error during LightRAGTool async initialization: {str(e)}"

    async def finalize(self) -> str:
         """
         Finalizes the LightRAG storage components, ensuring data is saved.
         Should be called when the application using the tool is shutting down.
         Returns 'Finalization successful.' or an error message.
         """
         if not self.is_initialized:
              msg = "LightRAGTool was not initialized, skipping finalization."
              log.info(msg)
              return msg
         if not self.rag_instance:
              msg = "Error: Cannot finalize, LightRAG instance is missing."
              log.error(msg)
              return msg

         log.info("Starting asynchronous finalization of LightRAG storages...")
         try:
              await self.rag_instance.finalize_storages()
              self.is_initialized = False # Mark as not initialized after finalization
              msg = "Finalization successful."
              log.info(msg)
              return msg
         except Exception as e:
              log.exception("Failed to finalize LightRAG storages.", exc_info=e)
              # State might be inconsistent, but keep is_initialized as True maybe? Or set to False? Let's set to False.
              self.is_initialized = False
              return f"Error during LightRAGTool async finalization: {str(e)}"


    # --- Helper to ensure RAG instance is ready AND initialized ---
    def _ensure_rag_ready(self):
        if not self.rag_instance or not self.is_initialized:
            error_msg = "LightRAG instance is not available or not initialized. Call `await tool.initialize()` first."
            log.error(error_msg)
            raise RuntimeError(error_msg)

    async def store_text(self, text_content: str, document_id: Optional[str] = None, file_path: Optional[str] = None) -> str:
        """
        Stores a piece of text content into the LightRAG system.
        The text will be chunked, embedded, and potentially processed to extract knowledge graph elements (entities, relations).
        Use this to add new thoughts, notes, or documents.

        Args:
            text_content (str): The main text content of the thought or document to store.
            document_id (str, optional): A unique identifier for this document. If not provided, an ID will be generated based on the content hash.
            file_path (str, optional): An optional path or source identifier (like a URL or book title) for citation purposes. Defaults to 'unknown_source'.

        Returns:
            str: Confirmation message indicating success, potential queuing, or failure.
        """
        self._ensure_rag_ready()
        if not text_content or not isinstance(text_content, str):
             return "Error: Invalid input. 'text_content' must be a non-empty string."

        log.info(f"Attempting to store text (ID: {document_id}, Path: {file_path}, first 50 chars): '{text_content[:50]}...'")
        try:

            await self.rag_instance.ainsert(
                input=text_content,
                ids=document_id,
                file_paths=file_path
            )
            return f"Text content (ID: {document_id or 'auto-generated'}) enqueued for processing in LightRAG."
        except Exception as e:
            log.exception(f"Error storing text into LightRAG: {e}", exc_info=e)
            return f"Error storing text into LightRAG: {str(e)}"

    # --- Retrieval Methods ---
    async def _retrieve(self, query: str, mode: Literal["naive", "local", "global", "hybrid", "mix"],
                        top_k: Optional[int] = None) -> Union[Dict, List, str]:
        """Internal helper for retrieval methods."""
        self._ensure_rag_ready()
        if not query or not isinstance(query, str):
             return "Error: Invalid input. 'query' must be a non-empty string."

        k = top_k if top_k is not None else self.config.default_top_k
        log.info(f"Performing '{mode}' retrieval for query (top {k}): '{query[:50]}...'")
        try:
             param = QueryParam(mode=mode, top_k=k)
             response = await self.rag_instance.aquery(query, param=param)
             log.info(f"Retrieval mode '{mode}' completed.")
             log.debug(f"Raw retrieval response type: {type(response)}")
             if isinstance(response, str):
                 return response if response else f"No results or response generated for mode '{mode}'."
             else:
                 return f"Received unexpected response type ({type(response)}) for mode '{mode}'. Needs handling."
        except Exception as e:
            log.exception(f"Error during '{mode}' retrieval: {e}", exc_info=e)
            return f"Error during '{mode}' retrieval: {str(e)}"

    async def retrieve_naive(self, query: str, top_k: Optional[int] = None) -> Union[Dict, List, str]:
        """
        Retrieves information using naive vector search over text chunks.
        Good for finding text passages most similar to the query.

        Args:
            query (str): The search query or question.
            top_k (int, optional): Number of results to retrieve. Defaults to {self.config.default_top_k}.

        Returns:
            str: A synthesized answer based on the retrieved chunks, or an error/no result message.
        """
        return await self._retrieve(query, "naive", top_k)

    async def retrieve_local_kg(self, query: str, top_k: Optional[int] = None) -> Union[Dict, List, str]:
        """
        Retrieves information by searching the local context within the knowledge graph around relevant entities.
        Good for questions about specific entities and their immediate connections.

        Args:
            query (str): The search query or question, likely mentioning specific entities.
            top_k (int, optional): Number of results/context pieces to consider. Defaults to {self.config.default_top_k}.

        Returns:
            str: A synthesized answer based on the KG context, or an error/no result message.
        """
        return await self._retrieve(query, "local", top_k)

    async def retrieve_global_kg(self, query: str, top_k: Optional[int] = None) -> Union[Dict, List, str]:
        """
        Retrieves information by searching globally across the knowledge graph structure.
        Good for broader questions about relationships or patterns in the knowledge base.

        Args:
            query (str): The search query or question.
            top_k (int, optional): Number of results/context pieces to consider. Defaults to {self.config.default_top_k}.

        Returns:
            str: A synthesized answer based on the KG context, or an error/no result message.
        """
        return await self._retrieve(query, "global", top_k)

    async def retrieve_hybrid(self, query: str, top_k: Optional[int] = None) -> Union[Dict, List, str]:
        """
        Retrieves information using a hybrid approach, likely combining vector search with keyword matching within the KG.

        Args:
            query (str): The search query or question.
            top_k (int, optional): Number of results/context pieces to consider. Defaults to {self.config.default_top_k}.

        Returns:
            str: A synthesized answer based on the hybrid results, or an error/no result message.
        """
        return await self._retrieve(query, "hybrid", top_k)

    async def retrieve_mix_kg_vector(self, query: str, top_k: Optional[int] = None) -> Union[Dict, List, str]:
        """
        Retrieves information by integrating results from both knowledge graph traversal and vector search.
        A comprehensive mode aiming for high relevance and context.

        Args:
            query (str): The search query or question.
            top_k (int, optional): Number of results/context pieces to consider. Defaults to {self.config.default_top_k}.

        Returns:
            str: A synthesized answer based on the combined KG and vector results, or an error/no result message.
        """
        return await self._retrieve(query, "mix", top_k)

    # --- Knowledge Graph Management Methods ---

    async def create_entity(self, entity_name: str, description: Optional[str] = None, entity_type: Optional[str] = None, source_id: str = "manual") -> str:
        """
        Creates a new entity (node) directly in the knowledge graph and vector store.

        Args:
            entity_name (str): The unique name of the entity to create.
            description (str, optional): A description of the entity. Defaults to empty.
            entity_type (str, optional): The type of the entity (e.g., 'Person', 'Concept', 'Place'). Defaults to 'UNKNOWN'.
            source_id (str): Identifier for the source of this manual creation. Defaults to 'manual'.

        Returns:
            str: Confirmation message including the entity name, or an error message.
        """
        self._ensure_rag_ready()
        if not entity_name or not isinstance(entity_name, str):
             return "Error: Invalid input. 'entity_name' must be a non-empty string."

        entity_data = {
            "description": description or "",
            "entity_type": entity_type or "UNKNOWN",
            "source_id": source_id,
        }
        log.info(f"Attempting to create KG entity: '{entity_name}' with data: {entity_data}")
        try:
            # Use acreate_entity from LightRAG
            result = await self.rag_instance.acreate_entity(entity_name, entity_data)
            # Assuming result is a dict with entity info on success, or raises error
            log.info(f"Entity creation result: {result}")
            return f"Entity '{entity_name}' created successfully." # Maybe include details from result?
        except ValueError as ve: # Catch expected errors like "already exists"
             log.warning(f"Value error creating entity '{entity_name}': {ve}")
             return f"Error: {str(ve)}"
        except Exception as e:
            log.exception(f"Error creating entity '{entity_name}': {e}", exc_info=e)
            return f"Error creating entity '{entity_name}': {str(e)}"

    async def edit_entity(self, entity_name: str, updates: Dict[str, Any], allow_rename: bool = False) -> str:
        """
        Edits an existing entity in the knowledge graph and vector store.
        Can update properties like description, entity_type, or rename the entity (if allow_rename=True and 'entity_name' is in updates).

        Args:
            entity_name (str): The current name of the entity to edit.
            updates (Dict[str, Any]): A dictionary of properties to update. Keys can be 'description', 'entity_type', or 'entity_name' (for renaming).
            allow_rename (bool): Set to True to allow renaming via the 'entity_name' key in updates. Defaults to False.

        Returns:
            str: Confirmation message indicating success or failure.
        """
        self._ensure_rag_ready()
        if not entity_name or not isinstance(entity_name, str):
             return "Error: Invalid input. 'entity_name' must be a non-empty string."
        if not updates or not isinstance(updates, dict):
             return "Error: Invalid input. 'updates' must be a non-empty dictionary."

        new_name = updates.get("entity_name", entity_name)
        log.info(f"Attempting to edit KG entity: '{entity_name}' with updates: {updates} (Allow rename: {allow_rename})")
        try:
             # Use aedit_entity from LightRAG
             result = await self.rag_instance.aedit_entity(entity_name, updates, allow_rename=allow_rename)
             log.info(f"Entity edit result: {result}")
             action = "renamed to" if new_name != entity_name else "updated"
             return f"Entity '{entity_name}' {action} '{new_name}' successfully."
        except ValueError as ve: # Catch expected errors like "does not exist" or "new name exists"
             log.warning(f"Value error editing entity '{entity_name}': {ve}")
             return f"Error: {str(ve)}"
        except Exception as e:
            log.exception(f"Error editing entity '{entity_name}': {e}", exc_info=e)
            return f"Error editing entity '{entity_name}': {str(e)}"

    async def delete_entity(self, entity_name: str) -> str:
        """
        Deletes an entity and all its associated relationships from the knowledge graph and vector stores.

        Args:
            entity_name (str): The name of the entity to delete.

        Returns:
            str: Confirmation message indicating success or failure.
        """
        self._ensure_rag_ready()
        if not entity_name or not isinstance(entity_name, str):
             return "Error: Invalid input. 'entity_name' must be a non-empty string."

        log.info(f"Attempting to delete KG entity: '{entity_name}'")
        try:
            # Use adelete_by_entity from LightRAG
            await self.rag_instance.adelete_by_entity(entity_name)
            # This method seems to log internally but might not return much.
            return f"Entity '{entity_name}' and its relationships deleted successfully."
        except Exception as e:
            log.exception(f"Error deleting entity '{entity_name}': {e}", exc_info=e)
            return f"Error deleting entity '{entity_name}': {str(e)}"

    async def create_relation(self, source_entity: str, target_entity: str, description: Optional[str] = None, keywords: Optional[str] = None, weight: float = 1.0, source_id: str = "manual") -> str:
        """
        Creates a new directed relationship (edge) between two existing entities in the knowledge graph and vector store.

        Args:
            source_entity (str): The name of the source entity (origin of the relationship).
            target_entity (str): The name of the target entity (destination of the relationship).
            description (str, optional): A description of the relationship. Defaults to empty.
            keywords (str, optional): Keywords describing the relationship (e.g., 'is_a', 'has_part', 'related_to'). Defaults to empty.
            weight (float): A numerical weight for the relationship (e.g., for importance). Defaults to 1.0.
            source_id (str): Identifier for the source of this manual creation. Defaults to 'manual'.

        Returns:
            str: Confirmation message including the source and target, or an error message.
        """
        self._ensure_rag_ready()
        if not source_entity or not target_entity:
            return "Error: Both 'source_entity' and 'target_entity' must be non-empty strings."

        relation_data = {
            "description": description or "",
            "keywords": keywords or "",
            "weight": weight,
            "source_id": source_id,
        }
        log.info(f"Attempting to create KG relation: '{source_entity}' -> '{target_entity}' with data: {relation_data}")
        try:
            # Use acreate_relation from LightRAG
            result = await self.rag_instance.acreate_relation(source_entity, target_entity, relation_data)
            log.info(f"Relation creation result: {result}")
            return f"Relation '{source_entity}' -> '{target_entity}' created successfully."
        except ValueError as ve: # Catch expected errors like "entity does not exist" or "relation exists"
             log.warning(f"Value error creating relation '{source_entity}'->'{target_entity}': {ve}")
             return f"Error: {str(ve)}"
        except Exception as e:
            log.exception(f"Error creating relation '{source_entity}'->'{target_entity}': {e}", exc_info=e)
            return f"Error creating relation '{source_entity}'->'{target_entity}': {str(e)}"

    async def edit_relation(self, source_entity: str, target_entity: str, updates: Dict[str, Any]) -> str:
        """
        Edits an existing relationship between two entities in the knowledge graph and vector store.
        Can update properties like description, keywords, or weight.

        Args:
            source_entity (str): The name of the source entity of the relationship.
            target_entity (str): The name of the target entity of the relationship.
            updates (Dict[str, Any]): A dictionary of properties to update. Keys can be 'description', 'keywords', 'weight'.

        Returns:
            str: Confirmation message indicating success or failure.
        """
        self._ensure_rag_ready()
        if not source_entity or not target_entity:
             return "Error: Both 'source_entity' and 'target_entity' must be non-empty strings."
        if not updates or not isinstance(updates, dict):
             return "Error: Invalid input. 'updates' must be a non-empty dictionary."

        log.info(f"Attempting to edit KG relation: '{source_entity}' -> '{target_entity}' with updates: {updates}")
        try:
             # Use aedit_relation from LightRAG
             result = await self.rag_instance.aedit_relation(source_entity, target_entity, updates)
             log.info(f"Relation edit result: {result}")
             return f"Relation '{source_entity}' -> '{target_entity}' updated successfully."
        except ValueError as ve: # Catch expected errors like "relation does not exist"
             log.warning(f"Value error editing relation '{source_entity}'->'{target_entity}': {ve}")
             return f"Error: {str(ve)}"
        except Exception as e:
            log.exception(f"Error editing relation '{source_entity}'->'{target_entity}': {e}", exc_info=e)
            return f"Error editing relation '{source_entity}'->'{target_entity}': {str(e)}"

    async def delete_relation(self, source_entity: str, target_entity: str) -> str:
        """
        Deletes a specific directed relationship between two entities from the knowledge graph and vector stores.

        Args:
            source_entity (str): The name of the source entity.
            target_entity (str): The name of the target entity.

        Returns:
            str: Confirmation message indicating success or that the relation didn't exist.
        """
        self._ensure_rag_ready()
        if not source_entity or not target_entity:
             return "Error: Both 'source_entity' and 'target_entity' must be non-empty strings."

        log.info(f"Attempting to delete KG relation: '{source_entity}' -> '{target_entity}'")
        try:
            await self.rag_instance.adelete_by_relation(source_entity, target_entity)
            return f"Relation '{source_entity}' -> '{target_entity}' deleted successfully (if it existed)."
        except Exception as e:
            log.exception(f"Error deleting relation '{source_entity}'->'{target_entity}': {e}", exc_info=e)
            return f"Error deleting relation '{source_entity}'->'{target_entity}': {str(e)}"

    async def merge_entities(self, source_entities: List[str], target_entity: str, target_data_override: Optional[Dict[str, Any]] = None) -> str:
        """
        Merges multiple source entities into a single target entity.
        All relationships pointing to/from source entities will be redirected to the target entity.
        Source entities will be deleted after merging. Data is merged using default strategies (concatenate text, keep first type, join unique sources).

        Args:
            source_entities (List[str]): A list of entity names to merge.
            target_entity (str): The name of the entity to merge into (can be new or existing).
            target_data_override (Dict[str, Any], optional): Specific properties (like 'description', 'entity_type') to set on the target entity, overriding any merged values.

        Returns:
            str: Confirmation message indicating success or failure.
        """
        self._ensure_rag_ready()
        if not source_entities or not isinstance(source_entities, list) or not all(isinstance(s, str) for s in source_entities):
             return "Error: 'source_entities' must be a non-empty list of strings."
        if not target_entity or not isinstance(target_entity, str):
             return "Error: 'target_entity' must be a non-empty string."
        if target_entity in source_entities and len(source_entities) == 1:
             return f"Error: Cannot merge entity '{target_entity}' into itself."

        log.info(f"Attempting to merge entities {source_entities} into '{target_entity}' with overrides: {target_data_override}")
        try:
            result = await self.rag_instance.amerge_entities(
                source_entities=source_entities,
                target_entity=target_entity,
                target_entity_data=target_data_override # Pass overrides
                # merge_strategy=... # Add if custom strategies needed
            )
            log.info(f"Entity merge result: {result}")
            return f"Entities {source_entities} merged successfully into '{target_entity}'."
        except ValueError as ve: # Catch expected errors
             log.warning(f"Value error merging entities into '{target_entity}': {ve}")
             return f"Error: {str(ve)}"
        except Exception as e:
            log.exception(f"Error merging entities into '{target_entity}': {e}", exc_info=e)
            return f"Error merging entities into '{target_entity}': {str(e)}"


    async def get_entity_details(self, entity_name: str) -> Union[Dict[str, Any], str]:
        """
        Retrieves detailed information about a specific entity from the knowledge graph and optionally the vector store.

        Args:
            entity_name (str): The name of the entity to inspect.

        Returns:
            Union[Dict[str, Any], str]: A dictionary containing the entity's details (graph data, source ID, optionally vector data) or an error message string.
        """
        self._ensure_rag_ready()
        if not entity_name or not isinstance(entity_name, str):
             return "Error: Invalid input. 'entity_name' must be a non-empty string."
        log.info(f"Getting details for entity: '{entity_name}'")
        try:
             details = await self.rag_instance.get_entity_info(entity_name, include_vector_data=True)
             if not details or not details.get("graph_data"): # Check if graph_data is None or empty
                  return f"Entity '{entity_name}' not found."
             return details
        except Exception as e:
            log.exception(f"Error getting details for entity '{entity_name}': {e}", exc_info=e)
            return f"Error getting details for entity '{entity_name}': {str(e)}"

    async def get_relation_details(self, source_entity: str, target_entity: str) -> Union[Dict[str, Any], str]:
        """
        Retrieves detailed information about a specific relationship between two entities.

        Args:
            source_entity (str): The name of the source entity.
            target_entity (str): The name of the target entity.

        Returns:
            Union[Dict[str, Any], str]: A dictionary containing the relationship's details (graph data, source ID, optionally vector data) or an error message string.
        """
        self._ensure_rag_ready()
        if not source_entity or not target_entity:
             return "Error: Both 'source_entity' and 'target_entity' must be non-empty strings."
        log.info(f"Getting details for relation: '{source_entity}' -> '{target_entity}'")
        try:
             details = await self.rag_instance.get_relation_info(source_entity, target_entity, include_vector_data=True)
             if not details or not details.get("graph_data"): # Check if graph_data is None or empty
                  return f"Relation '{source_entity}' -> '{target_entity}' not found."
             return details
        except Exception as e:
            log.exception(f"Error getting details for relation '{source_entity}'->'{target_entity}': {e}", exc_info=e)
            return f"Error getting details for relation '{source_entity}'->'{target_entity}': {str(e)}"

    async def get_doc_processing_status(self) -> Union[Dict[str, int], str]:
        """
        Gets the current count of documents in each processing status (Pending, Processing, Processed, Failed).

        Returns:
            Union[Dict[str, int], str]: A dictionary mapping status names (e.g., 'PENDING', 'PROCESSED') to their counts, or an error message string.
        """
        self._ensure_rag_ready()
        log.info("Getting document processing status counts.")
        try:
             status_counts = await self.rag_instance.get_processing_status()
             return {str(k).split('.')[-1]: v for k, v in status_counts.items()}
        except Exception as e:
            log.exception(f"Error getting document processing status: {e}", exc_info=e)
            return f"Error getting document processing status: {str(e)}"

    async def delete_document(self, document_id: str) -> str:
        """
        Deletes a document and all its associated data (chunks, KG elements derived solely from it) from the system.
        Use with caution, as this permanently removes the thought and its connections.

        Args:
            document_id (str): The unique ID of the document/thought to delete. Use the ID returned by store_text or an ID you provided.

        Returns:
            str: Confirmation message indicating success or failure.
        """
        self._ensure_rag_ready()
        if not document_id or not isinstance(document_id, str):
             return "Error: Invalid input. 'document_id' must be a non-empty string."

        log.info(f"Attempting to delete document and related data for ID: '{document_id}'")
        try:
            await self.rag_instance.adelete_by_doc_id(document_id)
            return f"Document '{document_id}' and its related data deleted successfully (if it existed)."
        except Exception as e:
            log.exception(f"Error deleting document '{document_id}': {e}", exc_info=e)
            return f"Error deleting document '{document_id}': {str(e)}"

    async def clear_llm_cache(self, modes: Optional[List[Literal["default", "naive", "local", "global", "hybrid", "mix"]]] = None) -> str:
        """
        Clears cached LLM responses for specified query modes or all modes if none specified.
        'default' mode typically refers to extraction cache.

        Args:
            modes (Optional[List[Literal['default', 'naive', 'local', 'global', 'hybrid', 'mix']]]):
                List of cache modes to clear. If None, clears cache for all modes.

        Returns:
            str: Confirmation message indicating which caches were cleared or an error message.
        """
        self._ensure_rag_ready()
        log.info(f"Attempting to clear LLM cache for modes: {modes or 'ALL'}")
        try:
            await self.rag_instance.aclear_cache(modes=modes)
            return f"LLM cache cleared successfully for modes: {modes or 'ALL'}."
        except ValueError as ve: # Catch invalid mode errors
            log.warning(f"Value error clearing cache: {ve}")
            return f"Error: {str(ve)}"
        except Exception as e:
            log.exception(f"Error clearing LLM cache: {e}", exc_info=e)
            return f"Error clearing LLM cache: {str(e)}"

