const API_BASE = "/api";

/**
 * Predict a single transaction from manual input values.
 * @param {Object} data – key/value pairs: time, v1..v28, amount
 * @returns {Promise<Object>} prediction result
 */
export async function predictManual(data) {
  const res = await fetch(`${API_BASE}/predict_manual`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error || `Server error (${res.status})`);
  }
  return json;
}

/**
 * Predict from an uploaded CSV file.
 * @param {File} file – CSV file
 * @returns {Promise<Object>} results + summary
 */
export async function predictCSV(file) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE}/predict_csv`, {
    method: "POST",
    body: form,
  });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error || `Server error (${res.status})`);
  }
  return json;
}

/**
 * Check backend health status.
 * @returns {Promise<Object>}
 */
export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}
