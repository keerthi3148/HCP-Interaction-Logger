from pydantic import BaseModel
from typing import Optional, List


class FormState(BaseModel):
    # Core fields
    hcp_name: str = ""
    date: str = ""
    sentiment: str = ""           # "Positive" | "Neutral" | "Negative"
    materials_distributed: List[str] = []  # Brochure, Sample, Flyer, Other

    # Enhanced fields
    specialty: str = ""           # e.g. Cardiologist, Oncologist, GP
    interaction_type: str = ""    # "In-person" | "Virtual" | "Phone Call"
    products_discussed: List[str] = []  # e.g. ["CardioMax", "OncoPrime"]
    location: str = ""            # e.g. "Apollo Hospital, Chennai"
    follow_up_required: bool = False
    follow_up_date: str = ""      # YYYY-MM-DD, only if follow_up_required
    duration_minutes: int = 0
    notes: str = ""               # AI-generated visit notes


class ChatRequest(BaseModel):
    message: str
    current_form_state: FormState


class ChatResponse(BaseModel):
    agent_reply: str
    updated_form_state: FormState
    tool_called: Optional[str] = None
