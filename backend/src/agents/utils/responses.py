from dataclasses import dataclass

@dataclass
class PineconeAuthConfig:
    api_key: str
    index_name: str = "retrieval-agent-index"
    dimensions: int = 1536
    metric: str = "cosine"
    cloud: str = "aws"
    region: str = "us-east-1"

@dataclass
class ModelConfig:
    api_key: str
    model_id : str = "gpt-4o"
    provider : str = "openai"
    temperature : int = 0.2
    base_url : str = None