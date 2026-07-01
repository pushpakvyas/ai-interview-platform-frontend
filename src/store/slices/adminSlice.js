import { createSlice } from "@reduxjs/toolkit";

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    stats: null,
    statsStatus: "idle",
    recentInterviews: [],

    candidates: [],
    candidatesStatus: "idle",

    interviews: [],
    interviewsStatus: "idle",

    scheduleStatus: "idle", // idle | loading | succeeded | failed
    scheduleError: null,

    cancelStatus: "idle",
    cancelError: null,
  },
  reducers: {
    fetchStatsRequest: (state) => {
      state.statsStatus = "loading";
    },
    fetchStatsSuccess: (state, action) => {
      state.statsStatus = "succeeded";
      state.stats = action.payload.stats;
      state.recentInterviews = action.payload.recentInterviews;
    },
    fetchStatsFailure: (state) => {
      state.statsStatus = "failed";
    },

    fetchCandidatesRequest: (state) => {
      state.candidatesStatus = "loading";
    },
    fetchCandidatesSuccess: (state, action) => {
      state.candidatesStatus = "succeeded";
      state.candidates = action.payload.candidates;
    },
    fetchCandidatesFailure: (state) => {
      state.candidatesStatus = "failed";
    },

    fetchInterviewsRequest: (state) => {
      state.interviewsStatus = "loading";
    },
    fetchInterviewsSuccess: (state, action) => {
      state.interviewsStatus = "succeeded";
      state.interviews = action.payload.interviews;
    },
    fetchInterviewsFailure: (state) => {
      state.interviewsStatus = "failed";
    },

    scheduleInterviewRequest: (state) => {
      state.scheduleStatus = "loading";
      state.scheduleError = null;
    },
    scheduleInterviewSuccess: (state) => {
      state.scheduleStatus = "succeeded";
    },
    scheduleInterviewFailure: (state, action) => {
      state.scheduleStatus = "failed";
      state.scheduleError = action.payload;
    },
    resetScheduleStatus: (state) => {
      state.scheduleStatus = "idle";
      state.scheduleError = null;
    },

    cancelInterviewRequest: (state) => {
      state.cancelStatus = "loading";
      state.cancelError = null;
    },
    cancelInterviewSuccess: (state) => {
      state.cancelStatus = "succeeded";
    },
    cancelInterviewFailure: (state, action) => {
      state.cancelStatus = "failed";
      state.cancelError = action.payload;
    },
  },
});

export const {
  fetchStatsRequest,
  fetchStatsSuccess,
  fetchStatsFailure,
  fetchCandidatesRequest,
  fetchCandidatesSuccess,
  fetchCandidatesFailure,
  fetchInterviewsRequest,
  fetchInterviewsSuccess,
  fetchInterviewsFailure,
  scheduleInterviewRequest,
  scheduleInterviewSuccess,
  scheduleInterviewFailure,
  resetScheduleStatus,
  cancelInterviewRequest,
  cancelInterviewSuccess,
  cancelInterviewFailure,
} = adminSlice.actions;
export default adminSlice.reducer;
