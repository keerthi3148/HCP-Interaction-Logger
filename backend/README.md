# Backend API & AI Agent — HCP Interaction Logger

This directory contains the backend service for the **HCP Interaction Logger** application. It is powered by **FastAPI** and **LangGraph**, utilizing Groq's fast inference API (`llama-3.3-70b-versatile`) to provide an entirely conversational, AI-driven CRM interface.

---

## Architecture Overview

The backend acts as the brain of the AI-first form:
1. **FastAPI** exposes a single main POST endpoint `/chat` which accepts the user's natural language message along with the current state of the form.
2. **LangGraph** routes the message using an LLM-powered tool-calling loop.
3. **8 Specialized Tools** handle distinct intent mutations (e.g. logging a full interaction, editing specific fields, pre-filling HCP details, generating summaries).
4. The backend returns the final updated form state along with the assistant's reply and a visual badge identifying the tool that was triggered.

---

## File Structure

```
backend/
├── main.py          # FastAPI application initialization, CORS middleware, and HTTP routes
├── agent.py         # LangGraph state graph setup, Groq LLM binding, and execution logic
├── tools.py         # Definitions for the 8 agent tools and mocked internal HCP database
├── models.py        # Pydantic schemas validating API inputs/outputs and form state consistency
├── requirements.txt # Python dependencies
└── .env.example     # Environment variable template
```

---

## API Endpoints

### 1. Health Check
- **URL**: `/health`
- **Method**: `GET`
- **Description**: Checks service availability.
- **Response**:
  ```json
  {
    "status": "ok"
  }
  ```

### 2. Chat Processing
- **URL**: `/chat`
- **Method**: `POST`
- **Description**: Submits a message to the LangGraph agent to mutate the form state.
- **Request Body (`ChatRequest`)**:
  ```json
  {
    "message": "Met Dr. Rao today, positive sentiment, discussed CardioMax",
    "current_form_state": {
      "hcp_name": "",
      "specialty": "",
      "location": "",
      "date": "",
      "duration": null,
      "interaction_type": "In-person",
      "sentiment": null,
      "products_discussed": [],
      "materials_distributed": [],
      "follow_up_required": false,
      "follow_up_date": "",
      "notes": ""
    }
  }
  ```
- **Response Body (`ChatResponse`)**:
  ```json
  {
    "agent_reply": "Logged your visit with Dr. Vikram Rao on today's date...",
    "updated_form_state": {
      "hcp_name": "Dr. Vikram Rao",
      "specialty": "Cardiologist",
      "location": "Apollo Hospital, Chennai",
      "date": "2026-05-14",
      "duration": null,
      "interaction_type": "In-person",
      "sentiment": "Positive",
      "products_discussed": ["CardioMax"],
      "materials_distributed": [],
      "follow_up_required": false,
      "follow_up_date": "",
      "notes": ""
    },
    "tool_called": "⚡ Log Interaction"
  }
  ```

---

## Available LangGraph Tools

| Tool Name | Action | Logic / Side Effects |
|-----------|--------|----------------------|
| `log_interaction` | Fills the entire interaction record | Parses names, relative dates, and products with zero rigid regex rules. |
| `edit_interaction` | Modifies targeted field values | Preserves all other state attributes perfectly. |
| `clear_form` | Wipes the workspace | Returns form state to initial/empty defaults. |
| `submit_interaction` | Validates completeness | Verifies required entities (HCP Name, Date, Sentiment) before confirming submission. |
| `summarize_interaction`| Generates recap | Reviews active fields and synthesizes a structured conversational summary. |
| `lookup_hcp` | Queries HCP database | Pre-fills HCP Name, Specialty, and Clinic Location from pre-existing backend profiles. |
| `generate_notes` | Autocomposes formal report | Formats structured remarks into a polished visit note ready for review. |
| `schedule_followup` | Sets date and toggle | Parses relative dates (e.g., "next Friday") into absolute `YYYY-MM-DD` strings. |

---

## Local Setup Instructions

### Prerequisites
- Python 3.11 or higher
- A valid [Groq API Key](https://console.groq.com)

### Installation Steps

1. **Create and Activate a Virtual Environment**
   ```bash
   python -m venv venv
   
   # On Windows:
   venv\Scripts\activate
   
   # On macOS/Linux:
   source venv/bin/activate
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**
   Copy the provided example template to `.env`:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and set your `GROQ_API_KEY`:
   ```env
   GROQ_API_KEY=gsk_your_actual_groq_api_key_here
   ```

4. **Run the Development Server**
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The API will now accept connections at `http://localhost:8000`.
