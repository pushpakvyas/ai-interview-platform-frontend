import { call, put, takeLatest } from "redux-saga/effects";
import apiClient from "../../api/axiosClient.js";
import {
  fetchTemplatesRequest,
  fetchTemplatesSuccess,
  fetchTemplatesFailure,
  createTemplateRequest,
  createTemplateSuccess,
  createTemplateFailure,
  updateTemplateRequest,
  updateTemplateSuccess,
  updateTemplateFailure,
  deleteTemplateRequest,
  deleteTemplateSuccess,
  deleteTemplateFailure,
} from "../slices/templateSlice.js";

function* fetchTemplatesWorker() {
  try {
    const { data } = yield call(apiClient.get, "/templates");
    yield put(fetchTemplatesSuccess(data));
  } catch (err) {
    yield put(fetchTemplatesFailure(err.response?.data?.message));
  }
}

function* createTemplateWorker(action) {
  try {
    const { data } = yield call(apiClient.post, "/templates", action.payload);
    yield put(createTemplateSuccess(data));
  } catch (err) {
    yield put(createTemplateFailure(err.response?.data?.message || "Failed to create template."));
  }
}

function* updateTemplateWorker(action) {
  const { id, ...body } = action.payload;
  try {
    const { data } = yield call(apiClient.put, `/templates/${id}`, body);
    yield put(updateTemplateSuccess(data));
  } catch (err) {
    yield put(updateTemplateFailure(err.response?.data?.message || "Failed to update template."));
  }
}

function* deleteTemplateWorker(action) {
  const id = action.payload;
  try {
    yield call(apiClient.delete, `/templates/${id}`);
    yield put(deleteTemplateSuccess(id));
  } catch (err) {
    yield put(deleteTemplateFailure(err.response?.data?.message || "Failed to delete template."));
  }
}

export default function* templateSaga() {
  yield takeLatest(fetchTemplatesRequest.type, fetchTemplatesWorker);
  yield takeLatest(createTemplateRequest.type, createTemplateWorker);
  yield takeLatest(updateTemplateRequest.type, updateTemplateWorker);
  yield takeLatest(deleteTemplateRequest.type, deleteTemplateWorker);
}