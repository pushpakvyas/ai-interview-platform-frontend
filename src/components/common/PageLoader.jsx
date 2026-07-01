import Spinner from "./Spinner.jsx";

export default function PageLoader({ label = "Loading…" }) {
  return (
    <div className="page-loader">
      <Spinner size={32} />
      <p>{label}</p>
    </div>
  );
}
