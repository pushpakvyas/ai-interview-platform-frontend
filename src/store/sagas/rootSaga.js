import { all } from "redux-saga/effects";
import authSaga from "./authSaga.js";
import interviewSaga from "./interviewSaga.js";
import notificationSaga from "./notificationSaga.js";
import templateSaga from "./templateSaga.js";
import jobRoleSaga from "./jobRoleSaga.js";
import skillSaga from "./skillSaga.js";
import adminSaga from "./adminSaga.js";

export default function* rootSaga() {
  yield all([authSaga(), interviewSaga(), notificationSaga(), templateSaga(), jobRoleSaga(), skillSaga(), adminSaga()]);
}
