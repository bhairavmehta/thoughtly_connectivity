# 🧠 Thoughtly  
*An AI-powered knowledge management and thought capture system*  

## 🚀 Overview  
**Thoughtly** is an advanced AI-powered knowledge management and thought capture system that leverages multiple AI agents and cutting-edge technologies to help users **organize, connect, and refine their ideas intelligently**.  
It combines **retrieval-augmented generation (LightRAG)**, **multi-agent orchestration**, and **graph-based reasoning** into a modular platform for personal, professional, and research applications.

---

## ✨ Key Features  

### Core Capabilities
- **Intelligent Thought Capture** – Store and organize thoughts, ideas, and notes with AI assistance  
- **Dynamic Knowledge Graphs** – Automatic creation and management of interconnected knowledge structures  
- **Multi-Modal Input** – Text, audio transcription, and file attachments  
- **Real-Time Web Integration** – Fetch live information to enrich stored knowledge  
- **Conversational Interface** – Natural language interaction with your knowledge base  
- **Session Management** – Organize conversations into threads with automatic title generation  

### Advanced AI Features
- **Multi-Agent Architecture** – Specialized agents for search, knowledge management, and graph ops  
- **LightRAG Integration** – State-of-the-art retrieval with knowledge graphs  
- **Contextual Retrieval** – Naive, local, global, hybrid, and KG+Vector modes  
- **Entity & Relationship Extraction** – Auto-detect and link concepts  
- **Memory Systems** – User and session-based personalized memory  

---

## 🏗️ System Architecture  

### Backend Components
- **Main Agent** – Orchestrates specialized agents, manages sessions, integrates LightRAG  
- **LightRAG Agent** – Manages persistent knowledge base, retrieval, and entity operations  
- **Web Search Agent** – Real-time multi-source search (Google, EXA, DuckDuckGo)  
- **Graph Agent** – Neo4j-based thought graph management and queries  
- **Retrieval Agent** – Pinecone-powered semantic similarity search  
- **Title Agent** – Automatic, descriptive thread titles  

### Storage Systems
- **LightRAG KB** – Graph-structured knowledge storage  
- **Neo4j** – Relationship graph database  
- **Pinecone** – Vector similarity search  
- **SQLite** – Conversation history & metadata  

### API Layer
- **FastAPI REST API** – Full-featured endpoints  
- Authentication & user management  
- File upload & audio transcription  
- Thread and conversation handling  

### Frontend Components
- **React + TypeScript** modern UI  
- **Supabase authentication**  
- Real-time **chat interface**  
- **Thread management & file upload**  

---

## 🧠 LightRAG Integration  

LightRAG (Light Retrieval-Augmented Generation) improves on standard RAG by combining **knowledge graphs with embeddings**.  

### Key Advantages
1. **Graph-Enhanced Retrieval** – Entity & relationship aware search  
2. **Dual-Level Retrieval** – Precise entity-level and broad topic retrieval  
3. **Cost-Effective** – Fewer API calls vs GraphRAG  
4. **Incremental Updates** – No need for full index rebuilds  
5. **Superior Performance** – Outperforms on comprehensiveness, diversity, empowerment  

### Retrieval Modes
- **Naive Retrieval** – Vector search  
- **Local KG Retrieval** – Context around entities  
- **Global KG Retrieval** – Graph-wide search  
- **Hybrid Retrieval** – Vector + keyword  
- **Mix KG+Vector** – Graph traversal + vector similarity  

---

## 🛠️ Installation & Setup  

### Prerequisites
- Python **3.9+** (backend)  
- Node.js **16+** (frontend)  
- OpenAI API key (required)  
- Optional: **Neo4j**, **Pinecone**, **Groq** API keys  

### Backend Setup
```bash
git clone https://github.com/your-username/thoughtly.git
cd thoughtly/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate   # (Linux/macOS)
venv\Scripts\activate      # (Windows)

# Install dependencies
pip install -r requirements.txt

# Run FastAPI server
uvicorn app.main:app --reload
Frontend Setup
bash
Copy code
cd thoughtly/frontend

# Install dependencies
npm install

# Run development server
npm run dev
Environment Variables
Create .env files in both backend and frontend with required API keys and DB configs:

ini
Copy code
OPENAI_API_KEY=your_openai_key
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=yourpassword
PINECONE_API_KEY=your_pinecone_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
📋 API Endpoints
Core
/agent – Conversational AI interaction

/title – Generate conversation titles

/upload – File/document upload

/transcribe – Audio transcription

Threads & History
/threads – Retrieve conversation threads

/history/{session_id} – Get session history

/session – Create new session

Authentication
/auth/register – Register user

/auth/login – Login

/auth/profile – Manage profile

🎯 Use Cases
Personal Knowledge
Research organization & synthesis

Idea development & brainstorming

Learning enhancement via knowledge maps

Professional Applications
Team collaboration & shared knowledge base

Project management with dependencies

Document intelligence & decision support

Creative & Academic Work
Writing support & narrative mapping

Research synthesis across sources

Content development with citations

📌 Project Samples
(Screenshots, demos, or usage GIFs can go here)
