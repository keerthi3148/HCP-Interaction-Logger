import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { FormState } from "../types";

const initialState: FormState = {
  hcp_name: "",
  date: "",
  sentiment: "",
  materials_distributed: [],
  specialty: "",
  interaction_type: "",
  products_discussed: [],
  location: "",
  follow_up_required: false,
  follow_up_date: "",
  duration_minutes: 0,
  notes: "",
};

const formSlice = createSlice({
  name: "form",
  initialState,
  reducers: {
    setFormState: (_state, action: PayloadAction<FormState>) => action.payload,
  },
});

export const { setFormState } = formSlice.actions;
export default formSlice.reducer;
