import os

import requests

BASE_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

def login(username: str, password: str):
    response = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={
            "username": username,
            "password": password
        }
    )

    if response.status_code != 200:
        return None

    return response.json()