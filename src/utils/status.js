// Maps an Interview.status enum value to what's shown in the UI. Only
// EXPIRED needs an override today — the background sweep in the backend
// (interviewExpiryService.js) flips overdue/abandoned interviews to EXPIRED,
// which reads better to admins and candidates as "Missed".
const LABELS = { EXPIRED: "Missed" };

export function statusLabel(status) {
  return LABELS[status] || status;
}

export function statusBadgeClass(status) {
  return `badge-${(status || "").toLowerCase()}`;
}
