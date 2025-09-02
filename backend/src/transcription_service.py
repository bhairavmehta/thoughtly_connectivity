import os
import logging
from groq import Groq
from dotenv import load_dotenv
from tempfile import NamedTemporaryFile
from contextlib import closing

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TranscriptionService:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        if not self.api_key:
            logger.error("GROQ_API_KEY environment variable not set.")
            raise ValueError("GROQ_API_KEY is required for TranscriptionService.")
        try:
            self.client = Groq(api_key=self.api_key)
            logger.info("Groq client initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize Groq client: {e}", exc_info=True)
            raise

    async def transcribe_audio(self, audio_file_bytes: bytes, file_extension: str) -> str:
        if not self.client:
             raise ConnectionError("Groq client not initialized.")
        try:
            with NamedTemporaryFile(delete=False, suffix=f".{file_extension}") as temp_audio_file:
                temp_audio_file.write(audio_file_bytes)
                temp_file_path = temp_audio_file.name
            logger.info(f"Audio bytes written to temporary file: {temp_file_path}")

            with open(temp_file_path, "rb") as file_for_groq:
                 transcription = self.client.audio.transcriptions.create(
                     file=(os.path.basename(temp_file_path), file_for_groq.read()),
                     model="whisper-large-v3",
                 )
            logger.info("Transcription successful via Groq.")
            return transcription.text

        except Exception as e:
            logger.error(f"Groq transcription failed: {e}", exc_info=True)
            raise ConnectionError(f"Transcription failed: {e}")
        finally:
            if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                    logger.info(f"Temporary audio file removed: {temp_file_path}")
                except OSError as e:
                    logger.error(f"Error removing temporary file {temp_file_path}: {e}")

