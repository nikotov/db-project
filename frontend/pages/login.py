import streamlit as st
from api.client import login

st.set_page_config(page_title="Login", page_icon="🔐")

st.title("Login")

# Initialize session state
if "user" not in st.session_state:
    st.session_state["user"] = None

# If already logged in
if st.session_state["user"]:
    st.success(f"Logged in as {st.session_state['user']['username']}")
    st.stop()

# Login form
with st.form("login_form"):
    username = st.text_input("Username")
    password = st.text_input("Password", type="password")

    submitted = st.form_submit_button("Login")

    if submitted:
        if not username or not password:
            st.warning("Please fill in all fields")
        else:
            result = login(username, password)

            if result and result.get("access_token"):
                st.session_state["user"] = {"username": username, **result}
                st.success("Login successful!")
                st.rerun()
            else:
                st.error("Invalid username or password")