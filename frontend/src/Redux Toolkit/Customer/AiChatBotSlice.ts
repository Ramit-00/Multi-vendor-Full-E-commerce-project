import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../Config/Api";

// Define the initial state using an interface
interface AiChatBotState {
  response: string | null;
  loading: boolean;
  error: string | null;
  messages: any[];
}

const initialState: AiChatBotState = {
  response: null,
  loading: false,
  error: null,
  messages: [],
};

// Define the async thunk for sending the message to the chatbot
export const chatBot = createAsyncThunk<
  any,
  { prompt: any; productId?: number | string | null; userId?: number | string | null }
>(
  "aiChatBot/generateResponse",
  async ({ prompt, productId, userId }, { rejectWithValue }) => {
    try {
      const userText = typeof prompt === "object" 
        ? (prompt.message || prompt.prompt || "") 
        : prompt;

      const response = await api.post("/chat", { message: userText, prompt: userText }, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
        params: {
          userId,
          productId,
        },
      });
      console.log("chatBot response:", productId, response.data);
      const answer = response.data?.answer || response.data?.message || (typeof response.data === 'string' ? response.data : "How can I assist your shopping today?");
      return answer;
    } catch (error: any) {
      console.log("chatBot error:", error.response || error);
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to generate chatbot response"
      );
    }
  }
);

export const askProductQuestion = createAsyncThunk<
  any,
  { productId?: number | string | null; question: string }
>(
  "aiChatBot/askProductQuestion",
  async ({ productId, question }, { rejectWithValue }) => {
    try {
      if (!productId || productId === "undefined" || productId === "null") {
        const response = await api.post("/chat", { message: question, prompt: question }, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("jwt")}`,
          }
        });
        const answer = response.data?.answer || response.data?.message || (typeof response.data === 'string' ? response.data : "How can I assist your shopping today?");
        return answer;
      }

      const response = await api.post<{ answer: string; message?: string }>(
        `/chat/product/${productId}`,
        { question, message: question },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("jwt")}`,
          }
        }
      );
      console.log("chat answer ----- ", response.data);
      return response.data?.answer || response.data?.message || "I am here to help you!";
    } catch (error: any) {
      console.log("askProductQuestion error --- ", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "I'm experiencing a brief connection issue. Please try asking again in a moment.";
      return rejectWithValue(message);
    }
  }
);

// Create the slice
const aiChatBotSlice = createSlice({
  name: "aiChatBot",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(chatBot.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        const { prompt } = action.meta.arg;
        const text = typeof prompt === "object" ? (prompt.message || prompt.prompt || "") : prompt;
        state.messages.push({ role: "user", message: text });
      })
      .addCase(chatBot.fulfilled, (state, action) => {
        state.loading = false;
        state.response = action.payload;
        state.messages.push({ role: "res", message: action.payload });
      })
      .addCase(chatBot.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        const fallbackMsg = (action.payload as string) || "I'm having a little trouble connecting right now, please try again in a moment!";
        state.messages.push({ role: "res", message: fallbackMsg });
      })
      .addCase(askProductQuestion.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.messages.push({ role: "user", message: action.meta.arg.question });
      })
      .addCase(askProductQuestion.fulfilled, (state, action) => {
        state.loading = false;
        state.messages.push({ role: "res", message: action.payload });
      })
      .addCase(askProductQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        const fallbackMsg = (action.payload as string) || "I'm having a little trouble retrieving details right now, please try again in a moment!";
        state.messages.push({ role: "res", message: fallbackMsg });
      });
  },
});

// Export the reducer
export default aiChatBotSlice.reducer;
