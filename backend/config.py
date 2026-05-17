# Copyright 2026 Aditya Guha
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

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