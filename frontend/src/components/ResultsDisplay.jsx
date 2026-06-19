export default function ResultsDisplay({ result }) {
  if (!result) return null;

  if (result.type === "manual") return <ManualResult data={result.data} />;
  if (result.type === "csv") return <CsvResults data={result.data} />;
  return null;
}

/* ------------------------------------------------------------------ */
/* Manual — single transaction result                                 */
/* ------------------------------------------------------------------ */
function ManualResult({ data }) {
  const isFraud = data.prediction === "Fraud";

  return (
    <div className="animate-fadeInUp space-y-4">
      {/* Verdict card */}
      <div
        className={`rounded-2xl border p-6 ${
          isFraud
            ? "border-fraud/30 bg-fraud-bg"
            : "border-safe/30 bg-safe-bg"
        }`}
      >
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
          {/* Icon */}
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl ${
              isFraud ? "bg-fraud/15" : "bg-safe/15"
            }`}
          >
            {isFraud ? "🚨" : "✅"}
          </div>

          <div className="flex-1">
            <h3
              className={`text-xl font-bold ${
                isFraud ? "text-fraud" : "text-safe"
              }`}
            >
              {isFraud ? "FRAUD DETECTED" : "NORMAL TRANSACTION"}
            </h3>
            <p className="text-sm text-text-secondary">
              {getInterpretation(data)}
            </p>
          </div>

          {/* Confidence badge */}
          <div
            className={`rounded-xl px-4 py-2 text-center ${
              isFraud ? "bg-fraud/15" : "bg-safe/15"
            }`}
          >
            <div
              className={`text-2xl font-bold ${
                isFraud ? "text-fraud" : "text-safe"
              }`}
            >
              {data.confidence.toFixed(1)}%
            </div>
            <div className="text-[10px] uppercase tracking-widest text-text-muted">
              Confidence
            </div>
          </div>
        </div>
      </div>

      {/* Probability bars */}
      <div className="grid gap-3 sm:grid-cols-2">
        <ProbabilityBar
          label="Fraud Probability"
          value={data.fraud_probability}
          color="fraud"
        />
        <ProbabilityBar
          label="Normal Probability"
          value={data.normal_probability}
          color="safe"
        />
      </div>
    </div>
  );
}

function ProbabilityBar({ label, value, color }) {
  const bg = color === "fraud" ? "bg-fraud" : "bg-safe";
  const bgTrack = color === "fraud" ? "bg-fraud/10" : "bg-safe/10";
  const text = color === "fraud" ? "text-fraud" : "text-safe";

  return (
    <div className="rounded-xl border border-border bg-bg-card p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-text-secondary">{label}</span>
        <span className={`font-semibold ${text}`}>{value.toFixed(2)}%</span>
      </div>
      <div className={`h-2 overflow-hidden rounded-full ${bgTrack}`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${bg}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CSV — batch results                                                */
/* ------------------------------------------------------------------ */
function CsvResults({ data }) {
  const { summary, results } = data;

  return (
    <div className="animate-fadeInUp space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total"
          value={summary.total_transactions}
          accent="accent"
        />
        <StatCard
          label="Fraud"
          value={summary.fraud_detected}
          accent="fraud"
        />
        <StatCard
          label="Normal"
          value={summary.normal_transactions}
          accent="safe"
        />
        <StatCard
          label="Fraud Rate"
          value={`${summary.fraud_percentage.toFixed(2)}%`}
          accent={summary.fraud_percentage > 5 ? "fraud" : "safe"}
        />
      </div>

      {/* Results table */}
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-bg-secondary text-xs uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-4 py-3">Row</th>
                <th className="px-4 py-3">Prediction</th>
                <th className="px-4 py-3 text-right">Fraud %</th>
                <th className="px-4 py-3 text-right">Normal %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {results.map((row) => {
                const isFraud = row.prediction === "Fraud";
                return (
                  <tr
                    key={row.row}
                    className={`transition-base ${
                      isFraud
                        ? "bg-fraud/[0.04] hover:bg-fraud/[0.08]"
                        : "hover:bg-bg-card-hover"
                    }`}
                  >
                    <td className="px-4 py-2.5 font-medium text-text-muted">
                      {row.row}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          isFraud
                            ? "bg-fraud/10 text-fraud"
                            : "bg-safe/10 text-safe"
                        }`}
                      >
                        {isFraud ? "⚠️ Fraud" : "✓ Normal"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-text-muted">
                      {row.fraud_probability.toFixed(2)}%
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-text-muted">
                      {row.normal_probability.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  const colorMap = {
    accent: "text-accent-light border-accent/20",
    fraud: "text-fraud border-fraud/20",
    safe: "text-safe border-safe/20",
  };

  return (
    <div className={`rounded-xl border bg-bg-card p-4 text-center ${colorMap[accent]}`}>
      <div className={`text-2xl font-bold ${colorMap[accent].split(" ")[0]}`}>
        {value}
      </div>
      <div className="mt-1 text-xs text-text-muted">{label}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Interpretation text                                                */
/* ------------------------------------------------------------------ */
function getInterpretation(result) {
  if (result.prediction === "Fraud") {
    if (result.fraud_probability > 90)
      return "High-confidence fraud detection. Immediate action recommended.";
    if (result.fraud_probability > 70)
      return "Moderate-confidence fraud detection. Manual review recommended.";
    return "Low-confidence fraud flag. Consider additional verification.";
  }
  if (result.normal_probability > 95)
    return "High-confidence normal transaction. Safe to proceed.";
  if (result.normal_probability > 80)
    return "Moderate-confidence normal transaction. Generally safe.";
  return "Low-confidence normal classification. Consider monitoring.";
}
