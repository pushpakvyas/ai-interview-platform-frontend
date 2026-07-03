import { call, put, takeLatest } from "redux-saga/effects";
import apiClient from "../../api/axiosClient.js";
import {
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
} from "../slices/jobRoleSlice.js";

function* fetchJobRolesWorker() {
  try {
    const { data } = yield call(apiClient.get, "/job-roles");
    yield put(fetchJobRolesSuccess(data));
  } catch (err) {
    yield put(fetchJobRolesFailure(err.response?.data?.message));
  }
}

function* createJobRoleWorker(action) {
  try {
    const { data } = yield call(apiClient.post, "/job-roles", action.payload);
    yield put(createJobRoleSuccess(data));
  } catch (err) {
    yield put(createJobRoleFailure(err.response?.data?.message || "Failed to create job role."));
  }
}

function* updateJobRoleWorker(action) {
  const { id, ...updates } = action.payload;
  try {
    const { data } = yield call(apiClient.put, `/job-roles/${id}`, updates);
    yield put(updateJobRoleSuccess(data));
  } catch (err) {
    yield put(updateJobRoleFailure(err.response?.data?.message || "Failed to update job role."));
  }
}

function* deleteJobRoleWorker(action) {
  const id = action.payload;
  try {
    yield call(apiClient.delete, `/job-roles/${id}`);
    yield put(deleteJobRoleSuccess(id));
  } catch (err) {
    yield put(deleteJobRoleFailure(err.response?.data?.message || "Failed to delete job role."));
  }
}

export default function* jobRoleSaga() {
  yield takeLatest(fetchJobRolesRequest.type, fetchJobRolesWorker);
  yield takeLatest(createJobRoleRequest.type, createJobRoleWorker);
  yield takeLatest(updateJobRoleRequest.type, updateJobRoleWorker);
  yield takeLatest(deleteJobRoleRequest.type, deleteJobRoleWorker);
}
