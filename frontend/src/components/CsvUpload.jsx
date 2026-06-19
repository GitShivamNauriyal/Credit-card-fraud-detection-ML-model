import { useRef, useState, useCallback } from "react";
import { predictCSV } from "../api/predict";

export default function CsvUpload({ onResult, onError, setLoading }) {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (f) => {
    if (f && f.name.toLowerCase().endsWith(".csv")) {
      setFile(f);
    } else if (f) {
      onError("Please select a valid CSV file.");
    }
  };

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      handleFile(dropped);
    },
    [onError]
  );

  const handleSubmit = async () => {
    if (!file) {
      onError("Please select a CSV file first.");
      return;
    }
    setLoading(true);
    onResult(null);
    try {
      const result = await predictCSV(file);
      onResult({ type: "csv", data: result });
    } catch (err) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-fadeInUp">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed p-10 text-center transition-base ${
          dragging
            ? "border-accent bg-accent/5"
            : "border-border hover:border-accent/50 hover:bg-accent/[0.02]"
        }`}
      >
        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-base ${dragging ? "bg-accent/15 text-accent-light" : "bg-bg-card text-text-muted"}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
        </div>

        <div>
          <p className="text-sm font-medium text-text-primary">
            Drop your CSV file here or{" "}
            <span className="text-accent-light underline decoration-accent/30">browse</span>
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Accepts .csv files up to 16 MB
          </p>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>

      {/* Selected file info */}
      {file && (
        <div className="flex items-center gap-3 rounded-xl border border-safe/20 bg-safe-bg px-4 py-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-safe" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          <div className="flex-1 text-sm">
            <span className="font-medium text-safe">{file.name}</span>
            <span className="ml-2 text-text-muted">
              ({(file.size / 1024).toFixed(1)} KB)
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setFile(null); }}
            className="text-text-muted hover:text-fraud transition-base"
          >
            ✕
          </button>
        </div>
      )}

      {/* CSV format info */}
      <div className="rounded-xl border border-warning/20 bg-warning/[0.05] px-4 py-3">
        <p className="text-xs font-medium text-warning">Required CSV Format</p>
        <p className="mt-1 text-xs text-text-muted">
          Columns: <code className="rounded bg-bg-input px-1.5 py-0.5 text-accent-light">Time, V1, V2, ..., V28, Amount</code>
        </p>
        <p className="mt-0.5 text-xs text-text-muted">
          A <code className="rounded bg-bg-input px-1 py-0.5 text-text-muted">Class</code> column is optional and will be ignored.
        </p>
      </div>

      {/* Analyze button */}
      <div className="flex justify-center pt-1">
        <button
          type="button"
          onClick={handleSubmit}
          id="analyze-csv-btn"
          disabled={!file}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent-light px-8 py-3 font-semibold text-white shadow-lg shadow-accent/20 transition-base hover:shadow-xl hover:shadow-accent/30 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5" />
          </svg>
          Analyze CSV
        </button>
      </div>
    </div>
  );
}
