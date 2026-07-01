import { useNavigate } from "react-router-dom";

export default function BackButton({ to, label = "← Back" }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      style={{ marginBottom: "1rem" }}
      onClick={() => (to ? navigate(to) : navigate(-1))}
    >
      {label}
    </button>
  );
}
