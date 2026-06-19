"""
Test suite for the credit card fraud detection model.

Loads the trained model and scaler, runs predictions on both test CSVs,
and reports accuracy metrics where ground-truth labels are available.
"""

import os
import sys
import pickle

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)

# Paths relative to this script
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
DATA_DIR = os.path.join(ROOT_DIR, "data")

FEATURE_COLUMNS = ["Time"] + [f"V{i}" for i in range(1, 29)] + ["Amount"]


def load_artifacts():
    """Load model and scaler from the backend directory."""
    model_path = os.path.join(BACKEND_DIR, "model.pkl")
    scaler_path = os.path.join(BACKEND_DIR, "scaler.pkl")

    if not os.path.exists(model_path):
        # Fall back to root directory (pre-migration)
        model_path = os.path.join(ROOT_DIR, "model.pkl")
        scaler_path = os.path.join(ROOT_DIR, "scaler.pkl")

    with open(model_path, "rb") as f:
        model = pickle.load(f)
    with open(scaler_path, "rb") as f:
        scaler = pickle.load(f)

    print(f"Loaded model from: {model_path}")
    print(f"Loaded scaler from: {scaler_path}")
    return model, scaler


def predict(model, scaler, features_df):
    """Scale features and return predictions + probabilities."""
    scaled = scaler.transform(features_df)
    predictions = model.predict(scaled)
    probabilities = model.predict_proba(scaled)
    return predictions, probabilities


def test_bigger_csv(model, scaler):
    """
    Test against bigger_test.csv (178 rows, 31 columns including Class).
    Reports full classification metrics.
    """
    csv_path = os.path.join(DATA_DIR, "bigger_test.csv")
    if not os.path.exists(csv_path):
        csv_path = os.path.join(ROOT_DIR, "bigger_test.csv")

    print("\n" + "=" * 70)
    print("TEST: bigger_test.csv (with ground-truth labels)")
    print("=" * 70)

    df = pd.read_csv(csv_path)
    print(f"  Rows: {len(df)}, Columns: {len(df.columns)}")
    print(f"  Columns: {list(df.columns)}")

    # Verify Class column exists for evaluation
    assert "Class" in df.columns, "bigger_test.csv must have a 'Class' column"

    y_true = df["Class"].astype(int).values
    features_df = df[FEATURE_COLUMNS]

    predictions, probabilities = predict(model, scaler, features_df)

    # Metrics
    accuracy = accuracy_score(y_true, predictions)
    precision = precision_score(y_true, predictions, zero_division=0)
    recall = recall_score(y_true, predictions, zero_division=0)
    f1 = f1_score(y_true, predictions, zero_division=0)

    print(f"\n  Accuracy:  {accuracy:.4f} ({accuracy * 100:.2f}%)")
    print(f"  Precision: {precision:.4f} ({precision * 100:.2f}%)")
    print(f"  Recall:    {recall:.4f} ({recall * 100:.2f}%)")
    print(f"  F1-Score:  {f1:.4f} ({f1 * 100:.2f}%)")

    # AUC (only if both classes present)
    if len(np.unique(y_true)) > 1:
        auc = roc_auc_score(y_true, probabilities[:, 1])
        print(f"  AUC-ROC:   {auc:.4f} ({auc * 100:.2f}%)")

    # Confusion matrix
    cm = confusion_matrix(y_true, predictions)
    print(f"\n  Confusion Matrix:")
    print(f"                   Predicted Normal  Predicted Fraud")
    print(f"    Actual Normal:  {cm[0, 0]:>15}  {cm[0, 1]:>15}")
    if cm.shape[0] > 1:
        print(f"    Actual Fraud:   {cm[1, 0]:>15}  {cm[1, 1]:>15}")

    # Distribution
    fraud_count = int(np.sum(predictions))
    print(f"\n  Predictions: {len(predictions) - fraud_count} Normal, {fraud_count} Fraud")
    print(f"  Ground truth: {int(np.sum(y_true == 0))} Normal, {int(np.sum(y_true == 1))} Fraud")

    # Full classification report
    print(f"\n  Classification Report:")
    report = classification_report(y_true, predictions, target_names=["Normal", "Fraud"])
    for line in report.split("\n"):
        print(f"    {line}")

    # Validate probability ranges
    assert probabilities.min() >= 0, "Probabilities must be >= 0"
    assert probabilities.max() <= 1, "Probabilities must be <= 1"
    assert np.allclose(probabilities.sum(axis=1), 1.0), "Probabilities must sum to 1"
    print("\n  [PASS] Probability range validation passed")

    return accuracy, f1


def test_small_csv(model, scaler):
    """
    Test against test.csv (5 rows, 30 columns — no Class column).
    Verifies predictions run without error.
    """
    csv_path = os.path.join(DATA_DIR, "test.csv")
    if not os.path.exists(csv_path):
        csv_path = os.path.join(ROOT_DIR, "test.csv")

    print("\n" + "=" * 70)
    print("TEST: test.csv (no ground-truth labels)")
    print("=" * 70)

    df = pd.read_csv(csv_path)
    print(f"  Rows: {len(df)}, Columns: {len(df.columns)}")

    features_df = df[FEATURE_COLUMNS]
    predictions, probabilities = predict(model, scaler, features_df)

    for i, (pred, prob) in enumerate(zip(predictions, probabilities)):
        label = "Fraud" if int(pred) == 1 else "Normal"
        print(f"  Row {i + 1}: {label} (fraud prob: {prob[1] * 100:.2f}%)")

    assert len(predictions) == len(df), "Prediction count must match row count"
    print(f"\n  [PASS] All {len(df)} rows predicted successfully")


def test_single_transaction(model, scaler):
    """Test a single manually-constructed transaction."""
    print("\n" + "=" * 70)
    print("TEST: Single transaction (manual input simulation)")
    print("=" * 70)

    # All zeros except Amount — should predict Normal
    features = [0.0] * 30
    features[-1] = 50.0  # Amount
    features_df = pd.DataFrame([features], columns=FEATURE_COLUMNS)

    predictions, probabilities = predict(model, scaler, features_df)
    label = "Fraud" if int(predictions[0]) == 1 else "Normal"
    print(f"  All-zeros + $50 Amount -> {label} (fraud prob: {probabilities[0][1] * 100:.2f}%)")
    print("  [PASS] Single transaction prediction completed")


if __name__ == "__main__":
    print("=" * 70)
    print("CREDIT CARD FRAUD DETECTION — MODEL TEST SUITE")
    print("=" * 70)

    model, scaler = load_artifacts()

    accuracy, f1 = test_bigger_csv(model, scaler)
    test_small_csv(model, scaler)
    test_single_transaction(model, scaler)

    print("\n" + "=" * 70)
    print("ALL TESTS PASSED")
    print("=" * 70)

    # Exit with error if accuracy is too low
    if accuracy < 0.80:
        print(f"\n[WARNING] Accuracy ({accuracy:.2f}) is below 80% threshold")
        sys.exit(1)
