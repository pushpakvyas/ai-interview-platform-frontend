import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    accessToken: null,
    status: "idle", // idle | loading | succeeded | failed
    error: null,
    initialized: false, // becomes true once the initial fetchMe bootstrap settles
  },
  reducers: {
    loginRequest: (state) => {
      state.status = "loading";
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.status = "succeeded";
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.initialized = true;
    },
    loginFailure: (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    },
    registerRequest: (state) => {
      state.status = "loading";
      state.error = null;
    },
    registerSuccess: (state, action) => {
      state.status = "succeeded";
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.initialized = true;
    },
    registerFailure: (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    },
    fetchMeRequest: () => {},
    fetchMeSuccess: (state, action) => {
      state.user = action.payload.user;
      state.initialized = true;
    },
    fetchMeFailure: (state) => {
      state.user = null;
      state.accessToken = null;
      state.initialized = true;
    },
    logoutRequest: () => {},
    logoutSuccess: (state) => {
      state.user = null;
      state.accessToken = null;
      state.status = "idle";
      state.error = null;
    },
    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
    },
    logoutLocal: (state) => {
      state.user = null;
      state.accessToken = null;
    },
  },
});

export const {
  loginRequest,
  loginSuccess,
  loginFailure,
  registerRequest,
  registerSuccess,
  registerFailure,
  fetchMeRequest,
  fetchMeSuccess,
  fetchMeFailure,
  logoutRequest,
  logoutSuccess,
  setAccessToken,
  logoutLocal,
} = authSlice.actions;
export default authSlice.reducer;
