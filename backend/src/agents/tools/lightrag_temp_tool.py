import os
import asyncio
import logging
from textwrap import dedent
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
    logging.error(f"Failed to import LightRAG components. Ensure LightRAG is installed correctly. Error: {e}")
    LightRAG = object
    QueryParam = object
    EmbeddingFunc = object
    def gpt_4o_mini_complete(*args, **kwargs): pass
    def openai_embed(*args, **kwargs): pass
    LIGHTRAG_AVAILABLE = False

load_dotenv()
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
log = logging.getLogger(__name__)

class LightRAGToolConfig(BaseModel):
    """Configuration settings for the LightRAG Tool based on HKUDS/LightRAG."""
    working_dir: DirectoryPath = Field(
        default="./lightrag_workspace",
        description="Directory for LightRAG to store its data (KG, vector index, etc.). Will be created if it doesn't exist."
    )
    openai_api_key: str = Field(
        default_factory=lambda: os.getenv("OPENAI_API_KEY"),
        description="OpenAI API Key."
    )
    embedding_model_name: str = Field(default="text-embedding-3-small", description="OpenAI embedding model name.")
    embedding_dimensions: int = Field(default=1536, description="Dimensions of the embedding model (1536 for text-embedding-3-small).")
    llm_model_name: str = Field(default="gpt-4o-mini", description="OpenAI model ID for generation/processing.")

    vector_storage_type: str = Field(default="FaissVectorDBStorage", description="Type of vector storage to use.")
    vector_storage_kwargs: Dict[str, Any] = Field(
        default={"index_factory_string": "Flat", "skip_initialization": True},
        description="Keyword arguments for the vector storage class (e.g., FaissVectorDBStorage). Use 'index_factory_string' for FAISS CPU index types."
    )

    default_top_k: int = Field(default=5, description="Default number of results for retrieval queries.")

    class Config:
        env_file = '.env'
        extra = 'ignore'


class LightRAGTool(Toolkit):
    """
    An Agno Toolkit for interacting with a persistent thought store using HKUDS/LightRAG.
    Manages text insertion, retrieval (vector + KG), and knowledge graph editing via a LightRAG instance.
    Uses FAISS CPU for vector storage by default.
    """
    def __init__(self, config: Optional[LightRAGToolConfig] = None):
        # Synchronous part of initialization
        super().__init__(name="lightrag_tool")
        self.config = config or LightRAGToolConfig()
        self.rag_instance: Optional[LightRAG] = None

        log.info(f"Initializing LightRAGTool with config: {self.config.model_dump(exclude={'openai_api_key'})}")

        if not LIGHTRAG_AVAILABLE:
            log.error("LightRAG components could not be imported. LightRAGTool will not function.")
            return  # Stop initialization

        if not self.config.openai_api_key:
            log.error("OpenAI API Key not found in config or environment variables.")
            raise ValueError("Missing OpenAI API Key for LightRAGTool.")

        try:
            _llm_func = gpt_4o_mini_complete
            _embedding_func = openai_embed
            # Instantiate LightRAG
            log.info(f"Instantiating LightRAG with working_dir='{self.config.working_dir}', vector_storage='{self.config.vector_storage_type}'")
            self.rag_instance = LightRAG(
                working_dir=str(self.config.working_dir),
                embedding_func=_embedding_func,
                llm_model_func=_llm_func,
                vector_storage=self.config.vector_storage_type,
                vector_db_storage_cls_kwargs=self.config.vector_storage_kwargs,
            )
        except Exception as e:
            log.exception("Failed to instantiate LightRAG.", exc_info=e)
            self.rag_instance = None
            raise RuntimeError(f"Error during LightRAGTool setup: {e}") from e

    async def initialize(self):
        """Async initialization of LightRAG storages."""
        await self.rag_instance.initialize_storages()
        print(self.rag_instance.chunk_entity_relation_graph)

    @classmethod
    async def create(cls, config: Optional[LightRAGToolConfig] = None):
        """
        Async factory method to instantiate and initialize the LightRAGTool.
        Use this method instead of directly calling the constructor if asynchronous initialization is required.
        """
        instance = cls(config=config)
        if instance.rag_instance is not None:
            log.info("Running asynchronous initialization of LightRAG storages...")
            await instance.initialize()
            log.info("LightRAG storages initialized successfully.")
            instance.register(instance.store_text)
            instance.register(instance.retrieve_naive)
            instance.register(instance.retrieve_local)
            instance.register(instance.retrieve_global)
            instance.register(instance.retrieve_hybrid)
            instance.register(instance.retrieve_mix)
            instance.register(instance.create_entity)
            instance.register(instance.edit_entity)
            instance.register(instance.create_relation)
            instance.register(instance.edit_relation)
        else:
            log.warning("LightRAGTool methods not registered as instance is unavailable.")
        return instance

    def _ensure_rag_ready(self):
        if not self.rag_instance:
            raise RuntimeError("LightRAG instance is not available or initialization failed.")

    # --- Tool Methods ---
    async def store_text(self, text: str) -> str:
        """
        Inserts a piece of text into the LightRAG system (vector store and potential KG processing).

        Args:
            text (str): The text content to store.

        Returns:
            str: Confirmation message indicating success or failure.
        """
        self._ensure_rag_ready()
        if not text or not isinstance(text, str):
            return "Error: Invalid input. 'text' must be a non-empty string."

        log.info(f"Attempting to insert text (first 50 chars): '{text[:50]}...'")
        try:
            self.rag_instance.insert(text)
            log.info(f"Text insertion completed.")
            return "Text inserted successfully into LightRAG."
        except Exception as e:
            log.exception(f"Error inserting text into LightRAG: {e}", exc_info=e)
            return f"Error inserting text into LightRAG: {str(e)}"

    async def _retrieve(self, query: str, mode: Literal["naive", "local", "global", "hybrid", "mix"],
                        top_k: Optional[int] = None) -> Union[Dict, List, str]:
        """Internal retrieval helper calling rag.query"""
        self._ensure_rag_ready()
        k = top_k if top_k is not None else self.config.default_top_k
        log.info(f"Performing '{mode}' retrieval for query (top {k}): '{query[:50]}...'")
        try:
            param = QueryParam(mode=mode, top_k=k)
            response = self.rag_instance.query(query, param=param)
            log.info(f"Retrieval mode '{mode}' completed.")
            log.debug(f"Raw retrieval response: {response}")
            return response if response else f"No results found for mode '{mode}'."
        except Exception as e:
            log.exception(f"Error during '{mode}' retrieval: {e}", exc_info=e)
            return f"Error during '{mode}' retrieval: {str(e)}"

    async def retrieve_naive(self, query: str, top_k: Optional[int] = None) -> Union[Dict, List, str]:
        return await self._retrieve(query, "naive", top_k)

    async def retrieve_local(self, query: str, top_k: Optional[int] = None) -> Union[Dict, List, str]:
        return await self._retrieve(query, "local", top_k)

    async def retrieve_global(self, query: str, top_k: Optional[int] = None) -> Union[Dict, List, str]:
        return await self._retrieve(query, "global", top_k)

    async def retrieve_hybrid(self, query: str, top_k: Optional[int] = None) -> Union[Dict, List, str]:
        return await self._retrieve(query, "hybrid", top_k)

    async def retrieve_mix(self, query: str, top_k: Optional[int] = None) -> Union[Dict, List, str]:
        return await self._retrieve(query, "mix", top_k)

    async def create_entity(self, entity_name: str, properties: Dict[str, Any]) -> Union[Dict, str]:
        self._ensure_rag_ready()
        log.info(f"Creating KG entity: '{entity_name}' with properties: {properties}")
        try:
            result = await self.rag_instance.create_entity(entity_name, properties)
            log.info(f"Entity creation result: {result}")
            return result if result else f"Entity '{entity_name}' may have been created (result empty)."
        except Exception as e:
            log.exception(f"Error creating entity '{entity_name}': {e}", exc_info=e)
            return f"Error creating entity '{entity_name}': {str(e)}"

    async def edit_entity(self, entity_name: str, updates: Dict[str, Any]) -> Union[Dict, str]:
        self._ensure_rag_ready()
        log.info(f"Editing KG entity: '{entity_name}' with updates: {updates}")
        try:
            result = await self.rag_instance.edit_entity(entity_name, updates)
            log.info(f"Entity edit result: {result}")
            return result if result else f"Entity '{entity_name}' may have been edited (result empty)."
        except Exception as e:
            log.exception(f"Error editing entity '{entity_name}': {e}", exc_info=e)
            return f"Error editing entity '{entity_name}': {str(e)}"

    async def create_relation(self, entity_from: str, entity_to: str, properties: Dict[str, Any]) -> Union[Dict, str]:
        self._ensure_rag_ready()
        log.info(f"Creating KG relation: '{entity_from}' -> '{entity_to}' with properties: {properties}")
        try:
            result = await self.rag_instance.create_relation(entity_from, entity_to, properties)
            log.info(f"Relation creation result: {result}")
            return result if result else f"Relation '{entity_from}'->'{entity_to}' may have been created (result empty)."
        except Exception as e:
            log.exception(f"Error creating relation '{entity_from}'->'{entity_to}': {e}", exc_info=e)
            return f"Error creating relation '{entity_from}'->'{entity_to}': {str(e)}"

    async def edit_relation(self, entity_from: str, entity_to: str, updates: Dict[str, Any]) -> Union[Dict, str]:
        self._ensure_rag_ready()
        log.info(f"Editing KG relation: '{entity_from}' -> '{entity_to}' with updates: {updates}")
        try:
            result = await self.rag_instance.edit_relation(entity_from, entity_to, updates)
            log.info(f"Relation edit result: {result}")
            return result if result else f"Relation '{entity_from}'->'{entity_to}' may have been edited (result empty)."
        except Exception as e:
            log.exception(f"Error editing relation '{entity_from}'->'{entity_to}': {e}", exc_info=e)
            return f"Error editing relation '{entity_from}'->'{entity_to}': {str(e)}"
