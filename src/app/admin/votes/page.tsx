"use client";

import { useEffect, useState } from "react";

const API = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1`;

interface VoteRecord {
  id: string;
  userId: string;
  voteId: string;
  option: string;
  createdAt: string;
}

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("el_pacto_token")}` };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function VotesPage() {
  const [votes, setVotes] = useState<VoteRecord[]>([]);

  useEffect(() => {
    fetch(`${API}/admin/votes`, { headers: authHeader() })
      .then((r) => r.json())
      .then(setVotes)
      .catch(console.error);
  }, []);

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">VOTACIONES <span style={{ color: "#777", fontSize: 16, fontFamily: "var(--font-sans)", fontWeight: 400, letterSpacing: 0 }}>({votes.length})</span></h1>
      </div>

      <div className="admin-card" style={{ overflowX: "auto" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Vote ID</th>
              <th>Usuario ID</th>
              <th>Opción</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {votes.map((v) => (
              <tr key={v.id}>
                <td className="muted" style={{ fontFamily: "monospace", fontSize: 12 }}>{v.voteId?.slice(0, 8)}…</td>
                <td className="muted" style={{ fontFamily: "monospace", fontSize: 12 }}>{v.userId?.slice(0, 8)}…</td>
                <td style={{ fontWeight: 600, color: "#fff" }}>{v.option}</td>
                <td className="muted">{fmtDate(v.createdAt)}</td>
              </tr>
            ))}
            {votes.length === 0 && (
              <tr><td colSpan={4} className="empty">Sin votos registrados todavía</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
