import { call, put, takeLatest } from "redux-saga/effects";
import apiClient from "../../api/axiosClient.js";
import {
  fetchSkillsRequest,
  fetchSkillsSuccess,
  fetchSkillsFailure,
  createSkillRequest,
  createSkillSuccess,
  createSkillFailure,
  updateSkillRequest,
  updateSkillSuccess,
  updateSkillFailure,
  deleteSkillRequest,
  deleteSkillSuccess,
  deleteSkillFailure,
} from "../slices/skillSlice.js";

function* fetchSkillsWorker() {
  try {
    const { data } = yield call(apiClient.get, "/skills");
    yield put(fetchSkillsSuccess(data));
  } catch (err) {
    yield put(fetchSkillsFailure(err.response?.data?.message));
  }
}

function* createSkillWorker(action) {
  try {
    const { data } = yield call(apiClient.post, "/skills", action.payload);
    yield put(createSkillSuccess(data));
  } catch (err) {
    yield put(createSkillFailure(err.response?.data?.message || "Failed to create skill."));
  }
}

function* updateSkillWorker(action) {
  const { id, ...updates } = action.payload;
  try {
    const { data } = yield call(apiClient.put, `/skills/${id}`, updates);
    yield put(updateSkillSuccess(data));
  } catch (err) {
    yield put(updateSkillFailure(err.response?.data?.message || "Failed to update skill."));
  }
}

function* deleteSkillWorker(action) {
  const id = action.payload;
  try {
    yield call(apiClient.delete, `/skills/${id}`);
    yield put(deleteSkillSuccess(id));
  } catch (err) {
    yield put(deleteSkillFailure(err.response?.data?.message || "Failed to delete skill."));
  }
}

export default function* skillSaga() {
  yield takeLatest(fetchSkillsRequest.type, fetchSkillsWorker);
  yield takeLatest(createSkillRequest.type, createSkillWorker);
  yield takeLatest(updateSkillRequest.type, updateSkillWorker);
  yield takeLatest(deleteSkillRequest.type, deleteSkillWorker);
}
