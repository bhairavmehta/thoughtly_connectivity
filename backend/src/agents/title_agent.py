import os
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from dotenv import load_dotenv
from textwrap import dedent

load_dotenv()
def create_title_agent():
    description = dedent("""
        You are a Title Agent specialized in generating concise, meaningful titles for conversation threads.
        Your job is to analyze the conversation history and create a clear, informative title.
    """).strip()

    instructions = dedent("""
        Analyze the provided conversation and generate a concise title (2-6 words) that captures the main topic.

        Guidelines:
        - Focus on the main subject of discussion
        - Keep it clear and specific
        - Use title case
        - Avoid generic titles like "General Discussion"
        - Don't include words like "conversation", "discussion", or "thread"

        Respond with ONLY the title, nothing else.
    """).strip()

    return Agent(
        name="Title Agent",
        role="Title Generator",
        model=OpenAIChat(
            id=os.getenv("OPENAI_MODEL_ID", "gpt-4o-mini"),
            api_key=os.getenv("OPENAI_API_KEY")
        ),
        description=description,
        instructions=instructions,
        markdown=False,
        show_tool_calls=False,
    )