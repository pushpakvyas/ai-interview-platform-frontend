import { call, put, takeLatest } from "redux-saga/effects";
import apiClient from "../../api/axiosClient.js";
import {
  fetchNotificationsRequest,
  fetchNotificationsSuccess,
  fetchNotificationsFailure,
} from "../slices/notificationSlice.js";

function* fetchNotificationsWorker() {
  try {
    const { data } = yield call(apiClient.get, "/notifications");
    yield put(fetchNotificationsSuccess(data));
  } catch (err) {
    yield put(fetchNotificationsFailure(err.response?.data?.message));
  }
}

export default function* notificationSaga() {
  yield takeLatest(fetchNotificationsRequest.type, fetchNotificationsWorker);
}
