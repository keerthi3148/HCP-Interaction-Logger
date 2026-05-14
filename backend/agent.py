"""
LangGraph agent that routes user messages to the appropriate tool.
The LLM (Groq llama-3.3-70b-versatile) decides which tool to call and extracts all entities.
"""

import os
import json
from datetime import date
from typing import Annotated, Any
from typing_extensions import TypedDict

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages

from tools import ALL_TOOLS


# ── State ────────────────────────────────────────────────────────────────────

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
    form_state: dict
    tool_result: dict | None


# ── LLM ──────────────────────────────────────────────────────────────────────

def get_llm():
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=os.environ["GROQ_API_KEY"],
        temperature=0,
    ).bind_tools(ALL_TOOLS)


SYSTEM_PROMPT = """You are an AI assistant for a pharma field rep CRM. You help log HCP (Healthcare
Professional) interactions by controlling a form exclusively through tool calls.
Never ask the user to fill fields manually — all form mutations happen via tools.

Today's date is {today}.

Current form state:
{form_state}

PRODUCT CATALOG (use exact names): CardioMax, OncoPrime, NeuroCare, GlucoShield, RespiClear

TOOLS — pick exactly ONE per user message:

log_interaction
  Use when: user describes a new meeting/visit from scratch
  Pass extracted_fields dict with any of:
    hcp_name (str), date (YYYY-MM-DD), sentiment (Positive/Neutral/Negative),
    materials_distributed (list: Brochure/Sample/Flyer/Other),
    specialty (str), interaction_type (In-person/Virtual/Phone Call),
    products_discussed (list from product catalog), location (str),
    duration_minutes (int), notes (str)
  Only include fields explicitly mentioned. Resolve relative dates.

edit_interaction
  Use when: user corrects or updates specific fields on an existing form
  Pass current_state (full current form) and changes (ONLY changed fields)
  Never put unchanged fields in changes

clear_form
  Use when: user says clear/reset/start over/wipe
  No arguments needed

submit_interaction
  Use when: user says submit/save/done/log this
  Pass current_state (full current form)

summarize_interaction
  Use when: user asks for a summary/recap/what have I logged
  Pass current_state

lookup_hcp
  Use when: user asks to look up / find / check a doctor's details
  Pass query: the doctor's name as a string
  Merges hcp_name, specialty, location into the form

generate_notes
  Use when: user asks to write notes / generate a report / add visit notes
  Pass current_state (the tool builds the notes from form data)

schedule_followup
  Use when: user mentions a follow-up visit, reminder, or next appointment
  Pass current_state and follow_up_date (YYYY-MM-DD, resolve relative dates)

RULES:
- Always call exactly one tool
- Resolve all relative dates (today={today}, yesterday, next Monday, in two weeks, etc.)
- After the tool result, reply naturally in 1-2 sentences confirming what changed
- If the user's intent is ambiguous, prefer the most specific tool
"""


# ── Graph Nodes ───────────────────────────────────────────────────────────────

def agent_node(state: AgentState) -> AgentState:
    llm = get_llm()
    system = SYSTEM_PROMPT.format(
        today=str(date.today()),
        form_state=json.dumps(state["form_state"], indent=2),
    )
    messages = [SystemMessage(content=system)] + state["messages"]
    response = llm.invoke(messages)
    return {"messages": [response], "form_state": state["form_state"], "tool_result": None}


def tool_node(state: AgentState) -> AgentState:
    last_message = state["messages"][-1]
    tool_results = []
    final_tool_result = None
    form_state = state["form_state"]

    for tool_call in last_message.tool_calls:
        name = tool_call["name"]
        args = tool_call["args"]
        tool_map = {t.name: t for t in ALL_TOOLS}

        # Inject current_state for tools that need it
        NEEDS_CURRENT_STATE = {
            "edit_interaction", "submit_interaction", "summarize_interaction",
            "generate_notes", "schedule_followup",
        }
        if name in NEEDS_CURRENT_STATE and "current_state" not in args:
            args = {**args, "current_state": form_state}

        # lookup_hcp merges into current state (only updates non-empty returned fields)
        if name == "lookup_hcp":
            pass  # handled below after result

        result = tool_map[name].invoke(args)
        if isinstance(result, str):
            result = json.loads(result)

        final_tool_result = result

        if "form_state" in result and result["form_state"] is not None:
            if name == "lookup_hcp":
                # Merge only the returned fields into existing state
                form_state = {**form_state, **result["form_state"]}
            else:
                # Merge returned state over current defaults (preserve existing non-empty values)
                if name == "log_interaction":
                    # log_interaction returns a full new state — use it directly but
                    # keep any existing fields that are non-empty and not overridden
                    new_fs = result["form_state"]
                    merged = {**form_state}
                    for k, v in new_fs.items():
                        if v not in (None, "", [], 0, False):
                            merged[k] = v
                    form_state = merged
                else:
                    form_state = result["form_state"]

        tool_results.append(
            ToolMessage(content=json.dumps(result), tool_call_id=tool_call["id"])
        )

    return {
        "messages": tool_results,
        "form_state": form_state,
        "tool_result": final_tool_result,
    }


def should_use_tool(state: AgentState) -> str:
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"
    return END


# ── Build Graph ───────────────────────────────────────────────────────────────

def build_graph():
    graph = StateGraph(AgentState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", tool_node)
    graph.set_entry_point("agent")
    graph.add_conditional_edges("agent", should_use_tool, {"tools": "tools", END: END})
    graph.add_edge("tools", "agent")
    return graph.compile()


graph = build_graph()


def run_agent(message: str, form_state: dict) -> dict:
    """
    Run the agent with a user message and current form state.
    Returns: { agent_reply, updated_form_state, tool_called }
    """
    initial_state: AgentState = {
        "messages": [HumanMessage(content=message)],
        "form_state": form_state,
        "tool_result": None,
    }
    final_state = graph.invoke(initial_state)

    # Extract last AI message text and which tool was called
    agent_reply = ""
    tool_called = None

    for msg in reversed(final_state["messages"]):
        if isinstance(msg, AIMessage) and not getattr(msg, "tool_calls", []):
            agent_reply = msg.content
            break

    # Find tool name from the AIMessage that triggered tool use
    for msg in final_state["messages"]:
        if isinstance(msg, AIMessage) and getattr(msg, "tool_calls", []):
            tool_called = msg.tool_calls[0]["name"]
            break

    return {
        "agent_reply": agent_reply or "Done.",
        "updated_form_state": final_state["form_state"],
        "tool_called": tool_called,
    }
