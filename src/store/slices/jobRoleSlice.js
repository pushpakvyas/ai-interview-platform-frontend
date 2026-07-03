import { createSlice } from "@reduxjs/toolkit";

const jobRoleSlice = createSlice({
  name: "jobRole",
  initialState: {
    items: [],
    status: "idle",
    error: null,
    mutationStatus: "idle", // idle | loading | succeeded | failed
    mutationError: null,
  },
  reducers: {
    fetchJobRolesRequest: (state) => {
      state.status = "loading";
    },
    fetchJobRolesSuccess: (state, action) => {
      state.status = "succeeded";
      state.items = action.payload.jobRoles;
    },
    fetchJobRolesFailure: (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    },
    createJobRoleRequest: (state) => {
      state.mutationStatus = "loading";
      state.mutationError = null;
    },
    createJobRoleSuccess: (state, action) => {
      state.mutationStatus = "succeeded";
      state.items.push(action.payload.jobRole);
    },
    createJobRoleFailure: (state, action) => {
      state.mutationStatus = "failed";
      state.mutationError = action.payload;
    },
    updateJobRoleRequest: (state) => {
      state.mutationStatus = "loading";
      state.mutationError = null;
    },
    updateJobRoleSuccess: (state, action) => {
      state.mutationStatus = "succeeded";
      state.items = state.items.map((r) => (r._id === action.payload.jobRole._id ? action.payload.jobRole : r));
    },
    updateJobRoleFailure: (state, action) => {
      state.mutationStatus = "failed";
      state.mutationError = action.payload;
    },
    deleteJobRoleRequest: (state) => {
      state.mutationStatus = "loading";
      state.mutationError = null;
    },
    deleteJobRoleSuccess: (state, action) => {
      state.mutationStatus = "succeeded";
      state.items = state.items.filter((r) => r._id !== action.payload);
    },
    deleteJobRoleFailure: (state, action) => {
      state.mutationStatus = "failed";
      state.mutationError = action.payload;
    },
  },
});

export const {
  fetchJobRolesRequest,
  fetchJobRolesSuccess,
  fetchJobRolesFailure,
  createJobRoleRequest,
  createJobRoleSuccess,
  createJobRoleFailure,
  updateJobRoleRequest,
  updateJobRoleSuccess,
  updateJobRoleFailure,
  deleteJobRoleRequest,
  deleteJobRoleSuccess,
  deleteJobRoleFailure,
} = jobRoleSlice.actions;
export default jobRoleSlice.reducer;
