import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ChatMessage } from "../types";

interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
}

const initialState: ChatState = {
  messages: [],
  loading: false,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { addMessage, setLoading } = chatSlice.actions;
export default chatSlice.reducer;
