import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface SharedReport {
  _id: string;
  title: string;
  createdAt: string;
  aiSummary: string;
  originalFileUrl: string;
}

interface SharedReportData {
  expiresAt: string;
  reports: SharedReport[];
}

interface ErrorBody {
  error?: string;
}

export default function SharedReportView() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<SharedReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch(`/api/shares/public/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const body: ErrorBody = await res.json();
          throw new Error(body.error || "Failed to load report");
        }
        return res.json() as Promise<SharedReportData>;
      })
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "5rem", color: "#94a3b8" }}>
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 420, margin: "5rem auto", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#1e293b", marginBottom: "0.5rem" }}>
          Link unavailable
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.875rem" }}>{error}</p>
        <p style={{ color: "#94a3b8", fontSize: "0.75rem", marginTop: "1rem" }}>
          Ask the patient to send a new share link.
        </p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div style={{ maxWidth: 640, margin: "2.5rem auto", padding: "0 1rem" }}>
      <div
        style={{
          background: "#fffbeb",
          border: "1px solid #fde68a",
          borderRadius: 8,
          padding: "0.5rem 1rem",
          fontSize: "0.875rem",
          color: "#b45309",
          marginBottom: "1.5rem",
        }}
      >
        This link expires on {new Date(data.expiresAt).toLocaleString()}.
      </div>

      {data.reports.map((report) => (
        <div
          key={report._id}
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "1.25rem",
            marginBottom: "1rem",
          }}
        >
          <h2 style={{ fontWeight: 600, color: "#1e293b", marginBottom: "0.25rem" }}>
            {report.title}
          </h2>
          <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.75rem" }}>
            {new Date(report.createdAt).toLocaleDateString()}
          </p>
          <p style={{ fontSize: "0.875rem", color: "#334155", marginBottom: "0.75rem" }}>
            {report.aiSummary}
          </p>
          <a
            href={report.originalFileUrl}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: "0.875rem", color: "#0d9488", fontWeight: 500 }}
          >
            View original document →
          </a>
        </div>
      ))}
    </div>
  );
}