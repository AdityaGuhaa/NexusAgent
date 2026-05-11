import os
from dotenv import load_dotenv

load_dotenv()

LLAMA_SERVER_URL = os.getenv("LLAMA_SERVER_URL", "http://localhost:8080")
MODEL_NAME = os.getenv("MODEL_NAME", "gemma-4-e4b")

SERPER_API_KEY = os.getenv("SERPER_API_KEY", "")

MAX_TOOL_ITERATIONS = int(os.getenv("MAX_TOOL_ITERATIONS", "4"))
CTX_SIZE = int(os.getenv("CTX_SIZE", "2700"))

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))