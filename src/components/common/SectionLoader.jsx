import Spinner from "./Spinner.jsx";

export default function SectionLoader({ label = "Loading…" }) {
  return (
    <div className="section-loader">
      <Spinner size={20} />
      <span>{label}</span>
    </div>
  );
}
