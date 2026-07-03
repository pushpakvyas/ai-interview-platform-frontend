import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import authReducer from "./slices/authSlice.js";
import interviewReducer from "./slices/interviewSlice.js";
import notificationReducer from "./slices/notificationSlice.js";
import templateReducer from "./slices/templateSlice.js";
import jobRoleReducer from "./slices/jobRoleSlice.js";
import skillReducer from "./slices/skillSlice.js";
import adminReducer from "./slices/adminSlice.js";
import { injectStore } from "../api/axiosClient.js";
import rootSaga from "./sagas/rootSaga.js";

const sagaMiddleware = createSagaMiddleware();

const store = configureStore({
  reducer: {
    auth: authReducer,
    interview: interviewReducer,
    notification: notificationReducer,
    template: templateReducer,
    jobRole: jobRoleReducer,
    skill: skillReducer,
    admin: adminReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

injectStore(store);

export default store;
