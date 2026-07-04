import { createSlice } from "@reduxjs/toolkit";

const templateSlice = createSlice({
  name: "template",
  initialState: {
    items: [],
    status: "idle",
    error: null,
    mutationStatus: "idle", // idle | loading | succeeded | failed
    mutationError: null,
  },
  reducers: {
    fetchTemplatesRequest: (state) => {
      state.status = "loading";
    },
    fetchTemplatesSuccess: (state, action) => {
      state.status = "succeeded";
      state.items = action.payload.templates;
    },
    fetchTemplatesFailure: (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    },
    createTemplateRequest: (state) => {
      state.mutationStatus = "loading";
      state.mutationError = null;
    },
    createTemplateSuccess: (state, action) => {
      state.mutationStatus = "succeeded";
      state.items.push(action.payload.template);
    },
    createTemplateFailure: (state, action) => {
      state.mutationStatus = "failed";
      state.mutationError = action.payload;
    },
    updateTemplateRequest: (state) => {
      state.mutationStatus = "loading";
      state.mutationError = null;
    },
    updateTemplateSuccess: (state, action) => {
      state.mutationStatus = "succeeded";
      const idx = state.items.findIndex((t) => t._id === action.payload.template._id);
      if (idx !== -1) state.items[idx] = action.payload.template;
    },
    updateTemplateFailure: (state, action) => {
      state.mutationStatus = "failed";
      state.mutationError = action.payload;
    },
    deleteTemplateRequest: (state) => {
      state.mutationStatus = "loading";
      state.mutationError = null;
    },
    deleteTemplateSuccess: (state, action) => {
      state.mutationStatus = "succeeded";
      state.items = state.items.filter((t) => t._id !== action.payload);
    },
    deleteTemplateFailure: (state, action) => {
      state.mutationStatus = "failed";
      state.mutationError = action.payload;
    },
    resetTemplateMutationStatus: (state) => {
      state.mutationStatus = "idle";
      state.mutationError = null;
    },
  },
});

export const {
  fetchTemplatesRequest,
  fetchTemplatesSuccess,
  fetchTemplatesFailure,
  createTemplateRequest,
  createTemplateSuccess,
  createTemplateFailure,
  updateTemplateRequest,
  updateTemplateSuccess,
  updateTemplateFailure,
  deleteTemplateRequest,
  deleteTemplateSuccess,
  deleteTemplateFailure,
  resetTemplateMutationStatus,
} = templateSlice.actions;
export default templateSlice.reducer;