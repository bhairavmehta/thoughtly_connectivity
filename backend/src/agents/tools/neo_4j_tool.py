from typing import Dict, Any, Optional
import json
import uuid
from neo4j import GraphDatabase
from agno.tools import Toolkit
from agno.utils.log import logger
import os
from dotenv import load_dotenv
load_dotenv()

class Neo4jThoughtTools(Toolkit):
    """Agno Toolkit for working with a Neo4j-based thought graph database"""
    def __init__(self, uri="", username="", password=""):
        """Initialize the Neo4j Thought Tools toolkit"""
        super().__init__(name="neo4j_thought_tools")

        self.register(self.initialize_connection)
        self.register(self.add_thought)
        self.register(self.connect_thoughts)
        self.register(self.get_thought)
        self.register(self.get_related_thoughts)
        self.register(self.search_thoughts)
        self.register(self.execute_custom_query)
        self.register(self.get_graph_summary)
        self.register(self.get_all_node_ids)


        self.driver = None
        self.is_initialized = False
        self.uri = uri
        self.username = username
        self.password = password
        self.initialize_connection()

    def _ensure_initialized(self):
        """Check if the Neo4j connection is initialized"""
        if not self.is_initialized or self.driver is None:
            raise ValueError("Neo4j connection not initialized. Call 'initialize_connection' first.")

    def initialize_connection(self) -> str:
        logger.info(f"Initializing Neo4j connection to {self.uri}")
        try:
            self.driver = GraphDatabase.driver(uri=self.uri, auth=(self.username, self.password))
            self.driver.verify_connectivity()

            with self.driver.session() as session:
                session.run("""
                    CREATE CONSTRAINT thought_id_unique IF NOT EXISTS
                    FOR (t:Thought)
                    REQUIRE t.id IS UNIQUE
                """)

            self.is_initialized = True
            logger.info("Neo4j connection initialized successfully")
            return "Neo4j connection initialized successfully"
        except Exception as e:
            logger.error(f"Failed to initialize Neo4j connection: {e}")
            return f"Error: Failed to initialize Neo4j connection: {e}"

    def add_thought(self, content: str, thought_id:str = "Thought",
                    metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        Add a new thought to the knowledge graph.

        Args:
            content (str): The content of the thought
            thought_id (str): Custom ID for the thought. If not provided, a UUID will be generated.
                            LLMs should provide a descriptive ID composed of key concepts from the thought.
            metadata (Dict[str, Any], optional): Additional metadata for the thought

        Returns:
            str: The ID of the created thought or error message
        """
        try:
            self._ensure_initialized()

            if not thought_id:
                thought_id = str(uuid.uuid4())
                logger.error(f"No ID provided")
            else:
                logger.info(f"Using provided thought ID: {thought_id}")

            metadata_str = json.dumps(metadata or {})

            with self.driver.session() as session:
                session.run("""
                    CREATE (t:Thought {
                        id: $id,
                        content: $content,
                        timestamp: datetime(),
                        metadata_json: $metadata_json
                    })
                """, id=thought_id, content=content, metadata_json=metadata_str)

            return thought_id
        except Exception as e:
            logger.error(f"Failed to add thought: {e}")
            return f"Error: Failed to add thought: {e}"

    def connect_thoughts(
            self,
            source_id: str,
            target_id: str,
            relationship_type: str = "RELATED_TO",
            weight: float = 0.5,
            properties: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Create a weighted relationship between two thoughts.

        Args:
            source_id (str): ID of the source thought
            target_id (str): ID of the target thought
            relationship_type (str): Type of relationship (default: "RELATED_TO")
            weight (float): Strength of connection from 0.0 to 1.0
            properties (Dict[str, Any], optional): Additional properties for the relationship

        Returns:
            str: Success or error message
        """
        try:
            self._ensure_initialized()

            logger.info(
                f"Connecting thought {source_id} to {target_id} with type {relationship_type} and weight {weight}")

            # Prepare properties
            if properties is None:
                properties = {}

            # Add weight to properties
            properties["weight"] = weight

            # Convert properties to individual parameters
            params = {
                "source_id": source_id,
                "target_id": target_id,
                "weight": weight
            }

            # Add any additional properties as separate parameters
            for key, value in properties.items():
                if key != "weight":  # Skip weight as we already added it
                    params[f"prop_{key}"] = value

            # Build the property string for the query
            props = "{ weight: $weight"
            for key in properties.keys():
                if key != "weight":
                    props += f", {key}: $prop_{key}"
            props += " }"

            # Create the relationship
            with self.driver.session() as session:
                query = f"""
                    MATCH (source:Thought {{id: $source_id}})
                    MATCH (target:Thought {{id: $target_id}})
                    MERGE (source)-[r:`{relationship_type}` {props}]->(target)
                    RETURN r
                """

                result = session.run(query, **params)

                if result.single() is not None:
                    return f"Thoughts connected successfully with relationship type '{relationship_type}' and weight {weight}"
                else:
                    return "Error: Failed to connect thoughts - one or both thoughts not found"
        except Exception as e:
            logger.error(f"Failed to connect thoughts: {e}")
            return f"Error: Failed to connect thoughts: {e}"

    def get_thought(self, thought_id: str) -> str:
        """
        Retrieve a thought by its ID.

        Args:
            thought_id (str): ID of the thought to retrieve

        Returns:
            str: JSON string of the thought data or error message
        """
        try:
            self._ensure_initialized()

            logger.info(f"Getting thought with ID {thought_id}")

            with self.driver.session() as session:
                result = session.run("""
                    MATCH (t:Thought {id: $id})
                    RETURN t
                """, id=thought_id)

                record = result.single()
                if record:
                    thought = dict(record["t"])

                    # Parse metadata_json back to dictionary if it exists
                    if "metadata_json" in thought:
                        try:
                            thought["metadata"] = json.loads(thought["metadata_json"])
                            del thought["metadata_json"]  # Remove the JSON string version
                        except (json.JSONDecodeError, TypeError):
                            thought["metadata"] = {}  # Fallback if JSON parsing fails

                    return json.dumps(thought, default=str)
                else:
                    return f"Error: Thought with ID '{thought_id}' not found"
        except Exception as e:
            logger.error(f"Failed to get thought: {e}")
            return f"Error: Failed to get thought: {e}"

    def get_related_thoughts(
            self,
            thought_id: str,
            relationship_type: Optional[str] = None,
            min_weight: float = 0.0
    ) -> str:
        """
        Get thoughts related to a given thought.

        Args:
            thought_id (str): ID of the thought to find relationships for
            relationship_type (str, optional): Filter by relationship type
            min_weight (float): Minimum weight threshold (0.0 to 1.0)

        Returns:
            str: JSON string with the related thoughts or error message
        """
        try:
            self._ensure_initialized()

            logger.info(f"Getting related thoughts for thought {thought_id}")

            rel_filter = f":`{relationship_type}`" if relationship_type else ""
            weight_filter = f"r.weight >= {min_weight}"

            with self.driver.session() as session:
                result = session.run(f"""
                    MATCH (t:Thought {{id: $id}})-[r{rel_filter}]->(related:Thought)
                    WHERE {weight_filter}
                    RETURN related, type(r) AS relationship_type, r.weight AS weight, 
                           properties(r) AS properties
                """, id=thought_id)

                related = []
                for record in result:
                    thought_data = dict(record["related"])

                    # Parse metadata_json back to dictionary if it exists
                    if "metadata_json" in thought_data:
                        try:
                            thought_data["metadata"] = json.loads(thought_data["metadata_json"])
                            del thought_data["metadata_json"]  # Remove the JSON string version
                        except (json.JSONDecodeError, TypeError):
                            thought_data["metadata"] = {}  # Fallback if JSON parsing fails

                    related.append({
                        "thought": thought_data,
                        "relationship": {
                            "type": record["relationship_type"],
                            "weight": record["weight"],
                            "properties": record["properties"]
                        }
                    })

                return json.dumps(related, default=str)
        except Exception as e:
            logger.error(f"Failed to get related thoughts: {e}")
            return f"Error: Failed to get related thoughts: {e}"

    def search_thoughts(self, query_text: str, limit: int = 10) -> str:
        """
        Search for thoughts containing the given query text.

        Args:
            query_text (str): Search query string
            limit (int): Maximum number of results to return

        Returns:
            str: JSON string with matching thoughts or error message
        """
        try:
            self._ensure_initialized()

            logger.info(f"Searching thoughts with query '{query_text}' (limit: {limit})")

            with self.driver.session() as session:
                result = session.run("""
                    MATCH (t:Thought)
                    WHERE t.content CONTAINS $query_text
                    RETURN t
                    LIMIT $limit
                """, query_text=query_text, limit=limit)

                thoughts = []
                for record in result:
                    thought_data = dict(record["t"])

                    # Parse metadata_json back to dictionary if it exists
                    if "metadata_json" in thought_data:
                        try:
                            thought_data["metadata"] = json.loads(thought_data["metadata_json"])
                            del thought_data["metadata_json"]  # Remove the JSON string version
                        except (json.JSONDecodeError, TypeError):
                            thought_data["metadata"] = {}  # Fallback if JSON parsing fails

                    thoughts.append(thought_data)

                return json.dumps(thoughts, default=str)
        except Exception as e:
            logger.error(f"Failed to search thoughts: {e}")
            return f"Error: Failed to search thoughts: {e}"

    def execute_custom_query(self, query: str, params: Optional[Dict[str, Any]] = None) -> str:
        """
        Execute a custom Cypher query.

        Args:
            query (str): Cypher query to execute
            params (Dict[str, Any], optional): Parameters for the query

        Returns:
            str: JSON string with query results or error message
        """
        try:
            self._ensure_initialized()

            logger.info(f"Executing custom query: {query}")

            with self.driver.session() as session:
                result = session.run(query, params or {})

                records = []
                for record in result:
                    record_dict = {}
                    for key, value in record.items():
                        if hasattr(value, "__iter__") and hasattr(value, "keys"):
                            record_dict[key] = dict(value)
                        else:
                            record_dict[key] = value
                    records.append(record_dict)

                return json.dumps(records, default=str)
        except Exception as e:
            logger.error(f"Failed to execute custom query: {e}")
            return f"Error: Failed to execute custom query: {e}"

    def get_graph_summary(self) -> str:
        """
        Get a summary of the thought graph.

        Returns:
            str: JSON string with graph summary or error message
        """
        try:
            self._ensure_initialized()

            logger.info("Getting graph summary")

            with self.driver.session() as session:
                node_count = session.run("""
                    MATCH (t:Thought)
                    RETURN COUNT(t) as count
                """).single()["count"]

                rel_count = session.run("""
                    MATCH ()-[r]->()
                    RETURN COUNT(r) as count
                """).single()["count"]

                rel_types = session.run("""
                    MATCH ()-[r]->()
                    RETURN DISTINCT type(r) as type, COUNT(r) as count
                    ORDER BY count DESC
                """).values()

                summary = {
                    "thought_count": node_count,
                    "relationship_count": rel_count,
                    "relationship_types": rel_types
                }

                return json.dumps(summary, default=str)
        except Exception as e:
            logger.error(f"Failed to get graph summary: {e}")
            return f"Error: Failed to get graph summary: {e}"

    def get_all_node_ids(self) -> str:
        """
        Retrieve all thought node IDs from the graph.

        Returns:
            str: JSON string with all thought IDs or error message
        """
        try:
            self._ensure_initialized()

            logger.info("Retrieving all thought node IDs")

            with self.driver.session() as session:
                result = session.run("""
                    MATCH (t:Thought)
                    RETURN t.id as id
                    ORDER BY t.timestamp DESC
                """)

                node_ids = [record["id"] for record in result]

                return json.dumps({"node_ids": node_ids})
        except Exception as e:
            logger.error(f"Failed to retrieve thought node IDs: {e}")
            return f"Error: Failed to retrieve thought node IDs: {e}"
