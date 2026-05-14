import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from api.routes import router
from config import HOST, PORT

app = FastAPI(
    title="NexusAgent",
    description="Local-first agentic AI with real-time web search",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(router, prefix="/api")

app.mount("/static", StaticFiles(directory="../frontend"), name="static")


@app.get("/")
async def serve_frontend():
    return FileResponse("../frontend/index.html")


@app.get("/health")
async def health():
    return {"status": "ok", "model": "NexusAgent"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        reload=True
    )