import { useState } from "react";
import Header from "./components/Header";
import ManualEntry from "./components/ManualEntry";
import CsvUpload from "./components/CsvUpload";
import ResultsDisplay from "./components/ResultsDisplay";

const TABS = [
  { id: "manual", label: "Manual Entry", icon: KeyboardIcon },
  { id: "csv", label: "CSV Upload", icon: UploadIcon },
];

export default function App() {
  const [tab, setTab] = useState("manual");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleResult = (r) => {
    setResult(r);
    setError(null);
  };

  const handleError = (msg) => {
    setError(msg);
    setResult(null);
  };

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Tab navigation */}
        <div className="mb-8 flex rounded-2xl border border-border bg-bg-secondary/50 p-1.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setTab(id); setResult(null); setError(null); }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-base ${
                tab === id
                  ? "bg-accent text-white shadow-lg shadow-accent/20"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="glass-card p-6 sm:p-8">
          {tab === "manual" && (
            <ManualEntry
              onResult={handleResult}
              onError={handleError}
              setLoading={setLoading}
            />
          )}
          {tab === "csv" && (
            <CsvUpload
              onResult={handleResult}
              onError={handleError}
              setLoading={setLoading}
            />
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-8 flex flex-col items-center gap-3 py-10">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-border border-t-accent" />
            <p className="text-sm text-text-muted">Analyzing transaction data…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 animate-fadeInUp rounded-xl border border-fraud/30 bg-fraud-bg px-5 py-4">
            <p className="text-sm font-medium text-fraud">
              <span className="mr-1.5">⚠</span> {error}
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-8">
            <h2 className="mb-4 text-center text-lg font-semibold text-text-primary">
              Prediction Results
            </h2>
            <ResultsDisplay result={result} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 text-center text-xs text-text-muted">
        FraudShield &middot; AI-Powered Credit Card Fraud Detection
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Inline SVG icons                                                   */
/* ------------------------------------------------------------------ */
function KeyboardIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  );
}

function UploadIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
  );
}
