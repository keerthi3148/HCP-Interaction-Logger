# HCP Interaction Logger — AI-First CRM

An AI-powered CRM screen for logging Healthcare Professional (HCP) interactions built as a Round 1 technical assignment. The form is **entirely AI-controlled** — no manual data entry is allowed. All form mutations happen exclusively through natural language commands sent to an AI chat powered by a LangGraph agent.

---

## What It Does

Field representatives in pharma often need to log detailed notes after visiting a doctor — recording who they met, what was discussed, what materials were handed over, and whether a follow-up is needed. This application replaces the traditional "fill a form" approach with a **conversational AI interface**:

1. The rep types naturally in the chat (e.g. *"Met Dr. Rao at Apollo Hospital today, discussed CardioMax, positive sentiment"*)
2. The LangGraph agent routes the message to the correct tool
3. The LLM extracts all relevant entities — names, dates, products, sentiment — with zero hardcoded parsing
4. The form on the left updates in real time, with a blue highlight animation showing which fields changed
5. The rep can then correct, enrich, schedule follow-ups, generate visit notes, and submit — all through chat

---

## Key Features

### AI-Controlled Form
Every field on the left panel is **disabled** — there is no way to type into it directly. The only way to change any value is by instructing the AI in the chat. This enforces a consistent, structured data capture flow while letting the rep express themselves naturally.

### 8 LangGraph Tools
The agent selects among 8 specialized tools based on intent — no hardcoded if/else routing:

| # | Tool | Trigger phrases | What it does |
|---|------|----------------|--------------|
| 1 | `log_interaction` | "Met Dr. X today...", "I visited..." | Extracts entities from a natural language description and populates the full form — name, date, sentiment, products, materials, interaction type, location, duration |
| 2 | `edit_interaction` | "Change sentiment to...", "Actually the name was..." | Updates **only** the specified fields, leaving everything else intact |
| 3 | `clear_form` | "Clear", "Reset", "Start over" | Wipes all fields back to their defaults |
| 4 | `submit_interaction` | "Submit", "Save", "Log this", "Done" | Validates required fields (HCP name, date, sentiment) and confirms submission or returns a specific error listing what's missing |
| 5 | `summarize_interaction` | "Summarize", "What have I logged?", "Recap" | Generates a rich natural-language summary of everything currently in the form |
| 6 | `lookup_hcp` | "Look up Dr. Rao", "Who is Dr. Smith?", "Find Dr. Patel" | Queries the internal HCP database and auto-fills name, specialty, and clinic location before the visit details are even entered |
| 7 | `generate_notes` | "Write visit notes", "Generate a report", "Add notes" | Composes a professional field-rep visit report from the current form data and saves it into the Notes field |
| 8 | `schedule_followup` | "Schedule a follow-up", "Remind me next Monday", "Book next visit" | Resolves relative dates ("next Monday", "in two weeks") to absolute YYYY-MM-DD and sets the follow-up toggle and date |

### 12 Form Fields Across 4 Sections

**HCP Details**
- HCP Name — the doctor's full name
- Specialty — e.g. Cardiologist, Oncologist, GP
- Location / Clinic — hospital or clinic name

**Visit Info**
- Date — resolved from natural language (today, yesterday, last Monday)
- Duration — meeting length in minutes
- Interaction Type — In-person / Virtual / Phone Call
- Sentiment — Positive / Neutral / Negative

**Products & Materials**
- Products Discussed — multi-select from product catalog (CardioMax, OncoPrime, NeuroCare, GlucoShield, RespiClear)
- Materials Distributed — Brochure / Sample / Flyer / Other

**Follow-up**
- Follow-up Required — toggle (Yes/No)
- Follow-up Date — only shown when follow-up is toggled on

**Visit Notes**
- Notes / Remarks — AI-generated professional visit report

### Real-time Field Highlighting
When any field changes, it flashes a soft blue for ~1.2 seconds so the rep can immediately see what the AI updated without scanning the entire form.

### Tool Badge on Every Response
Every assistant message shows a colored badge indicating which LangGraph tool was invoked (e.g. ⚡ Lookup HCP, ⚡ Schedule Follow-up). This makes the agent's reasoning transparent.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + TailwindCSS + Redux Toolkit |
| Backend | Python 3.13 + FastAPI |
| AI Agent | LangGraph 1.x + LangChain Core |
| LLM | Groq — `llama-3.3-70b-versatile` |
| Font | Google Inter |

> **Note on LLM model:** The assignment specifies `gemma2-9b-it` but that model was decommissioned by Groq. Switched to `llama-3.3-70b-versatile`, which is also listed in the assignment as an acceptable model.

---

## Project Structure

```
├── backend/
│   ├── main.py          # FastAPI app + /chat endpoint + CORS
│   ├── agent.py         # LangGraph StateGraph, Groq LLM, run_agent()
│   ├── tools.py         # 8 LangGraph tool definitions + mock HCP database
│   ├── models.py        # Pydantic schemas (FormState, ChatRequest, ChatResponse)
│   ├── requirements.txt
│   ├── .env.example
│   └── .env             # Your actual secrets — gitignored
└── frontend/
    └── src/
        ├── App.tsx               # Split-screen layout + Redux Provider
        ├── types.ts              # FormState, ChatMessage, API types
        ├── index.css             # Tailwind directives + Inter font + animations
        ├── store/
        │   ├── index.ts          # Redux store
        │   ├── formSlice.ts      # Form state slice
        │   └── chatSlice.ts      # Chat messages + loading state
        └── components/
            ├── FormPanel.tsx     # Left panel — 12-field AI-controlled form
            └── ChatPanel.tsx     # Right panel — chat UI with tool badges
```

---

## Setup & Run

### Prerequisites
- Python 3.11+
- Node.js 18+
- A [Groq API key](https://console.groq.com) (free tier is sufficient)

### Backend

```bash
cd backend
python -m venv venv

# Activate the venv
source venv/bin/activate       # macOS/Linux
venv\Scripts\activate          # Windows

pip install -r requirements.txt

# Create your .env from the example
cp .env.example .env
# Open .env and set: GROQ_API_KEY=your_key_here

uvicorn main:app --reload --port 8000
```

The API will be live at `http://localhost:8000`. Test it: `curl http://localhost:8000/health`

### Frontend

```bash
cd frontend
npm install
npm start   # Runs on http://localhost:3000
```

Open `http://localhost:3000` in your browser. Both services must be running.

---

## Example Conversation Flow

```
Rep:       "Pull up Dr. Rao's profile"
AI:        "Got it — Dr. Vikram Rao, Cardiologist at Apollo Hospital, Chennai."
           [⚡ Lookup HCP]           → auto-fills name, specialty, location

Rep:       "Just got back from Apollo. He was really receptive today —
            we went through CardioMax and GlucoShield in detail,
            left him some brochures and samples. Took about 45 minutes."
AI:        "Logged your visit with Dr. Vikram Rao on today's date..."
           [⚡ Log Interaction]      → fills date, sentiment, type, products, materials, duration

Rep:       "Actually that was a virtual call, not in person"
AI:        "Updated — changed interaction type to Virtual."
           [⚡ Edit Interaction]     → updates only interaction_type, rest unchanged

Rep:       "He also brought up OncoPrime at the end, add that in"
AI:        "Added OncoPrime to the products discussed."
           [⚡ Edit Interaction]     → appends OncoPrime to products_discussed

Rep:       "He seemed a bit unsure about switching — let's book a follow-up for next Friday"
AI:        "Follow-up with Dr. Vikram Rao scheduled for 2026-05-23."
           [⚡ Schedule Follow-up]   → sets follow_up_required=true, resolves date

Rep:       "Can you write up the visit notes?"
AI:        "Notes written and saved to the form."
           [⚡ Generate Notes]       → composes professional visit report

Rep:       "Looks good, go ahead and submit it"
AI:        "Interaction saved successfully!"
           [⚡ Submit]               → validates required fields, confirms
```

---

## Acceptance Criteria

- [x] Split-screen layout — Form (left) + Chat (right)
- [x] All form fields are disabled — no manual input possible
- [x] LangGraph fully integrated with agent routing
- [x] LLM drives all entity extraction — zero hardcoded parsing
- [x] `log_interaction` — populates all 12 fields from natural language
- [x] `edit_interaction` — updates only specified fields, leaves rest intact
- [x] `clear_form` — resets all fields to defaults
- [x] `submit_interaction` — validates required fields, returns specific errors
- [x] `summarize_interaction` — rich natural-language summary of full form
- [x] `lookup_hcp` — pre-fills HCP details from internal database
- [x] `generate_notes` — builds professional visit report into Notes field
- [x] `schedule_followup` — resolves relative dates, sets follow-up toggle + date
- [x] Tool badge shown under every AI response
- [x] Blue highlight animation on changed fields
- [x] Redux manages all frontend state
- [x] Google Inter font throughout
