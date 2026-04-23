import streamlit as st

st.set_page_config(page_title="My App")

st.title("Welcome")

if "user" in st.session_state and st.session_state["user"]:
    st.success(f"Logged in as {st.session_state['user']['username']}")
    st.page_link("pages/login.py", label="Go to Login (logout first)")
else:
    st.warning("You are not logged in")
    st.page_link("pages/login.py", label="Login")