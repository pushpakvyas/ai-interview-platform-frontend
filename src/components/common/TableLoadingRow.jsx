import Spinner from "./Spinner.jsx";

export default function TableLoadingRow({ colSpan, label = "Loading…" }) {
  return (
    <tr>
      <td colSpan={colSpan} className="loading">
        <span className="row-loader"><Spinner size={14} /> {label}</span>
      </td>
    </tr>
  );
}
