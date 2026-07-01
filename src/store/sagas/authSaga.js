import { call, put, takeLatest } from "redux-saga/effects";
import apiClient from "../../api/axiosClient.js";
import {
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
} from "../slices/authSlice.js";

function* loginWorker(action) {
  try {
    const { data } = yield call(apiClient.post, "/auth/login", action.payload);
    yield put(loginSuccess(data));
  } catch (err) {
    yield put(loginFailure(err.response?.data?.message || "Login failed"));
  }
}

function* registerWorker(action) {
  try {
    const { data } = yield call(apiClient.post, "/auth/register", action.payload);
    yield put(registerSuccess(data));
  } catch (err) {
    yield put(registerFailure(err.response?.data?.message || "Registration failed"));
  }
}

function* fetchMeWorker() {
  try {
    const { data } = yield call(apiClient.get, "/auth/me");
    yield put(fetchMeSuccess(data));
  } catch (err) {
    yield put(fetchMeFailure(err.response?.data?.message));
  }
}

function* logoutWorker() {
  try {
    yield call(apiClient.post, "/auth/logout");
  } catch {
    // still log out locally even if the server call failed
  } finally {
    yield put(logoutSuccess());
  }
}

export default function* authSaga() {
  yield takeLatest(loginRequest.type, loginWorker);
  yield takeLatest(registerRequest.type, registerWorker);
  yield takeLatest(fetchMeRequest.type, fetchMeWorker);
  yield takeLatest(logoutRequest.type, logoutWorker);
}
