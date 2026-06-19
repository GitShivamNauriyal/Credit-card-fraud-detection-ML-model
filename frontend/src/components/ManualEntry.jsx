import { useState } from "react";
import { predictManual } from "../api/predict";

const V_FIELDS = Array.from({ length: 28 }, (_, i) => `v${i + 1}`);

export default function ManualEntry({ onResult, onError, setLoading }) {
  const [form, setForm] = useState(() => {
    const init = { time: "0", amount: "" };
    V_FIELDS.forEach((k) => (init[k] = "0"));
    return init;
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount) {
      onError("Please enter a transaction amount.");
      return;
    }
    setLoading(true);
    onResult(null);
    try {
      const result = await predictManual(form);
      onResult({ type: "manual", data: result });
    } catch (err) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    const cleared = { time: "0", amount: "" };
    V_FIELDS.forEach((k) => (cleared[k] = "0"));
    setForm(cleared);
    onResult(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fadeInUp">
      {/* Time & Amount — prominent fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField
          id="time"
          label="Time (seconds)"
          value={form.time}
          onChange={handleChange}
          placeholder="0"
        />
        <InputField
          id="amount"
          label="Amount ($)"
          value={form.amount}
          onChange={handleChange}
          placeholder="149.62"
          required
        />
      </div>

      {/* PCA Features */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">
          PCA Features (V1 – V28)
        </h3>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7 lg:grid-cols-7">
          {V_FIELDS.map((key) => (
            <div key={key} className="flex flex-col gap-1">
              <label
                htmlFor={key}
                className="text-[11px] font-medium uppercase text-text-muted"
              >
                {key.toUpperCase()}
              </label>
              <input
                type="number"
                id={key}
                name={key}
                step="any"
                value={form[key]}
                onChange={handleChange}
                className="w-full rounded-lg border border-border bg-bg-input px-2 py-1.5 text-xs text-text-primary transition-base placeholder:text-text-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
        <button
          type="submit"
          id="predict-manual-btn"
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent-light px-8 py-3 font-semibold text-white shadow-lg shadow-accent/20 transition-base hover:shadow-xl hover:shadow-accent/30 hover:-translate-y-0.5 active:translate-y-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
          Analyze Transaction
        </button>
        <button
          type="button"
          onClick={handleClear}
          id="clear-form-btn"
          className="rounded-xl border border-border bg-bg-card px-8 py-3 font-semibold text-text-secondary transition-base hover:border-fraud/50 hover:bg-fraud/5 hover:text-fraud"
        >
          Clear
        </button>
      </div>
    </form>
  );
}

function InputField({ id, label, value, onChange, placeholder, required }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text-secondary">
        {label}
      </label>
      <input
        type="number"
        id={id}
        name={id}
        step="any"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="rounded-xl border border-border bg-bg-input px-4 py-3 text-text-primary transition-base placeholder:text-text-muted/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
    </div>
  );
}
