import { call, put, takeLatest } from "redux-saga/effects";
import apiClient from "../../api/axiosClient.js";
import {
  fetchCandidateDashboardRequest,
  fetchCandidateDashboardSuccess,
  fetchCandidateDashboardFailure,
  startInterviewRequest,
  startInterviewSuccess,
  startInterviewFailure,
} from "../slices/interviewSlice.js";

function* fetchCandidateDashboardWorker() {
  try {
    const { data } = yield call(apiClient.get, "/candidate/dashboard");
    yield put(fetchCandidateDashboardSuccess(data));
  } catch (err) {
    yield put(fetchCandidateDashboardFailure(err.response?.data?.message));
  }
}

function* startInterviewWorker(action) {
  try {
    const { data } = yield call(apiClient.post, `/interviews/${action.payload}/start`);
    yield put(startInterviewSuccess(data));
  } catch (err) {
    yield put(startInterviewFailure(err.response?.data?.message));
  }
}

export default function* interviewSaga() {
  yield takeLatest(fetchCandidateDashboardRequest.type, fetchCandidateDashboardWorker);
  yield takeLatest(startInterviewRequest.type, startInterviewWorker);
}
