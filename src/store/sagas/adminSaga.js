import { call, put, takeLatest } from "redux-saga/effects";
import apiClient from "../../api/axiosClient.js";
import {
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
  cancelInterviewRequest,
  cancelInterviewSuccess,
  cancelInterviewFailure,
} from "../slices/adminSlice.js";

function* fetchStatsWorker() {
  try {
    const { data } = yield call(apiClient.get, "/admin/dashboard");
    yield put(fetchStatsSuccess(data));
  } catch {
    yield put(fetchStatsFailure());
  }
}

function* fetchCandidatesWorker(action) {
  try {
    const { data } = yield call(apiClient.get, "/admin/candidates", { params: action.payload });
    yield put(fetchCandidatesSuccess(data));
  } catch {
    yield put(fetchCandidatesFailure());
  }
}

function* fetchInterviewsWorker(action) {
  try {
    const { data } = yield call(apiClient.get, "/admin/interviews", { params: action.payload });
    yield put(fetchInterviewsSuccess(data));
  } catch {
    yield put(fetchInterviewsFailure());
  }
}

function* scheduleInterviewWorker(action) {
  try {
    yield call(apiClient.post, "/interviews", action.payload);
    yield put(scheduleInterviewSuccess());
  } catch (err) {
    yield put(scheduleInterviewFailure(err.response?.data?.message || "Failed to schedule interview."));
  }
}

function* cancelInterviewWorker(action) {
  const { id, reason } = action.payload;
  try {
    yield call(apiClient.put, `/interviews/${id}/cancel`, { reason });
    yield put(cancelInterviewSuccess());
    yield put(fetchInterviewsRequest());
  } catch (err) {
    yield put(cancelInterviewFailure(err.response?.data?.message || "Failed to cancel interview."));
  }
}

export default function* adminSaga() {
  yield takeLatest(fetchStatsRequest.type, fetchStatsWorker);
  yield takeLatest(fetchCandidatesRequest.type, fetchCandidatesWorker);
  yield takeLatest(fetchInterviewsRequest.type, fetchInterviewsWorker);
  yield takeLatest(scheduleInterviewRequest.type, scheduleInterviewWorker);
  yield takeLatest(cancelInterviewRequest.type, cancelInterviewWorker);
}
