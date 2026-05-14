# ⬡ NexusAgent

> A local-first agentic AI assistant with real-time web search, tool calling, and a clean Perplexity-style UI — powered by llama.cpp and your own hardware.

![NexusAgent UI](docs/demo.png)

---

## What is NexusAgent?

NexusAgent is a fully local AI assistant that can search the web, reason over results, and give you accurate, cited, up-to-date answers — all running on your own machine with no cloud inference dependency.

Most local LLM setups give you a chatbot that answers from training data alone. NexusAgent goes further — it implements a **ReAct agentic loop** where the model can decide to search the web, read the results, reason over them, and search again if needed before giving a final answer. Every source is cited inline.

---

## Features

- **Local-first inference** — runs entirely on your hardware via llama.cpp. No OpenAI, no Anthropic, no cloud inference.
- **Real-time web search** — integrates Serper.dev (Google-quality results) with DuckDuckGo as a free fallback.
- **Agentic ReAct loop** — the model can perform multiple search iterations per query, refining its understanding before answering.
- **Tool calling** — built on the OpenAI-compatible tool calling API exposed by llama.cpp server.
- **Streaming responses** — answers stream to the UI in real time via Server-Sent Events (SSE).
- **Source citations** — all web sources cited inline as clickable chips in the UI.
- **Concurrency support** — llama.cpp parallel slots + continuous batching handle multiple simultaneous users.
- **Clean UI** — dark-theme, Perplexity-inspired interface built in vanilla HTML/CSS/JS. No React, no build step.
- **Configurable** — swap models, search backends, and inference settings via a single `.env` file.

---

## Architecture

```
User Query
    │
    ▼
FastAPI Backend (Python)
    │
    ▼
Agentic ReAct Loop
    │
    ├─── LLM decides to search?
    │         │
    │         ▼
    │    Tool Executor
    │         │
    │    Serper.dev API ──► Google Search Results
    │    (DuckDuckGo fallback if no API key)
    │         │
    │         ▼
    │    Results injected into context
    │         │
    │    LLM reasons over results
    │         │
    │    Search again? ──► repeat (max 4 iterations)
    │
    └─── LLM generates final answer
              │
              ▼
         SSE Stream
              │
              ▼
     Vanilla JS Frontend
```

**Stack:**

| Layer | Technology |
|---|---|
| Inference backend | llama.cpp HTTP server |
| LLM | Gemma 4 E2B Q4_K_M (or any GGUF model) |
| API framework | FastAPI + Uvicorn |
| Streaming | Server-Sent Events (SSE) |
| Search | Serper.dev + DuckDuckGo fallback |
| Frontend | Vanilla HTML, CSS, JavaScript |

---

## Project Structure

```
NexusAgent/
├── backend/
│   ├── main.py                  # FastAPI entry point
│   ├── config.py                # Environment variables and settings
│   ├── agent/
│   │   ├── loop.py              # Core ReAct agentic loop
│   │   ├── prompts.py           # System prompt with live datetime injection
│   │   └── parser.py            # Tool call output parser with malformed JSON fallback
│   ├── tools/
│   │   ├── registry.py          # Tool registry — maps name to function
│   │   ├── web_search.py        # Serper.dev + DuckDuckGo search execution
│   │   └── definitions.py       # OpenAI-compatible tool schema definitions
│   ├── api/
│   │   └── routes.py            # /api/chat SSE streaming endpoint
│   └── requirements.txt
│
├── frontend/
│   ├── index.html               # HTML shell
│   ├── css/style.css            # Full dark theme styling
│   └── js/
│       ├── app.js               # Entry point, conversation history, event wiring
│       ├── api.js               # Fetch calls to backend
│       ├── stream.js            # SSE stream reader and event handler
│       └── ui.js                # DOM manipulation, markdown rendering, source chips
│
├── .env                         # Local config (gitignored)
└── README.md
```

---

## Getting Started

### Prerequisites

- A machine with a GPU (NVIDIA recommended, 6GB+ VRAM)
- [llama.cpp](https://github.com/ggerganov/llama.cpp) built with CUDA support
- Python 3.11+
- [Miniconda](https://docs.conda.io/en/latest/miniconda.html) or any Python env manager
- A GGUF model file — tested with Gemma 4 E2B Q4_K_M
- A free [Serper.dev](https://serper.dev) API key (optional — DuckDuckGo works without one)

### 1. Clone the repo

```
git clone https://github.com/AdityaGuhaa/NexusAgent.git
cd NexusAgent
```

### 2. Set up Python environment

```
conda create -n NexusAgent python=3.11 -y
conda activate NexusAgent
pip install -r backend/requirements.txt
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and edit:

```
LLAMA_SERVER_URL=http://localhost:8080
MODEL_NAME=gemma4-e2b-q4_k_m
SERPER_API_KEY=your_serper_api_key_here
MAX_TOOL_ITERATIONS=4
CTX_SIZE=2700
HOST=0.0.0.0
PORT=8000
```

### 4. Start llama.cpp server

```
llama-server \
  --model /path/to/your/model.gguf \
  --n-gpu-layers 43 \
  --ctx-size 8192 \
  --parallel 3 \
  --cont-batching \
  --host 0.0.0.0 \
  --port 8080
```

### 5. Start NexusAgent

```
cd backend
python main.py
```

### 6. Open in browser

```
http://localhost:8000
```

---

## Configuration

| Variable | Default | Description |
|---|---|---|
| `LLAMA_SERVER_URL` | `http://localhost:8080` | URL of your running llama.cpp server |
| `MODEL_NAME` | `gemma4-e2b-q4_k_m` | Model identifier passed to llama.cpp |
| `SERPER_API_KEY` | `""` | Serper.dev API key. Falls back to DuckDuckGo if empty |
| `MAX_TOOL_ITERATIONS` | `4` | Max agentic loop iterations per query |
| `CTX_SIZE` | `2700` | Token budget per inference slot |
| `HOST` | `0.0.0.0` | FastAPI host |
| `PORT` | `8000` | FastAPI port |

---

## Hardware Recommendations

Tested on Lenovo LOQ with RTX 4050 6GB VRAM running Ubuntu 24.

| VRAM | Recommended Model | Parallel Slots |
|---|---|---|
| 4GB | Gemma 4 E2B Q4_K_M | 2 |
| 6GB | Gemma 4 E2B Q4_K_M | 3 |
| 8GB | Qwen2.5 7B Q4_K_M | 3 |
| 12GB+ | Qwen2.5 14B Q4_K_M | 4 |

---

## Roadmap

- [ ] Streaming token-by-token (true streaming, not buffered)
- [ ] Tool call indicator animations in UI
- [ ] Additional tools — calculator, weather, file reader
- [ ] Chat history persistence
- [ ] Docker support for one-command setup
- [ ] Support for vision models (image input)

---

## Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you would like to change.

---

## License

MIT

---

## Built by

**Aditya Guha**
[GitHub](https://github.com/AdityaGuhaa) · [LinkedIn](https://linkedin.com/in/adityaguha1) · [Linktree](https://linktr.ee/adityaguha)