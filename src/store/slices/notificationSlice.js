import { createSlice } from "@reduxjs/toolkit";

const notificationSlice = createSlice({
  name: "notification",
  initialState: { items: [], unreadCount: 0, status: "idle", error: null },
  reducers: {
    fetchNotificationsRequest: (state) => {
      state.status = "loading";
    },
    fetchNotificationsSuccess: (state, action) => {
      state.status = "succeeded";
      state.items = action.payload.notifications;
      state.unreadCount = action.payload.unreadCount;
    },
    fetchNotificationsFailure: (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    },
  },
});

export const {
  fetchNotificationsRequest,
  fetchNotificationsSuccess,
  fetchNotificationsFailure,
} = notificationSlice.actions;
export default notificationSlice.reducer;
