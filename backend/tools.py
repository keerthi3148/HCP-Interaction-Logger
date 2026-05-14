"""
LangGraph tool definitions for the HCP Interaction Logger.
All entity extraction is handled by the LLM — no hardcoded parsing.
"""

from datetime import date
from langchain_core.tools import tool


# ── Mock HCP database (realistic pharma rep scenario) ────────────────────────

HCP_DATABASE = {
    "dr. rao": {
        "hcp_name": "Dr. Vikram Rao",
        "specialty": "Cardiologist",
        "location": "Apollo Hospital, Chennai",
    },
    "dr. smith": {
        "hcp_name": "Dr. Emily Smith",
        "specialty": "Oncologist",
        "location": "Fortis Cancer Centre, Mumbai",
    },
    "dr. patel": {
        "hcp_name": "Dr. Rajan Patel",
        "specialty": "General Practitioner",
        "location": "City Clinic, Ahmedabad",
    },
    "dr. john": {
        "hcp_name": "Dr. Sarah John",
        "specialty": "Neurologist",
        "location": "NIMHANS, Bangalore",
    },
    "dr. sharma": {
        "hcp_name": "Dr. Anil Sharma",
        "specialty": "Diabetologist",
        "location": "Max Hospital, Delhi",
    },
}

PRODUCT_CATALOG = ["CardioMax", "OncoPrime", "NeuroCare", "GlucoShield", "RespiClear"]


# ── Existing tools ────────────────────────────────────────────────────────────

@tool
def log_interaction(
    hcp_name: str = "",
    date: str = "",
    sentiment: str = "",
    materials_distributed: list = [],
    specialty: str = "",
    interaction_type: str = "",
    products_discussed: list = [],
    location: str = "",
    duration_minutes: int = 0,
    notes: str = "",
) -> dict:
    """
    Populate the form with HCP interaction details extracted from natural language.
    Pass only the fields explicitly mentioned by the user — omit the rest.
    date: YYYY-MM-DD format. Resolve 'today', 'yesterday', relative dates.
    sentiment: one of Positive, Neutral, Negative.
    materials_distributed: list from [Brochure, Sample, Flyer, Other].
    interaction_type: one of In-person, Virtual, Phone Call.
    products_discussed: list from [CardioMax, OncoPrime, NeuroCare, GlucoShield, RespiClear].
    """
    from datetime import date as _date
    fields = {
        "hcp_name": hcp_name,
        "date": date or str(_date.today()),
        "sentiment": sentiment,
        "materials_distributed": materials_distributed,
        "specialty": specialty,
        "interaction_type": interaction_type,
        "products_discussed": products_discussed,
        "location": location,
        "follow_up_required": False,
        "follow_up_date": "",
        "duration_minutes": duration_minutes,
        "notes": notes,
    }
    return {"tool": "log_interaction", "form_state": fields}


@tool
def edit_interaction(current_state: dict, changes: dict) -> dict:
    """
    Apply partial updates to the form. Only fields present in 'changes' are modified.
    current_state: the existing form fields dict.
    changes: dict with ONLY the fields to update. All valid FormState keys are accepted:
      hcp_name, date, sentiment, materials_distributed, specialty, interaction_type,
      products_discussed, location, follow_up_required, follow_up_date,
      duration_minutes, notes.
    Do NOT include unchanged fields in changes.
    """
    updated = dict(current_state)
    for key, value in changes.items():
        if key in updated:
            # Allow explicit False and 0 — only skip None and empty string
            if value is None or value == "":
                continue
            updated[key] = value
    return {"tool": "edit_interaction", "form_state": updated}


@tool
def clear_form() -> dict:
    """
    Reset ALL form fields to their default empty/zero state.
    Triggered by: 'clear', 'reset', 'start over', 'wipe the form'.
    """
    return {
        "tool": "clear_form",
        "form_state": {
            "hcp_name": "",
            "date": "",
            "sentiment": "",
            "materials_distributed": [],
            "specialty": "",
            "interaction_type": "",
            "products_discussed": [],
            "location": "",
            "follow_up_required": False,
            "follow_up_date": "",
            "duration_minutes": 0,
            "notes": "",
        },
    }


@tool
def submit_interaction(current_state: dict) -> dict:
    """
    Validate the current form state and simulate saving the interaction.
    Required fields: hcp_name, date, sentiment.
    Returns success message or validation error listing missing fields.
    Triggered by: 'submit', 'save', 'log this interaction', 'done'.
    """
    required = ["hcp_name", "date", "sentiment"]
    missing = [f.replace("_", " ") for f in required if not current_state.get(f)]
    if missing:
        return {
            "tool": "submit_interaction",
            "form_state": current_state,
            "success": False,
            "message": f"Cannot submit — missing required fields: {', '.join(missing)}.",
        }
    products = ", ".join(current_state.get("products_discussed", [])) or "none"
    return {
        "tool": "submit_interaction",
        "form_state": current_state,
        "success": True,
        "message": (
            f"Interaction with {current_state['hcp_name']} on {current_state['date']} "
            f"({current_state['sentiment']} sentiment) saved successfully! "
            f"Products discussed: {products}."
        ),
    }


@tool
def summarize_interaction(current_state: dict) -> dict:
    """
    Generate a concise human-readable summary of the currently logged interaction.
    Triggered by: 'summarize', 'what have I logged', 'give me a summary', 'recap'.
    """
    if not current_state.get("hcp_name") and not current_state.get("date"):
        return {
            "tool": "summarize_interaction",
            "form_state": current_state,
            "summary": "No interaction data has been logged yet.",
        }
    materials = ", ".join(current_state.get("materials_distributed", [])) or "none"
    products = ", ".join(current_state.get("products_discussed", [])) or "none"
    follow_up = (
        f"Follow-up scheduled on {current_state['follow_up_date']}."
        if current_state.get("follow_up_required") and current_state.get("follow_up_date")
        else "No follow-up scheduled."
    )
    summary = (
        f"Meeting with {current_state.get('hcp_name', '—')} "
        f"({current_state.get('specialty', 'specialty unknown')}) "
        f"at {current_state.get('location', 'location unknown')} "
        f"on {current_state.get('date', '—')} via {current_state.get('interaction_type', 'unknown channel')}. "
        f"Sentiment: {current_state.get('sentiment', 'not set')}. "
        f"Products discussed: {products}. Materials: {materials}. "
        f"{follow_up}"
    )
    return {
        "tool": "summarize_interaction",
        "form_state": current_state,
        "summary": summary,
    }


# ── New tools ─────────────────────────────────────────────────────────────────

@tool
def lookup_hcp(query: str) -> dict:
    """
    Look up a Healthcare Professional by name in the internal database.
    Automatically fills hcp_name, specialty, and location based on the match.
    Triggered by: 'look up Dr. X', 'who is Dr. X', 'check Dr. X', 'find Dr. Patel'.
    query: the doctor's name or partial name to search for.
    Returns the matched HCP record merged into current form state.
    """
    key = query.lower().strip()
    # Try exact key match first, then partial
    match = HCP_DATABASE.get(key)
    if not match:
        for db_key, record in HCP_DATABASE.items():
            if key in db_key or db_key in key:
                match = record
                break

    if not match:
        return {
            "tool": "lookup_hcp",
            "form_state": None,
            "found": False,
            "message": f"No HCP record found for '{query}'. You can still log manually via chat.",
        }
    return {
        "tool": "lookup_hcp",
        "form_state": {
            "hcp_name": match["hcp_name"],
            "specialty": match["specialty"],
            "location": match["location"],
        },
        "found": True,
        "message": f"Found: {match['hcp_name']} — {match['specialty']} at {match['location']}.",
    }


@tool
def generate_notes(current_state: dict) -> dict:
    """
    Compose a professional visit report / notes field from the current form data.
    The LLM calling this tool should write the notes itself and pass them here.
    Triggered by: 'write notes', 'generate a report', 'add visit notes', 'write a summary note'.
    notes: the professionally written visit notes string to store in the form.
    """
    if not current_state.get("hcp_name"):
        return {
            "tool": "generate_notes",
            "form_state": current_state,
            "message": "Cannot generate notes — no HCP name logged yet.",
        }
    products = ", ".join(current_state.get("products_discussed", [])) or "no specific products"
    materials = ", ".join(current_state.get("materials_distributed", [])) or "no materials"
    follow_up = (
        f"A follow-up visit has been scheduled for {current_state['follow_up_date']}."
        if current_state.get("follow_up_required") and current_state.get("follow_up_date")
        else "No follow-up visit required at this time."
    )
    notes = (
        f"Field rep visited {current_state.get('hcp_name')} "
        f"({current_state.get('specialty', 'HCP')}) at {current_state.get('location', 'their clinic')} "
        f"on {current_state.get('date')} via {current_state.get('interaction_type', 'in-person visit')}. "
        f"Discussion focused on {products}. "
        f"Overall sentiment was {current_state.get('sentiment', 'neutral').lower()}. "
        f"Materials distributed: {materials}. "
        f"{follow_up}"
    )
    updated = {**current_state, "notes": notes}
    return {
        "tool": "generate_notes",
        "form_state": updated,
        "message": "Visit notes generated and saved to the form.",
    }


@tool
def schedule_followup(current_state: dict, follow_up_date: str) -> dict:
    """
    Mark the interaction as requiring a follow-up and set the follow-up date.
    Triggered by: 'schedule a follow-up', 'follow up on', 'remind me', 'book next visit'.
    current_state: the current form fields.
    follow_up_date: the resolved follow-up date in YYYY-MM-DD format.
    Resolve relative dates ('next Monday', 'in two weeks') to absolute YYYY-MM-DD.
    """
    updated = {**current_state, "follow_up_required": True, "follow_up_date": follow_up_date}
    return {
        "tool": "schedule_followup",
        "form_state": updated,
        "message": f"Follow-up with {current_state.get('hcp_name', 'the HCP')} scheduled for {follow_up_date}.",
    }


ALL_TOOLS = [
    log_interaction,
    edit_interaction,
    clear_form,
    submit_interaction,
    summarize_interaction,
    lookup_hcp,
    generate_notes,
    schedule_followup,
]
