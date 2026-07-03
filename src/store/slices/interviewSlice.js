import { createSlice } from "@reduxjs/toolkit";

const interviewSlice = createSlice({
  name: "interview",
  initialState: {
    upcoming: [],
    completed: [],
    missed: [],
    todaysInterview: null,
    activeInterview: null,
    status: "idle",
    error: null,
  },
  reducers: {
    setActiveInterview: (state, action) => {
      state.activeInterview = action.payload;
    },
    fetchCandidateDashboardRequest: (state) => {
      state.status = "loading";
    },
    fetchCandidateDashboardSuccess: (state, action) => {
      state.status = "succeeded";
      state.upcoming = action.payload.upcoming;
      state.completed = action.payload.completed;
      state.missed = action.payload.missed;
      state.todaysInterview = action.payload.todaysInterview;
    },
    fetchCandidateDashboardFailure: (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    },
    startInterviewRequest: () => {},
    startInterviewSuccess: (state, action) => {
      state.activeInterview = action.payload.interview;
    },
    startInterviewFailure: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setActiveInterview,
  fetchCandidateDashboardRequest,
  fetchCandidateDashboardSuccess,
  fetchCandidateDashboardFailure,
  startInterviewRequest,
  startInterviewSuccess,
  startInterviewFailure,
} = interviewSlice.actions;
export default interviewSlice.reducer;
