import os
import pickle

import numpy as np
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.config["UPLOAD_FOLDER"] = os.path.join(os.path.dirname(__file__), "uploads")
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB

os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

# Feature columns the model expects (30 features: Time + V1-V28 + Amount)
FEATURE_COLUMNS = ["Time"] + [f"V{i}" for i in range(1, 29)] + ["Amount"]

# ---------------------------------------------------------------------------
# Model loading
# ---------------------------------------------------------------------------

def _load_artifact(name: str):
    """Load a pickle artifact from the same directory as this module."""
    path = os.path.join(os.path.dirname(__file__), name)
    with open(path, "rb") as fh:
        return pickle.load(fh)


try:
    model = _load_artifact("model.pkl")
    scaler = _load_artifact("scaler.pkl")
    print("Model and scaler loaded successfully.")
except FileNotFoundError as exc:
    print(f"Model files not found ({exc}). Run train.py or the training notebook first.")
    model = None
    scaler = None

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _require_model():
    """Return an error tuple if the model isn't loaded, else None."""
    if model is None or scaler is None:
        return jsonify({"error": "Model not loaded. Check server logs."}), 503
    return None


def _make_prediction(features_df: pd.DataFrame):
    """Scale features and return (predictions, probabilities) arrays."""
    scaled = scaler.transform(features_df)
    predictions = model.predict(scaled)
    probabilities = model.predict_proba(scaled)
    return predictions, probabilities

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "running",
        "model_loaded": model is not None,
        "scaler_loaded": scaler is not None,
    })


@app.route("/api/predict_manual", methods=["POST"])
def predict_manual():
    """Predict a single transaction from JSON body."""
    err = _require_model()
    if err:
        return err

    try:
        data = request.json
        if not data:
            return jsonify({"error": "Request body must be JSON."}), 400

        # Build feature vector: Time, V1-V28, Amount
        features = [float(data.get("time", 0))]
        for i in range(1, 29):
            features.append(float(data.get(f"v{i}", 0)))
        features.append(float(data.get("amount", 0)))

        features_df = pd.DataFrame([features], columns=FEATURE_COLUMNS)
        predictions, probabilities = _make_prediction(features_df)

        prediction = int(predictions[0])
        prob = probabilities[0]

        return jsonify({
            "prediction": "Fraud" if prediction == 1 else "Normal",
            "confidence": round(float(max(prob)) * 100, 2),
            "fraud_probability": round(float(prob[1]) * 100, 2),
            "normal_probability": round(float(prob[0]) * 100, 2),
        })

    except (ValueError, TypeError) as exc:
        return jsonify({"error": f"Invalid input: {exc}"}), 400
    except Exception as exc:
        return jsonify({"error": f"Server error: {exc}"}), 500


@app.route("/api/predict_csv", methods=["POST"])
def predict_csv():
    """Predict from an uploaded CSV file."""
    err = _require_model()
    if err:
        return err

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected."}), 400

    if not (file.filename and file.filename.lower().endswith(".csv")):
        return jsonify({"error": "Only CSV files are accepted."}), 400

    filepath = os.path.join(
        app.config["UPLOAD_FOLDER"], secure_filename(file.filename)
    )

    try:
        file.save(filepath)
        df = pd.read_csv(filepath)

        # Validate required columns exist
        missing = [c for c in FEATURE_COLUMNS if c not in df.columns]
        if missing:
            return jsonify({"error": f"Missing columns: {missing}"}), 400

        # Strip to feature columns only (ignore Class or any extras)
        df_features = df[FEATURE_COLUMNS]

        if df_features.isnull().any().any():
            return jsonify({
                "error": "CSV contains missing values. Ensure all feature fields are filled."
            }), 400

        predictions, probabilities = _make_prediction(df_features)

        # Per-row results
        results = []
        for i, (pred, prob) in enumerate(zip(predictions, probabilities)):
            results.append({
                "row": i + 1,
                "prediction": "Fraud" if int(pred) == 1 else "Normal",
                "fraud_probability": round(float(prob[1]) * 100, 2),
                "normal_probability": round(float(prob[0]) * 100, 2),
            })

        total = len(predictions)
        fraud_count = int(np.sum(predictions))

        summary = {
            "total_transactions": total,
            "fraud_detected": fraud_count,
            "normal_transactions": total - fraud_count,
            "fraud_percentage": round(fraud_count / total * 100, 2) if total else 0.0,
        }

        return jsonify({"results": results, "summary": summary})

    except Exception as exc:
        return jsonify({"error": f"Processing error: {exc}"}), 500

    finally:
        # Always clean up the uploaded file
        if os.path.exists(filepath):
            os.remove(filepath)


if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(debug=debug, host="0.0.0.0", port=5000)
