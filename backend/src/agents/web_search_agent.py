import os
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools.googlesearch import GoogleSearchTools
from agno.tools.exa import ExaTools
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.tools.crawl4ai import Crawl4aiTools
from dotenv import load_dotenv
from agno.tools.toolkit import Toolkit
from textwrap import dedent
load_dotenv()

def create_search_agent(model_id:str="gpt-4o"):
    """
    Search Agent:
      - Uses multiple search tools (Google, EXA, DuckDuckGo, Crawl4AI)
      - Collects and aggregates results from each source
      - Synthesizes a comprehensive answer based on the gathered information
    """

    description = dedent("""
        You are an advanced Aggregated Search Agent designed to synthesize information from multiple search sources.
        You will be working as a tool under another agent and have to do what is asked to do like saving or getting data using the tools you have
        Your role is to retrieve, aggregate, and refine data from various tools (Google Search, EXA, DuckDuckGo, and Crawl4AI)
        to provide a comprehensive, clear, and actionable response to the user's query.
        You collaborate with external sources and verify the accuracy and relevance of the gathered information.
    """).strip()

    instructions = dedent(f"""
        You are an Aggregated Search Agent responsible for gathering and synthesizing information from multiple search sources.
        For every user query, follow these steps:
        You will be getting some idea/ thought or a question and you have to do the following 
        1. Retrieve Data:
           - Use Google Search, EXA, DuckDuckGo, and Crawl4AI tools to collect relevant information, ideas, and supporting details.
           
        2. Aggregate and Synthesize:
           - Combine the outputs from all sources into a cohesive, well-structured answer.
           - Cross-reference the information for accuracy and relevance.
           - If one tool returns limited data, supplement it with data from the other tools.

        3. Clarification and Citations:
           - If the query is ambiguous or spans multiple topics,
           - Include appropriate citations and references for the external sources used.

        Overall, your goal is to deliver a comprehensive, context-aware response that provides actionable insights based on the synthesized data.
    """).strip()
    search_agent = Agent(
        name="Search Agent",
        role="Search Aggregator",
        model=OpenAIChat(id=model_id,api_key=os.getenv("OPENAI_API_KEY")),
        tools=[
            GoogleSearchTools(),
            ExaTools(api_key=os.getenv("EXA_API_KEY")),
            DuckDuckGoTools(),
            #Crawl4aiTools()
        ],
        description=description,
        instructions=instructions,
        markdown=True,
        show_tool_calls=True,
        add_datetime_to_instructions=True,
    )

    return search_agent


class WebSearchAgentTool(Toolkit):
    def __init__(self):
        super().__init__(name="web_search_agent_tool")
        self.agent = create_search_agent()
        self.register(self.search_web)
        self.register(self.a_search_web)


    def search_web(self, query: str) -> str:
        """
        Search the web for information related to the user's query.
        """
        response = self.agent.run(query)
        return response.content

    async def a_search_web(self, query: str) -> str:
        """
        Search the web for information related to the user's query with async.
        """
        response = await self.agent.arun(query)
        return response.content
