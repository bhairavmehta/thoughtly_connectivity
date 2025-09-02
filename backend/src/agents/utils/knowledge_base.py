from agno.knowledge.docx import DocxKnowledgeBase
from agno.vectordb.pineconedb import PineconeDb
from responses import PineconeAuthConfig

def build_docx_knowledge_base(
    file_path: str,
    pinecone_config : PineconeAuthConfig,
    recreate: bool = False
):
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
    )
    knowledge_base = DocxKnowledgeBase(
        vector_db=vector_db,
        path=file_path,
    )
    knowledge_base.load(recreate=recreate, upsert=True)

    return knowledge_base