import streamlit as st
import requests
import uuid

st.set_page_config(page_title="Thought Agent Test", layout="wide")

st.title("🤖 Thought Agent Test Interface")

FASTAPI_URL = st.text_input("FastAPI Backend URL", "http://127.0.0.1:8000/agent/invoke/")

if "session_id" not in st.session_state:
    st.session_state.session_id = str(uuid.uuid4())
if "user_id" not in st.session_state:
    st.session_state.user_id = "streamlit_user_" + str(uuid.uuid4())[:8]
if "messages" not in st.session_state:
    st.session_state.messages = []
if "user_memory" not in st.session_state:
    st.session_state.user_memory = True
if "session_memory" not in st.session_state:
    st.session_state.session_memory = True


with st.sidebar:
    st.header("Configuration")
    st.session_state.user_id = st.text_input("User ID", st.session_state.user_id)
    st.session_state.session_id = st.text_input("Session ID", st.session_state.session_id)

    st.session_state.user_memory = st.toggle("Enable User Memory", value=st.session_state.user_memory)
    st.session_state.session_memory = st.toggle("Enable Session Memory", value=st.session_state.session_memory)


    if st.button("Clear Chat History"):
        st.session_state.messages = []
        st.rerun()

    if st.button("New Session"):
        st.session_state.session_id = str(uuid.uuid4())
        st.session_state.messages = []
        st.rerun()

    st.markdown("---")
    st.caption(f"User ID: {st.session_state.user_id}")
    st.caption(f"Session ID: {st.session_state.session_id}")
    st.caption(f"User Memory: {'Enabled' if st.session_state.user_memory else 'Disabled'}")
    st.caption(f"Session Memory: {'Enabled' if st.session_state.session_memory else 'Disabled'}")


for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

if prompt := st.chat_input("What are you thinking about?"):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        message_placeholder = st.empty()
        full_response = ""
        try:
            payload = {
                "query": prompt,
                "user_id": st.session_state.user_id,
                "session_id": st.session_state.session_id,
                "user_memory": st.session_state.user_memory,
                "session_memory": st.session_state.session_memory,
            }
            response = requests.post(FASTAPI_URL, json=payload, timeout=240)
            response.raise_for_status()

            api_response_data = response.json()
            full_response = api_response_data.get("response", "No response text found.")

        except requests.exceptions.Timeout:
             full_response = "Error: The request to the backend timed out."
             st.error(full_response)
        except requests.exceptions.RequestException as e:
            full_response = f"Error connecting to backend: {e}"
            st.error(full_response)
        except Exception as e:
             full_response = f"An unexpected error occurred: {e}"
             st.error(full_response)

        message_placeholder.markdown(full_response)

    if full_response and not full_response.startswith("Error"):
        st.session_state.messages.append({"role": "assistant", "content": full_response})