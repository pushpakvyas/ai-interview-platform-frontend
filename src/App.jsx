import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMeRequest } from "./store/slices/authSlice.js";

import Navbar from "./components/common/Navbar.jsx";
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import PageLoader from "./components/common/PageLoader.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

import CandidateDashboard from "./pages/candidate/CandidateDashboard.jsx";
import WelcomeScreen from "./pages/candidate/WelcomeScreen.jsx";
import RulesScreen from "./pages/candidate/RulesScreen.jsx";
import AcknowledgementScreen from "./pages/candidate/AcknowledgementScreen.jsx";
import LiveInterview from "./pages/candidate/LiveInterview.jsx";
import CandidateInterviewReport from "./pages/candidate/InterviewReport.jsx";

import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import CandidateList from "./pages/admin/CandidateList.jsx";
import InterviewList from "./pages/admin/InterviewList.jsx";
import ScheduleInterview from "./pages/admin/ScheduleInterview.jsx";
import TechnologyTemplates from "./pages/admin/TechnologyTemplates.jsx";
import InterviewReport from "./pages/admin/InterviewReport.jsx";

const PUBLIC_PATHS = ["/login", "/register"];

export default function App() {
  const dispatch = useDispatch();
  const { user, initialized } = useSelector((s) => s.auth);
  const location = useLocation();
  const isPublicPath = PUBLIC_PATHS.includes(location.pathname);

  useEffect(() => {
    // Skip the bootstrap check on public auth pages: there's no session to
    // verify there, and firing it unconditionally on every mount used to
    // combine with the interceptor's redirect-on-401 to cause a reload loop
    // for signed-out visitors (see api/axiosClient.js).
    if (!isPublicPath) {
      dispatch(fetchMeRequest());
    }
    // Runs once on mount regardless of whether an accessToken is already in
    // memory: on a hard refresh accessToken is null, but a valid httpOnly
    // refresh cookie may still exist. The axios response interceptor
    // (api/axiosClient.js) transparently exchanges that cookie for a fresh
    // accessToken on the resulting 401 and retries this request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!initialized && !isPublicPath) {
    return <PageLoader label="Loading…" />;
  }

  return (
    <>
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Candidate routes */}
          <Route path="/candidate" element={<ProtectedRoute allowedRoles={["CANDIDATE"]}><CandidateDashboard /></ProtectedRoute>} />
          <Route path="/candidate/interview/:id/welcome" element={<ProtectedRoute allowedRoles={["CANDIDATE"]}><WelcomeScreen /></ProtectedRoute>} />
          <Route path="/candidate/interview/:id/rules" element={<ProtectedRoute allowedRoles={["CANDIDATE"]}><RulesScreen /></ProtectedRoute>} />
          <Route path="/candidate/interview/:id/acknowledge" element={<ProtectedRoute allowedRoles={["CANDIDATE"]}><AcknowledgementScreen /></ProtectedRoute>} />
          <Route path="/candidate/interview/:id/live" element={<ProtectedRoute allowedRoles={["CANDIDATE"]}><LiveInterview /></ProtectedRoute>} />
          <Route path="/candidate/interview/:id/report" element={<ProtectedRoute allowedRoles={["CANDIDATE"]}><CandidateInterviewReport /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/candidates" element={<ProtectedRoute allowedRoles={["ADMIN"]}><CandidateList /></ProtectedRoute>} />
          <Route path="/admin/interviews" element={<ProtectedRoute allowedRoles={["ADMIN"]}><InterviewList /></ProtectedRoute>} />
          <Route path="/admin/schedule" element={<ProtectedRoute allowedRoles={["ADMIN"]}><ScheduleInterview /></ProtectedRoute>} />
          <Route path="/admin/templates" element={<ProtectedRoute allowedRoles={["ADMIN"]}><TechnologyTemplates /></ProtectedRoute>} />
          <Route path="/admin/reports/:id" element={<ProtectedRoute allowedRoles={["ADMIN"]}><InterviewReport /></ProtectedRoute>} />

          <Route
            path="/"
            element={
              user ? <Navigate to={user.roleType === "ADMIN" ? "/admin" : "/candidate"} replace /> : <Navigate to="/login" replace />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
