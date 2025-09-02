import sqlite3
import datetime
import os
import logging
from contextlib import closing

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CustomHistoryManager:
    def __init__(self, db_file="db/custom_history.db"):
        self._db_file = os.path.abspath(db_file)
        os.makedirs(os.path.dirname(self._db_file), exist_ok=True)
        self._create_table()
        logger.info(f"CustomHistoryManager initialized with db: {self._db_file}")

    def _get_connection(self):
        try:
            conn = sqlite3.connect(self._db_file, detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES)
            conn.row_factory = sqlite3.Row
            return conn
        except sqlite3.Error as e:
            logger.error(f"Database connection error: {e}", exc_info=True)
            raise

    def _create_table(self):
        sql = """
            CREATE TABLE IF NOT EXISTS conversation_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
                content TEXT NOT NULL,
                timestamp DATETIME NOT NULL,
                thread_title TEXT
            );
            """
        index_sql1 = "CREATE INDEX IF NOT EXISTS idx_user_session ON conversation_history (user_id, session_id);"
        index_sql2 = "CREATE INDEX IF NOT EXISTS idx_timestamp ON conversation_history (timestamp);"

        try:
            with closing(self._get_connection()) as conn:
                with closing(conn.cursor()) as cursor:
                    cursor.execute(sql)
                    cursor.execute(index_sql1)
                    cursor.execute(index_sql2)
                conn.commit()
            logger.info("Table 'conversation_history' checked/created successfully.")
        except sqlite3.Error as e:
            logger.error(f"Database error during table creation: {e}", exc_info=True)
            raise

    def add_turn(self, user_id: str, session_id: str, role: str, content: str):
        if role not in ['user', 'assistant']:
            logger.error(f"Invalid role specified: {role}")
            return

        sql = """
        INSERT INTO conversation_history (user_id, session_id, role, content, timestamp)
        VALUES (?, ?, ?, ?, ?);
        """
        timestamp = datetime.datetime.now()
        try:
            with closing(self._get_connection()) as conn:
                with closing(conn.cursor()) as cursor:
                    cursor.execute(sql, (user_id, session_id, role, content, timestamp))
                conn.commit()
            logger.info(f"Added turn: User={user_id}, Session={session_id}, Role={role}")
        except sqlite3.Error as e:
            logger.error(f"Database error during insert: {e}", exc_info=True)

    def update_thread_title(self, user_id: str, session_id: str, title: str):
        """Update the thread title for all messages in a given session."""
        sql = """
        UPDATE conversation_history
        SET thread_title = ?
        WHERE user_id = ? AND session_id = ?;
        """
        try:
            with closing(self._get_connection()) as conn:
                with closing(conn.cursor()) as cursor:
                    cursor.execute(sql, (title, user_id, session_id))
                conn.commit()
            logger.info(f"Updated title for User={user_id}, Session={session_id}, Title='{title}'")
            return True
        except sqlite3.Error as e:
            logger.error(f"Database error during title update: {e}", exc_info=True)
            return False

    def get_history(self, user_id: str, session_id: str, limit: int = 10) -> str:
        sql = """
        SELECT role, content
        FROM conversation_history
        WHERE user_id = ? AND session_id = ?
        ORDER BY timestamp DESC
        LIMIT ?;
        """
        history_turns = []
        try:
            with closing(self._get_connection()) as conn:
                with closing(conn.cursor()) as cursor:
                    cursor.execute(sql, (user_id, session_id, limit))
                    rows = cursor.fetchall()
                    for row in reversed(rows):
                        history_turns.append(f"{row['role']}: {row['content']}")
            logger.info(f"Retrieved {len(history_turns)} history turns for User={user_id}, Session={session_id}")
            return "\n".join(history_turns)
        except sqlite3.Error as e:
            logger.error(f"Database error during select: {e}", exc_info=True)
            return ""

    def clear_history(self, user_id: str, session_id: str):
         sql = "DELETE FROM conversation_history WHERE user_id = ? AND session_id = ?;"
         try:
             with closing(self._get_connection()) as conn:
                 with closing(conn.cursor()) as cursor:
                     cursor.execute(sql, (user_id, session_id))
                 conn.commit()
             logger.info(f"Cleared history for User={user_id}, Session={session_id}")
         except sqlite3.Error as e:
             logger.error(f"Database error during delete: {e}", exc_info=True)