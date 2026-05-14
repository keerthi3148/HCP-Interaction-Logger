import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { RootState, AppDispatch } from "../store";
import { addMessage, setLoading } from "../store/chatSlice";
import { setFormState } from "../store/formSlice";
import { ChatMessage } from "../types";

const TOOL_LABELS: Record<string, string> = {
  log_interaction: "Log Interaction",
  edit_interaction: "Edit Interaction",
  clear_form: "Clear Form",
  submit_interaction: "Submit",
  summarize_interaction: "Summarize",
  lookup_hcp: "Lookup HCP",
  generate_notes: "Generate Notes",
  schedule_followup: "Schedule Follow-up",
};

const TOOL_COLORS: Record<string, string> = {
  log_interaction: "bg-blue-100 text-blue-700",
  edit_interaction: "bg-purple-100 text-purple-700",
  clear_form: "bg-red-100 text-red-700",
  submit_interaction: "bg-green-100 text-green-700",
  summarize_interaction: "bg-yellow-100 text-yellow-700",
  lookup_hcp: "bg-cyan-100 text-cyan-700",
  generate_notes: "bg-orange-100 text-orange-700",
  schedule_followup: "bg-pink-100 text-pink-700",
};

const SUGGESTIONS = [
  "Pull up Dr. Rao's profile",
  "Just got back from Apollo — met Dr. Rao, he was really open to CardioMax, left him some brochures and samples, took about 45 minutes",
  "Actually the meeting was virtual, not in person",
  "He also asked about GlucoShield so add that to the products",
  "Can you write up the visit notes?",
  "Book a follow-up with him for next Friday",
  "Give me a quick recap of what's been logged",
  "Looks good, go ahead and submit it",
  "Clear the form",
];

export default function ChatPanel() {
  const dispatch = useDispatch<AppDispatch>();
  const { messages, loading } = useSelector((s: RootState) => s.chat);
  const formState = useSelector((s: RootState) => s.form);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");

    const userMsg: ChatMessage = { role: "user", content: msg };
    dispatch(addMessage(userMsg));
    dispatch(setLoading(true));

    try {
      const res = await axios.post("http://localhost:8000/chat", {
        message: msg,
        current_form_state: formState,
      });
      const { agent_reply, updated_form_state, tool_called } = res.data;
      dispatch(setFormState(updated_form_state));
      dispatch(
        addMessage({
          role: "assistant",
          content: agent_reply,
          tool_called: tool_called ?? undefined,
        })
      );
    } catch (err: any) {
      dispatch(
        addMessage({
          role: "assistant",
          content: "Error: " + (err.response?.data?.detail ?? err.message),
        })
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">AI Assistant</h2>
        <p className="text-xs text-gray-500 mt-1">
          Type naturally — the AI will fill and manage the form for you
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center mt-8">
            <div className="text-4xl mb-3">🩺</div>
            <p className="text-gray-500 text-sm mb-4">
              Start by describing your HCP interaction
            </p>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left text-sm px-4 py-2 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  "{s}"
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[80%] ${msg.role === "user" ? "" : ""}`}>
              {msg.role === "assistant" && (
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    AI
                  </div>
                  <span className="text-xs text-gray-400">Assistant</span>
                </div>
              )}
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-sm"
                    : "bg-gray-100 text-gray-800 rounded-tl-sm"
                }`}
              >
                {msg.content}
              </div>
              {msg.tool_called && (
                <div className="mt-1 flex justify-start">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      TOOL_COLORS[msg.tool_called] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    ⚡ {TOOL_LABELS[msg.tool_called] ?? msg.tool_called}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Describe the interaction or give a command..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
