import React, { useRef, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store";

const SENTIMENTS = ["Positive", "Neutral", "Negative"];
const MATERIALS = ["Brochure", "Sample", "Flyer", "Other"];
const PRODUCTS = ["CardioMax", "OncoPrime", "NeuroCare", "GlucoShield", "RespiClear"];
const INTERACTION_TYPES = ["In-person", "Virtual", "Phone Call"];

const SENTIMENT_STYLE: Record<string, string> = {
  Positive: "border-green-400 bg-green-50 text-green-700",
  Neutral: "border-yellow-400 bg-yellow-50 text-yellow-700",
  Negative: "border-red-400 bg-red-50 text-red-700",
};

const INTERACTION_ICONS: Record<string, string> = {
  "In-person": "🤝",
  "Virtual": "💻",
  "Phone Call": "📞",
};

// Fields to watch for highlight animation
const WATCHED_KEYS = [
  "hcp_name", "date", "sentiment", "materials_distributed",
  "specialty", "interaction_type", "products_discussed",
  "location", "follow_up_required", "follow_up_date",
  "duration_minutes", "notes",
];

function useChangedFields(form: Record<string, any>) {
  const prev = useRef<Record<string, any>>(form);
  const [changed, setChanged] = useState<Set<string>>(new Set());

  useEffect(() => {
    const c = new Set<string>();
    for (const key of WATCHED_KEYS) {
      if (JSON.stringify(prev.current[key]) !== JSON.stringify(form[key])) {
        c.add(key);
      }
    }
    if (c.size > 0) {
      setChanged(c);
      const t = setTimeout(() => setChanged(new Set()), 1200);
      prev.current = form;
      return () => clearTimeout(t);
    }
    prev.current = form;
  }, [form]);

  return changed;
}

function FieldWrapper({ fieldKey, changed, children }: { fieldKey: string; changed: Set<string>; children: React.ReactNode }) {
  return (
    <div className={`rounded-lg p-1 transition-colors duration-700 ${changed.has(fieldKey) ? "bg-blue-50 ring-1 ring-blue-200" : ""}`}>
      {children}
    </div>
  );
}

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
      {text} {required && <span className="text-red-400">*</span>}
    </label>
  );
}

function ReadOnlyInput({ value, placeholder }: { value: string; placeholder?: string }) {
  return (
    <input
      type="text"
      readOnly
      disabled
      value={value}
      placeholder={placeholder ?? "AI will fill this"}
      className="w-full px-3 py-2 rounded-md border border-gray-200 bg-gray-50 text-gray-800 text-sm cursor-not-allowed focus:outline-none placeholder:text-gray-300"
    />
  );
}

export default function FormPanel() {
  const form = useSelector((s: RootState) => s.form);
  const changed = useChangedFields(form);

  const hasData = !!(form.hcp_name || form.date);

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Interaction Details</h2>
          <p className="text-xs text-blue-500 mt-0.5 font-medium">AI-controlled — use the chat →</p>
        </div>
        {hasData && (
          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-semibold">
            In Progress
          </span>
        )}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* Section: HCP Details */}
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">HCP Details</p>

        <FieldWrapper fieldKey="hcp_name" changed={changed}>
          <Label text="HCP Name" required />
          <ReadOnlyInput value={form.hcp_name} placeholder="Dr. Full Name" />
        </FieldWrapper>

        <div className="grid grid-cols-2 gap-3">
          <FieldWrapper fieldKey="specialty" changed={changed}>
            <Label text="Specialty" />
            <ReadOnlyInput value={form.specialty} placeholder="e.g. Cardiologist" />
          </FieldWrapper>
          <FieldWrapper fieldKey="location" changed={changed}>
            <Label text="Location / Clinic" />
            <ReadOnlyInput value={form.location} placeholder="Hospital name" />
          </FieldWrapper>
        </div>

        {/* Section: Visit Info */}
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-1">Visit Info</p>

        <div className="grid grid-cols-2 gap-3">
          <FieldWrapper fieldKey="date" changed={changed}>
            <Label text="Date" required />
            <ReadOnlyInput value={form.date} placeholder="YYYY-MM-DD" />
          </FieldWrapper>
          <FieldWrapper fieldKey="duration_minutes" changed={changed}>
            <Label text="Duration (min)" />
            <ReadOnlyInput value={form.duration_minutes > 0 ? String(form.duration_minutes) : ""} placeholder="e.g. 30" />
          </FieldWrapper>
        </div>

        <FieldWrapper fieldKey="interaction_type" changed={changed}>
          <Label text="Interaction Type" />
          <div className="flex gap-2">
            {INTERACTION_TYPES.map((t) => (
              <label
                key={t}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs cursor-not-allowed select-none flex-1 justify-center
                  ${form.interaction_type === t
                    ? "border-blue-400 bg-blue-50 text-blue-700 font-semibold"
                    : "border-gray-200 text-gray-400"
                  }`}
              >
                <input type="radio" readOnly disabled checked={form.interaction_type === t} onChange={() => {}} className="cursor-not-allowed" />
                {INTERACTION_ICONS[t]} {t}
              </label>
            ))}
          </div>
        </FieldWrapper>

        <FieldWrapper fieldKey="sentiment" changed={changed}>
          <Label text="Sentiment" required />
          <div className="flex gap-2">
            {SENTIMENTS.map((s) => (
              <label
                key={s}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md border text-xs cursor-not-allowed select-none flex-1 justify-center
                  ${form.sentiment === s
                    ? SENTIMENT_STYLE[s] + " font-semibold"
                    : "border-gray-200 text-gray-400"
                  }`}
              >
                <input type="radio" readOnly disabled checked={form.sentiment === s} onChange={() => {}} className="cursor-not-allowed" />
                {s}
              </label>
            ))}
          </div>
        </FieldWrapper>

        {/* Section: Products & Materials */}
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-1">Products & Materials</p>

        <FieldWrapper fieldKey="products_discussed" changed={changed}>
          <Label text="Products Discussed" />
          <div className="grid grid-cols-2 gap-1.5">
            {PRODUCTS.map((p) => {
              const checked = form.products_discussed.includes(p);
              return (
                <label
                  key={p}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs cursor-not-allowed select-none
                    ${checked ? "border-indigo-400 bg-indigo-50 text-indigo-700 font-medium" : "border-gray-200 text-gray-400"}`}
                >
                  <input type="checkbox" readOnly disabled checked={checked} onChange={() => {}} className="cursor-not-allowed" />
                  {p}
                </label>
              );
            })}
          </div>
        </FieldWrapper>

        <FieldWrapper fieldKey="materials_distributed" changed={changed}>
          <Label text="Materials Distributed" />
          <div className="grid grid-cols-2 gap-1.5">
            {MATERIALS.map((m) => {
              const checked = form.materials_distributed.includes(m);
              return (
                <label
                  key={m}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs cursor-not-allowed select-none
                    ${checked ? "border-blue-400 bg-blue-50 text-blue-700 font-medium" : "border-gray-200 text-gray-400"}`}
                >
                  <input type="checkbox" readOnly disabled checked={checked} onChange={() => {}} className="cursor-not-allowed" />
                  {m}
                </label>
              );
            })}
          </div>
        </FieldWrapper>

        {/* Section: Follow-up */}
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-1">Follow-up</p>

        <FieldWrapper fieldKey="follow_up_required" changed={changed}>
          <Label text="Follow-up Required" />
          <div className="flex items-center gap-3">
            <div
              className={`relative w-10 h-5 rounded-full transition-colors ${
                form.follow_up_required ? "bg-blue-500" : "bg-gray-200"
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  form.follow_up_required ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </div>
            <span className={`text-xs font-medium ${form.follow_up_required ? "text-blue-600" : "text-gray-400"}`}>
              {form.follow_up_required ? "Yes" : "No"}
            </span>
          </div>
        </FieldWrapper>

        {form.follow_up_required && (
          <FieldWrapper fieldKey="follow_up_date" changed={changed}>
            <Label text="Follow-up Date" />
            <ReadOnlyInput value={form.follow_up_date} placeholder="YYYY-MM-DD" />
          </FieldWrapper>
        )}

        {/* Section: Notes */}
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-1">Visit Notes</p>

        <FieldWrapper fieldKey="notes" changed={changed}>
          <Label text="Notes / Remarks" />
          <textarea
            readOnly
            disabled
            value={form.notes}
            placeholder="AI-generated visit notes will appear here..."
            rows={4}
            className="w-full px-3 py-2 rounded-md border border-gray-200 bg-gray-50 text-gray-800 text-xs cursor-not-allowed resize-none focus:outline-none placeholder:text-gray-300 leading-relaxed"
          />
        </FieldWrapper>

        {/* Summary card */}
        {hasData && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">Current Record</p>
            <p className="text-sm text-green-900 font-medium">{form.hcp_name}</p>
            <p className="text-xs text-green-700 mt-0.5">
              {[form.specialty, form.location].filter(Boolean).join(" · ")}
            </p>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {form.date && <span className="text-xs bg-white border border-green-200 rounded px-1.5 py-0.5 text-green-700">{form.date}</span>}
              {form.sentiment && <span className="text-xs bg-white border border-green-200 rounded px-1.5 py-0.5 text-green-700">{form.sentiment}</span>}
              {form.interaction_type && <span className="text-xs bg-white border border-green-200 rounded px-1.5 py-0.5 text-green-700">{form.interaction_type}</span>}
              {form.follow_up_required && <span className="text-xs bg-orange-100 border border-orange-200 rounded px-1.5 py-0.5 text-orange-700">Follow-up: {form.follow_up_date || "TBD"}</span>}
            </div>
          </div>
        )}

        {/* Bottom padding */}
        <div className="h-4" />
      </div>
    </div>
  );
}
