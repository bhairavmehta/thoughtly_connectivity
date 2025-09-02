from typing import Dict, List, Any
import json
import uuid
from agno.tools import Toolkit
from agno.utils.log import logger
from typing import Optional
import os
from dotenv import load_dotenv
from agents.utils.responses import PineconeAuthConfig
load_dotenv()

try:
    from pinecone import  (
                Pinecone,
                ServerlessSpec,
                )
except ImportError:
    logger.warning("Pinecone package not installed. Please install using `pip install pinecone-client`")
    from pinecone import (
        Pinecone,
        ServerlessSpec,
    )

class PineconeTools(Toolkit):
    """
    Agno Toolkit for working with a Pinecone vector database for thought embeddings.
    This simplified version focuses only on upsert and querying thoughts.
    """

    def __init__(self,
                 pinecone_config : PineconeAuthConfig = None,
                 name_space:str ="AI-Reflections",
                ):
        """
        Initialize the Direct Pinecone Thought Tools toolkit.

        Args:
            pinecone_config : This class consists of all the required things for pinecone it i.
            name_space (str): name of the pinecone space.
        """
        super().__init__(name="pinecone_thought_tools")

        self.register(self.upsert_thought)
        self.register(self.query_similar_thoughts)

        self._pc = None
        self._index = None
        self.api_key = pinecone_config.api_key or os.getenv("PINECONE_API_KEY")
        self.index_name = pinecone_config.index_name
        self.dimension = pinecone_config.dimensions
        self.name_space = name_space
        self.index_name = pinecone_config.index_name
        # Connect to Pinecone if credentials are provided
        if self.api_key:
            self._connect_to_pinecone()

            # Connect to index if provided
            if self.index_name:
                self._connect_to_index(self.index_name)

    def _connect_to_pinecone(self):
        """Initialize connection to Pinecone"""
        try:
            logger.info("Connecting to Pinecone")
            self._pc = Pinecone(api_key=self.api_key)
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Pinecone: {e}")
            return False

    def _connect_to_index(self, index_name):
        """Connect to a specific Pinecone index"""
        try:
            logger.info(f"Connecting to Pinecone index: {index_name}")
            self._index = self._pc.Index(index_name)
            self.index_name = index_name
            return True
        except Exception as e:
            logger.error(f"Failed to connect to index {index_name}: {e}")
            return False

    def _ensure_connected(self):
        """Ensure connection to Pinecone is established"""
        if self._pc is None:
            if not self._connect_to_pinecone():
                raise ValueError("Not connected to Pinecone. Please check your API key.")

    def _ensure_index_connected(self):
        """Ensure connection to a Pinecone index is established"""
        self._ensure_connected()
        if self._index is None:
            raise ValueError(f"Not connected to a Pinecone index. Please connect to an index first.")

    def _get_embedding_from_openai(self, text: str) -> List[float]:
        """
        Get text embeddings from OpenAI API.

        Args:
            text (str): The text to convert to embeddings

        Returns:
            List[float]: The embedding vector
        """
        try:
            import openai

            # Check if we're using the newer client or older client
            if hasattr(openai, "OpenAI"):
                # New OpenAI client version
                client = openai.OpenAI()
                response = client.embeddings.create(input=text, model="text-embedding-3-small")
                return response.data[0].embedding
            else:
                # Legacy OpenAI client
                response = openai.Embedding.create(input=text, model="text-embedding-3-small")
                return response["data"][0]["embedding"]

        except ImportError:
            logger.warning("OpenAI package not installed. Using fallback random embeddings.")
            # Fallback to random embeddings
            import numpy as np
            np.random.seed(hash(text) % 2 ** 32)
            return np.random.normal(0, 1, self.dimension).tolist()
        except Exception as e:
            logger.warning(f"Error getting OpenAI embeddings: {e}. Using fallback random embeddings.")
            # Fallback to random embeddings
            import numpy as np
            np.random.seed(hash(text) % 2 ** 32)
            return np.random.normal(0, 1, self.dimension).tolist()

    def list_indexes(self) -> str:
        """
        List all available Pinecone indexes.

        Returns:
            str: JSON string with list of index names
        """
        try:
            self._ensure_connected()

            indexes = self._pc.list_indexes()
            index_names = [index.name for index in indexes]

            return json.dumps(index_names)
        except Exception as e:
            logger.error(f"Failed to list indexes: {e}")
            return f"Error: Failed to list Pinecone indexes: {e}"

    def create_index(
            self,
            index_name: str,
            dimension: int = 1536,
            metric : str ="cosine",
            cloud: str = "aws",
            region : str = "us-east-1",
            vector_type: str = "dense",
    ) -> str:
        """
        Create a new serverless Pinecone index.

        Args:
            index_name (str): Name for the new index
            dimension (int): Dimension of vectors (default: 1536 for OpenAI embeddings)
            metric (str): Distance metric (default: cosine)
            cloud (pinecone.CloudProvider): Cloud provider for serverless (aws, gcp, azure)
            region (pinecone.___Region) : region of the serverless
            vector_type (VectorType) : type of the vector to be initialized

        Returns:
            str: Success or error message

        """
        try:
            self._ensure_connected()

            indexes = self._pc.list_indexes()
            index_names = [index.name for index in indexes]

            if index_name in index_names:
                logger.info(f"Index {index_name} already exists. Connecting to it.")
                self._connect_to_index(index_name)
                return f"Index {index_name} already exists. Connected to it."

            self._pc.create_index(
                name=index_name,
                dimension=dimension,
                metric=metric,
                spec=ServerlessSpec(
                    cloud=cloud,
                    region=region
                ),
                vector_type=vector_type
            )
            self._connect_to_index(index_name)
            self.dimension = dimension

            return f"Created new Pinecone index: {index_name}"
        except Exception as e:
            logger.error(f"Failed to create index: {e}")
            return f"Error: Failed to create Pinecone index: {e}"

    def upsert_thought(
            self,
            content: str,
            metadata: Optional[Dict[str, Any]] = None,
            thought_id: Optional[str] = None,
    ) -> str:
        """
        Insert or update a thought in the Pinecone index.

        Args:
            content (str): The content of the thought
            metadata (Dict[str, Any], optional): Additional metadata for the thought
            thought_id (str, optional): ID for the thought (generates one if not provided)

        Returns:
            str: The ID of the upsert thought or error message
        """
        try:
            self._ensure_index_connected()
            if not thought_id:
                thought_id = str(uuid.uuid4())

            logger.info(f"Upsert thought with ID {thought_id}")
            embedding = self._get_embedding_from_openai(content)
            if metadata is None:
                metadata = {}
            metadata["text"] = content
            self._index.upsert(
                vectors=[
                    {
                        "id": thought_id,
                        "values": embedding,
                        "metadata": metadata
                    }
                ],
                namespace=self.name_space
            )

            logger.info(f"Thought {thought_id} upsert successfully")
            return thought_id
        except Exception as e:
            logger.error(f"Failed to upsert thought: {e}")
            return f"Error: Failed to upsert thought: {e}"

    def upsert_thoughts_batch(
            self,
            thoughts: List[Dict[str, Any]],
            namespace: Optional[str] = None
    ) -> str:
        """
        Insert or update multiple thoughts in a batch.

        Args:
            thoughts (List[Dict]): List of thought dictionaries, each containing:
                - id (optional): Thought ID
                - content: Thought content
                - metadata (optional): Additional metadata
            namespace (str, optional): Namespace for the vectors

        Returns:
            str: JSON string with IDs of upsert thoughts or error message
        """
        try:
            self._ensure_index_connected()

            logger.info(f"Upsert batch of {len(thoughts)} thoughts")

            vectors = []
            thought_ids = []

            for thought in thoughts:
                thought_id = thought.get("id")
                if not thought_id:
                    thought_id = str(uuid.uuid4())

                thought_ids.append(thought_id)

                content = thought["content"]
                metadata = thought.get("metadata", {})

                metadata["text"] = content

                embedding = self._get_embedding_from_openai(content)

                vectors.append({
                    "id": thought_id,
                    "values": embedding,
                    "metadata": metadata
                })

            # Upsert the batch
            self._index.upsert(vectors=vectors, namespace=namespace)

            logger.info(f"Batch of {len(thoughts)} thoughts upsert successfully")
            return json.dumps(thought_ids)
        except Exception as e:
            logger.error(f"Failed to upsert thoughts batch: {e}")
            return f"Error: Failed to upsert thoughts batch: {e}"

    def query_similar_thoughts(
            self,
            query: str,
            top_k: int = 5,
            namespace: Optional[str] = None
    ) -> str:
        """
        Query for thoughts similar to the given text query.

        Args:
            query (str): Query text to find similar thoughts
            top_k (int): Number of results to return
            namespace (str, optional): Namespace to query

        Returns:
            str: JSON string with query results or error message
        """
        try:
            self._ensure_index_connected()

            logger.info(f"Querying for thoughts similar to: '{query}'")

            # Generate embeddings for the query
            query_embedding = self._get_embedding_from_openai(query)

            # Query the index
            results = self._index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True,
                namespace=namespace
            )

            matches = []
            for match in results.matches:
                matches.append({
                    "id": match.id,
                    "score": match.score,
                    "content": match.metadata.get("text", ""),
                    "metadata": {k: v for k, v in match.metadata.items() if k != "text"}
                })

            logger.info(f"Found {len(matches)} matching thoughts")
            return json.dumps(matches, default=str)
        except Exception as e:
            logger.error(f"Failed to query similar thoughts: {e}")
            return f"Error: Failed to query similar thoughts: {e}"

    def fetch_thought(self, thought_id: str, namespace: Optional[str] = None) -> str:
        """
        Fetch a thought by its ID.

        Args:
            thought_id (str): ID of the thought to fetch
            namespace (str, optional): Namespace to fetch from

        Returns:
            str: JSON string with the thought data or error message
        """
        try:
            self._ensure_index_connected()

            logger.info(f"Fetching thought with ID {thought_id}")

            # Fetch the vector
            result = self._index.fetch(ids=[thought_id], namespace=namespace)

            # Check if the thought was found
            if not result.vectors or thought_id not in result.vectors:
                logger.warning(f"Thought with ID {thought_id} not found")
                return f"Error: Thought with ID '{thought_id}' not found"

            # Extract the thought data
            vector_data = result.vectors[thought_id]
            thought = {
                "id": thought_id,
                "content": vector_data.metadata.get("text", ""),
                "metadata": {k: v for k, v in vector_data.metadata.items() if k != "text"}
            }

            return json.dumps(thought, default=str)
        except Exception as e:
            logger.error(f"Failed to fetch thought: {e}")
            return f"Error: Failed to fetch thought: {e}"

    def delete_thought(self, thought_id: str, namespace: Optional[str] = None) -> str:
        """
        Delete a thought by its ID.

        Args:
            thought_id (str): ID of the thought to delete
            namespace (str, optional): Namespace to delete from

        Returns:
            str: Success or error message
        """
        try:
            self._ensure_index_connected()

            logger.info(f"Deleting thought with ID {thought_id}")

            # Delete the vector
            self._index.delete(ids=[thought_id], namespace=namespace)

            return f"Thought with ID '{thought_id}' deleted successfully"
        except Exception as e:
            logger.error(f"Failed to delete thought: {e}")
            return f"Error: Failed to delete thought: {e}"

    def describe_index_stats(self) -> str:
        """
        Get statistics about the current index.

        Returns:
            str: JSON string with index statistics or error message
        """
        try:
            self._ensure_index_connected()

            logger.info(f"Getting statistics for index {self.index_name}")

            stats = self._index.describe_index_stats()

            stats_dict = {
                "dimension": stats.dimension,
                "index_fullness": stats.index_fullness,
                "namespaces": {ns: {"vector_count": stats.namespaces[ns].vector_count} for ns in stats.namespaces},
                "total_vector_count": stats.total_vector_count
            }

            return json.dumps(stats_dict, default=str)
        except Exception as e:
            logger.error(f"Failed to get index statistics: {e}")
            return f"Error: Failed to get index statistics: {e}"

