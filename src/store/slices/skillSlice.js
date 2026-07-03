import { createSlice } from "@reduxjs/toolkit";

const skillSlice = createSlice({
  name: "skill",
  initialState: {
    items: [],
    status: "idle",
    error: null,
    mutationStatus: "idle", // idle | loading | succeeded | failed
    mutationError: null,
    lastCreated: null,
  },
  reducers: {
    fetchSkillsRequest: (state) => {
      state.status = "loading";
    },
    fetchSkillsSuccess: (state, action) => {
      state.status = "succeeded";
      state.items = action.payload.skills;
    },
    fetchSkillsFailure: (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    },
    createSkillRequest: (state) => {
      state.mutationStatus = "loading";
      state.mutationError = null;
      state.lastCreated = null;
    },
    createSkillSuccess: (state, action) => {
      state.mutationStatus = "succeeded";
      state.items.push(action.payload.skill);
      state.lastCreated = action.payload.skill;
    },
    createSkillFailure: (state, action) => {
      state.mutationStatus = "failed";
      state.mutationError = action.payload;
    },
    updateSkillRequest: (state) => {
      state.mutationStatus = "loading";
      state.mutationError = null;
    },
    updateSkillSuccess: (state, action) => {
      state.mutationStatus = "succeeded";
      state.items = state.items.map((s) => (s._id === action.payload.skill._id ? action.payload.skill : s));
    },
    updateSkillFailure: (state, action) => {
      state.mutationStatus = "failed";
      state.mutationError = action.payload;
    },
    deleteSkillRequest: (state) => {
      state.mutationStatus = "loading";
      state.mutationError = null;
    },
    deleteSkillSuccess: (state, action) => {
      state.mutationStatus = "succeeded";
      state.items = state.items.filter((s) => s._id !== action.payload);
    },
    deleteSkillFailure: (state, action) => {
      state.mutationStatus = "failed";
      state.mutationError = action.payload;
    },
    resetSkillMutationStatus: (state) => {
      state.mutationStatus = "idle";
      state.mutationError = null;
      state.lastCreated = null;
    },
  },
});

export const {
  fetchSkillsRequest,
  fetchSkillsSuccess,
  fetchSkillsFailure,
  createSkillRequest,
  createSkillSuccess,
  createSkillFailure,
  updateSkillRequest,
  updateSkillSuccess,
  updateSkillFailure,
  deleteSkillRequest,
  deleteSkillSuccess,
  deleteSkillFailure,
  resetSkillMutationStatus,
} = skillSlice.actions;
export default skillSlice.reducer;
