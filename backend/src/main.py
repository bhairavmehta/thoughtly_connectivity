import os
import logging
import uuid
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import sys
import uvicorn
from contextlib import closing
from typing import Dict, List
import datetime
from transcription_service import TranscriptionService
from Main_agent import ThoughtAgentManager
from agents.tools.lightrag_tool import LightRAGToolConfig, LightRAGTool
from agents.Light_agent import LightRAGAgentTool
from custom_history import CustomHistoryManager
from agents.utils.responses import ModelConfig
from agents.title_agent import create_title_agent
load_dotenv()
logging.basicConfig(level=os.getenv("LOG_LEVEL", "WARNING").upper())
logger = logging.getLogger(__name__)

# TODO1: Making the api more robust and adding more error handling and logging Also more features.
app = FastAPI(title="Thoughtly API", version="0.1.0")

# noinspection PyTypeChecker
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

initialized_lightrag_tools: Dict[str, LightRAGAgentTool] = {}
history_manager = CustomHistoryManager(db_file="db/custom_history.db")
try:
    transcription_service = TranscriptionService()
except ValueError as e:
     print(f"CRITICAL: Transcription Service initialization failed: {e}", file=sys.stderr)
     sys.exit(1)


async def get_history_manager():
    return history_manager

class ChatHistoryItem(BaseModel):
    session_id: str
    thread_title: str
    last_message: str
    timestamp: datetime.datetime

class InitializeResponse(BaseModel):
    message: str
    user_id: str
    chat_history: List[ChatHistoryItem]

class TitleRequest(BaseModel):
    user_id: str
    session_id: str
    query: str

class TitleResponse(BaseModel):
    title: str
    user_id: str
    session_id: str

class InitializeRequest(BaseModel):
    user_id: str
    user_memory: bool = True
    session_memory: bool = True

class AgentInvokeRequest(BaseModel):
    query: str
    user_id: str = "default_user"
    session_id: str = "default_session"
    user_memory: bool = True
    session_memory: bool = True

class AgentInvokeResponse(BaseModel):
    response: str
    user_id: str
    session_id: str

class HistoryTurn(BaseModel):
    role: str
    content: str
    timestamp: datetime.datetime

class HistoryResponse(BaseModel):
    history: List[HistoryTurn]
    user_id: str
    session_id: str

class TranscriptionResponse(BaseModel):
    transcription: str
    user_id: str
    session_id: str

class AttachmentResponse(BaseModel):
    message: str
    filename: str
    user_id: str
    session_id: str

class SessionInitRequest(BaseModel):
    user_id: str

class SessionInitResponse(BaseModel):
    session_id: str
    user_id: str
    message: str

def get_user_attachment_dir(user_id: str) -> str:
     user_data_base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "user_data"))
     user_attach_dir = os.path.join(user_data_base_dir, user_id, "attachments")
     os.makedirs(user_attach_dir, exist_ok=True)
     return user_attach_dir

def get_user_chat_history(user_id: str) -> List[ChatHistoryItem]:
    sql = """
    SELECT session_id, thread_title, content, timestamp
    FROM conversation_history
    WHERE user_id = ? AND role = 'user'
    GROUP BY session_id
    ORDER BY timestamp DESC;
    """
    history_items = []
    with closing(history_manager._get_connection()) as conn:
        with closing(conn.cursor()) as cursor:
            cursor.execute(sql, (user_id,))
            rows = cursor.fetchall()
            for row in rows:
                history_items.append(ChatHistoryItem(
                    session_id=row['session_id'],
                    thread_title=row['thread_title'] or "Untitled Conversation",
                    last_message=row['content'],
                    timestamp=row['timestamp']
                ))

    return history_items


"""@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request from {request.client.host}: {request.method} {request.url}")
    logger.info(f"Headers: {request.headers}")
    return await call_next(request)"""

@app.post("/generate_title/", response_model=TitleResponse)
async def generate_title(
        request: TitleRequest,
        hist_manager: CustomHistoryManager = Depends(get_history_manager)
):
    try:
        title_agent = create_title_agent()
        title_response = await title_agent.arun(request.query)
        title = title_response.content if hasattr(title_response, 'content') else title_response
        title = title.strip()

        success = hist_manager.update_thread_title(request.user_id, request.session_id, title)
        if not success:
            logger.warning(
                f"Failed to update title in database for user={request.user_id}, session={request.session_id}")

        return TitleResponse(title=title, user_id=request.user_id, session_id=request.session_id)
    except Exception as e:
        logger.exception(f"Error generating title for user={request.user_id}")
        raise HTTPException(status_code=500, detail=f"Failed to generate title: {e}")

@app.post("/initialize/", response_model=InitializeResponse, status_code=200)
async def initialize_lightrag_tool_endpoint(request: InitializeRequest):
    if request.user_id in initialized_lightrag_tools:
        chat_history = get_user_chat_history(request.user_id)
        return InitializeResponse(
            message="LightRAG tool already initialized.",
            user_id=request.user_id,
            chat_history=chat_history
        )
    try:
        user_data_base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "user_data"))
        user_specific_rag_dir = os.path.join(user_data_base_dir, request.user_id)
        os.makedirs(user_specific_rag_dir, exist_ok=True)
        lightrag_config = LightRAGToolConfig(working_dir=user_specific_rag_dir)
        lightrag_tool = LightRAGTool(config=lightrag_config)
        await lightrag_tool.initialize()
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if not openai_api_key: raise ValueError("OPENAI_API_KEY needed.")
        model_config = ModelConfig(
            api_key=openai_api_key,
            model_id=os.getenv("OPENAI_MODEL_ID", "gpt-4o-mini"),
        )
        lightrag_tool_instance = LightRAGAgentTool(
            model_config=model_config, user_id=request.user_id,
            session_memory=request.session_memory, user_memory=request.user_memory,
            tool=lightrag_tool
        )
        initialized_lightrag_tools[request.user_id] = lightrag_tool_instance
        chat_history = get_user_chat_history(request.user_id)
        return InitializeResponse(
            message="LightRAG tool initialized successfully.",
            user_id=request.user_id,
            chat_history=chat_history
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Config error: {e}")
    except Exception as e:
        logger.exception(f"Init failed for user {request.user_id}") # Minimal logging on exception
        raise HTTPException(status_code=500, detail="Init failed.")

@app.get("/threads/{user_id}", response_model=List[ChatHistoryItem])
async def get_threads(
    user_id: str,
    limit: int = 20
):
    try:
        threads = get_user_chat_history(user_id)
        if limit and limit > 0:
            threads = threads[:limit]

        return threads
    except Exception as e:
        logger.exception(f"Error retrieving threads for user={user_id}")
    raise HTTPException(status_code=500, detail=f"Failed to retrieve threads: {e}")


@app.get("/history/{user_id}/{session_id}", response_model=HistoryResponse)
async def get_conversation_history(
    user_id: str,
    session_id: str,
    limit: int = 20,
    hist_manager: CustomHistoryManager = Depends(get_history_manager)
):
    try:
        sql = """
        SELECT role, content, timestamp
        FROM conversation_history
        WHERE user_id = ? AND session_id = ?
        ORDER BY timestamp ASC
        LIMIT ?;
        """
        history_data: List[HistoryTurn] = []
        with closing(hist_manager._get_connection()) as conn:
            with closing(conn.cursor()) as cursor:
                cursor.execute(sql, (user_id, session_id, limit))
                rows = cursor.fetchall()
                for row in rows:
                    history_data.append(HistoryTurn(role=row['role'], content=row['content'], timestamp=row['timestamp']))
        return HistoryResponse(history=history_data, user_id=user_id, session_id=session_id)
    except Exception as e:
        logger.exception(f"Error getting history user={user_id} sess={session_id}")
        raise HTTPException(status_code=500, detail="Failed to retrieve history.")

@app.post("/add_attachment/", response_model=AttachmentResponse)
async def add_attachment(
    user_id: str = Form(...),
    session_id: str = Form(...),
    file: UploadFile = File(...)
):
    user_attach_dir = get_user_attachment_dir(user_id)
    file_location = os.path.join(user_attach_dir, file.filename)
    try:
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
        processing_message = "File saved. Further processing may occur asynchronously."
        return AttachmentResponse(message=processing_message, filename=file.filename, user_id=user_id, session_id=session_id)
    except Exception as e:
        logger.exception(f"Failed save attachment user={user_id} file={file.filename}")
        raise HTTPException(status_code=500, detail=f"Could not save file: {e}")
    finally:
        await file.close()

@app.post("/transcribe/", response_model=TranscriptionResponse)
async def transcribe_audio_endpoint(
    user_id: str = Form(...),
    session_id: str = Form(...),
    file: UploadFile = File(...)
):
    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only audio files are accepted.")
    try:
        audio_bytes = await file.read()
        file_extension = file.filename.split('.')[-1].lower() if '.' in file.filename else 'wav'
        transcription_text = await transcription_service.transcribe_audio(audio_bytes, file_extension)
        return TranscriptionResponse(transcription=transcription_text, user_id=user_id, session_id=session_id)
    except ConnectionError as e:
         logger.exception(f"Transcription service error user={user_id}")
         raise HTTPException(status_code=503, detail=f"Transcription service unavailable or failed: {e}")
    except Exception as e:
        logger.exception(f"Error during transcription user={user_id}")
        raise HTTPException(status_code=500, detail=f"Could not transcribe audio: {e}")
    finally:
        await file.close()


@app.post("/agent/invoke/", response_model=AgentInvokeResponse)
async def invoke_agent(
        request: AgentInvokeRequest,
        hist_manager: CustomHistoryManager = Depends(get_history_manager)
):
    lightrag_tool = initialized_lightrag_tools.get(request.user_id)
    if lightrag_tool is None:
        raise HTTPException(status_code=400, detail=f"Tool not initialized. Call /initialize/ first.")
    try:
        conversation_history = hist_manager.get_history(request.user_id, request.session_id)
        prompt_with_history = request.query
        if conversation_history:
            prompt_with_history = (
                f"--- Conversation History (Oldest to Newest) ---"
                f"\n{conversation_history}\n--- Current Query ---\n"
                f"{request.query}"
            )

        agent_manager = ThoughtAgentManager(
            user_id=request.user_id,
            session_id=request.session_id,
            lightrag_tool=lightrag_tool if lightrag_tool else None,
            user_memory=request.user_memory,
            session_memory=request.session_memory
        )

        agent_response_content = await agent_manager.ask(prompt_with_history)

        hist_manager.add_turn(request.user_id, request.session_id,
                              "user", request.query)
        hist_manager.add_turn(request.user_id, request.session_id,
                              "assistant", agent_response_content)
        return AgentInvokeResponse(response=agent_response_content,
                                   user_id=request.user_id,
                                   session_id=request.session_id)
    except Exception as e:
        logger.exception(f"Error invoking agent user={request.user_id}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")

@app.post("/initialize_session/", response_model=SessionInitResponse)
async def initialize_session(request: SessionInitRequest):
    session_id = str(uuid.uuid4())
    return SessionInitResponse(
        session_id=session_id,
        user_id=request.user_id,
        message="Session initialized successfully"
    )

if __name__ == "__main__":
    uvicorn.run( "main:app", host="127.0.0.1", port=8000, reload=True )