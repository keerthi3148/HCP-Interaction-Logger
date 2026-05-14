import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import ChatRequest, ChatResponse, FormState
from agent import run_agent

app = FastAPI(title="HCP Interaction Logger API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    try:
        result = run_agent(
            message=request.message,
            form_state=request.current_form_state.model_dump(),
        )
        return ChatResponse(
            agent_reply=result["agent_reply"],
            updated_form_state=FormState(**result["updated_form_state"]),
            tool_called=result.get("tool_called"),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
