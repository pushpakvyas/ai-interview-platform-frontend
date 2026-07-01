import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCandidatesRequest } from "../../store/slices/adminSlice.js";
import BackButton from "../../components/common/BackButton.jsx";
import TableLoadingRow from "../../components/common/TableLoadingRow.jsx";

export default function CandidateList() {
  const dispatch = useDispatch();
  const { candidates, candidatesStatus } = useSelector((s) => s.admin);
  const [search, setSearch] = useState("");

  useEffect(() => { dispatch(fetchCandidatesRequest({ search: search || undefined })); }, [dispatch]);

  const load = () => dispatch(fetchCandidatesRequest({ search: search || undefined }));

  return (
    <div>
      <BackButton to="/admin" />
      <p className="page-title">Candidates</p>
      <p className="page-subtitle">Manage registered candidates</p>
      <div className="search-row">
        <input placeholder="Search by name or email…" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load()} />
        <button className="btn btn-primary" onClick={load}>Search</button>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Email</th><th>Technologies</th><th>Exp</th><th>Company</th><th>Status</th></tr></thead>
          <tbody>
            {candidatesStatus === "loading" ? <TableLoadingRow colSpan={6} />
              : candidates.length === 0 ? <tr><td colSpan={6} className="loading">No candidates found</td></tr>
              : candidates.map(c => (
                <tr key={c._id}>
                  <td><strong>{c.firstName} {c.lastName}</strong></td>
                  <td className="muted">{c.email}</td>
                  <td>{c.technology?.join(", ") || "—"}</td>
                  <td>{c.experience} yrs</td>
                  <td>{c.currentCompany || "—"}</td>
                  <td><span className={`badge ${c.isActive?"badge-completed":"badge-cancelled"}`}>{c.isActive?"Active":"Inactive"}</span></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
