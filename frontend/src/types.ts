export interface FormState {
  // Core fields
  hcp_name: string;
  date: string;
  sentiment: string;               // "Positive" | "Neutral" | "Negative" | ""
  materials_distributed: string[]; // Brochure, Sample, Flyer, Other

  // Enhanced fields
  specialty: string;
  interaction_type: string;        // "In-person" | "Virtual" | "Phone Call" | ""
  products_discussed: string[];    // e.g. ["CardioMax", "OncoPrime"]
  location: string;
  follow_up_required: boolean;
  follow_up_date: string;
  duration_minutes: number;
  notes: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  tool_called?: string;
}

export interface ChatRequest {
  message: string;
  current_form_state: FormState;
}

export interface ChatResponse {
  agent_reply: string;
  updated_form_state: FormState;
  tool_called: string | null;
}
