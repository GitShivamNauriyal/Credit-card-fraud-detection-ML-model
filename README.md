# Credit Card Fraud Detection System

A full-stack machine learning application for detecting fraudulent credit card transactions. Uses a hybrid ensemble model (Random Forest + XGBoost) trained with SMOTE to handle class imbalance, served via a Flask API and a React frontend.

## Model Performance

| Model               | Accuracy | Precision | Recall  | F1-Score | AUC     |
| ------------------- | -------- | --------- | ------- | -------- | ------- |
| Logistic Regression  | 99.95%   | 88.46%    | 61.22%  | 72.48%   | 98.67%  |
| Random Forest        | 99.96%   | 90.32%    | 75.51%  | 82.26%   | 99.23%  |
| XGBoost              | 99.96%   | 91.67%    | 73.47%  | 81.58%   | 99.18%  |
| **Hybrid (RF+XGB)**  | **99.97%** | **92.86%** | **78.57%** | **85.11%** | **99.34%** |

The deployed model is the **Hybrid (RF + XGB)** voting classifier, which achieved 100% accuracy on the included test set (`data/bigger_test.csv`, 177 transactions).

## Project Structure

```
Credit_Card_Fraud_Detection_Model/
├── backend/                  # Flask REST API
│   ├── app.py                # API server (endpoints under /api)
│   ├── requirements.txt      # Python dependencies
│   ├── model.pkl             # Trained hybrid model (generate from notebook)
│   ├── scaler.pkl            # StandardScaler (generate from notebook)
│   └── uploads/              # Temp directory for CSV uploads
│
├── frontend/                 # React + Vite + TailwindCSS v4
│   ├── src/
│   │   ├── App.jsx           # Main application shell
│   │   ├── index.css         # Global styles + TailwindCSS
│   │   ├── main.jsx          # React entry point
│   │   ├── api/
│   │   │   └── predict.js    # API client
│   │   └── components/
│   │       ├── Header.jsx
│   │       ├── ManualEntry.jsx
│   │       ├── CsvUpload.jsx
│   │       └── ResultsDisplay.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js        # Dev proxy to Flask backend
│
├── tests/
│   └── test_model.py         # Model validation test suite
│
├── data/
│   ├── bigger_test.csv       # 177-row test set with Class labels (31 cols)
│   └── test.csv              # 5-row test set without Class labels (30 cols)
│
├── Model.ipynb               # Training notebook (Jupyter)
├── .gitignore
└── README.md
```

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- The Kaggle dataset (for retraining only): [Credit Card Fraud Detection](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud)

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The API starts at `http://localhost:5000`. Set `FLASK_DEBUG=1` for debug mode.

> **Note:** The pre-trained model artifacts `model.pkl` and `scaler.pkl` are tracked in Git under the `backend/` directory for immediate out-of-the-box run. If you wish to retrain or update the model, you can run all cells in `Model.ipynb` (requires downloading `creditcard.csv` from Kaggle and placing it in the project root).

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend starts at `http://localhost:3000` and proxies `/api` requests to the Flask backend.

### 3. Run Tests

```bash
python tests/test_model.py
```

## API Endpoints

| Method | Endpoint              | Description                        |
| ------ | --------------------- | ---------------------------------- |
| GET    | `/api/health`         | Health check and model status      |
| POST   | `/api/predict_manual` | Predict a single transaction (JSON)|
| POST   | `/api/predict_csv`    | Predict from uploaded CSV file     |

### Manual Prediction (JSON body)

```json
{
  "time": 0,
  "v1": -1.359, "v2": -0.072, "...": "...", "v28": -0.021,
  "amount": 149.62
}
```

### CSV Upload

Send a `multipart/form-data` POST with a `file` field containing a CSV. Required columns:

```
Time, V1, V2, V3, ..., V28, Amount
```

A `Class` column is optional and will be ignored during prediction.

## ML Pipeline

### Data Preprocessing
- **Feature Scaling**: StandardScaler normalization
- **Class Balancing**: SMOTE (Synthetic Minority Oversampling Technique)

### Models Trained
- **Logistic Regression**: Linear classification baseline
- **Random Forest**: 100-estimator ensemble
- **XGBoost**: Gradient boosting with optimized hyperparameters
- **Hybrid (deployed)**: Soft-voting classifier combining RF + XGBoost

### Evaluation
- Classification metrics: Accuracy, Precision, Recall, F1-Score
- Probability metrics: ROC-AUC curves
- Confusion matrices per model

## Usage

### Manual Entry
Enter transaction features (Time, V1–V28, Amount) in the frontend form. The model returns a fraud/normal prediction with confidence scores.

### CSV Batch Analysis
Upload a CSV file with 30 feature columns. The system predicts each row and displays summary statistics (fraud count, fraud rate) along with per-row results.

## Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| ML       | scikit-learn, XGBoost, imbalanced-learn |
| Backend  | Flask, flask-cors, pandas, numpy    |
| Frontend | React 19, Vite, TailwindCSS v4      |
| Training | Jupyter Notebook                    |

## Dataset

The model is trained on the [Credit Card Fraud Detection dataset from Kaggle](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud) (284,807 transactions, 492 frauds, 0.172% fraud rate). Features V1–V28 are PCA-transformed for confidentiality.