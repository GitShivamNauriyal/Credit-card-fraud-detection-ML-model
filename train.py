import os
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                             f1_score, roc_auc_score, confusion_matrix)
# pyrefly: ignore [missing-import]
from imblearn.over_sampling import SMOTE

def train_and_evaluate():
    print("Loading dataset from data/creditcard.csv...")
    df = pd.read_csv('data/creditcard.csv')
    print(f"Dataset shape: {df.shape}")
    
    # Split features and label
    X = df.drop(['Class'], axis=1)
    y = df['Class']
    
    # Split train and test sets
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"Training set shape: {X_train.shape}")
    print(f"Test set shape: {X_test.shape}")
    print(f"Fraud rate in original training set: {y_train.mean()*100:.4f}%")
    
    # Apply SMOTE to handle class imbalance
    print("Applying SMOTE...")
    smote = SMOTE(random_state=42)
    X_train_smote, y_train_smote = smote.fit_resample(X_train, y_train)
    print(f"Balanced training set shape: {X_train_smote.shape}")
    
    # Scale features
    print("Scaling features...")
    scaler = StandardScaler()
    X_train_smote_scaled = scaler.fit_transform(X_train_smote)
    X_test_scaled = scaler.transform(X_test)
    
    models = {
        'Logistic Regression': LogisticRegression(random_state=42, max_iter=1000),
        'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1),
        'XGBoost': XGBClassifier(random_state=42, eval_metric='logloss', n_jobs=-1)
    }
    
    model_results = {}
    
    print("\nTraining individual models...")
    for name, model in models.items():
        print(f"Training {name}...")
        model.fit(X_train_smote_scaled, y_train_smote)
        
        y_pred = model.predict(X_test_scaled)
        y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]
        
        model_results[name] = {
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred),
            'recall': recall_score(y_test, y_pred),
            'f1_score': f1_score(y_test, y_pred),
            'auc': roc_auc_score(y_test, y_pred_proba),
            'predictions': y_pred
        }
        print(f"{name} trained. Accuracy: {model_results[name]['accuracy']:.4f}, Recall: {model_results[name]['recall']:.4f}")
        
    print("\nTraining Hybrid Model (Voting Classifier: RF + XGB)...")
    hybrid_model = VotingClassifier(
        estimators=[
            ('rf', RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)),
            ('xgb', XGBClassifier(random_state=42, eval_metric='logloss', n_jobs=-1))
        ],
        voting='soft',
        n_jobs=-1
    )
    hybrid_model.fit(X_train_smote_scaled, y_train_smote)
    
    y_pred_hybrid = hybrid_model.predict(X_test_scaled)
    y_pred_proba_hybrid = hybrid_model.predict_proba(X_test_scaled)[:, 1]
    
    model_results['Hybrid (RF + XGB)'] = {
        'accuracy': accuracy_score(y_test, y_pred_hybrid),
        'precision': precision_score(y_test, y_pred_hybrid),
        'recall': recall_score(y_test, y_pred_hybrid),
        'f1_score': f1_score(y_test, y_pred_hybrid),
        'auc': roc_auc_score(y_test, y_pred_proba_hybrid),
        'predictions': y_pred_hybrid
    }
    print(f"Hybrid Model trained. Accuracy: {model_results['Hybrid (RF + XGB)']['accuracy']:.4f}, Recall: {model_results['Hybrid (RF + XGB)']['recall']:.4f}")
    
    # Save the best model and scaler to the backend directory
    os.makedirs('backend', exist_ok=True)
    with open('backend/model.pkl', 'wb') as f:
        pickle.dump(hybrid_model, f)
    with open('backend/scaler.pkl', 'wb') as f:
        pickle.dump(scaler, f)
    print("\nHybrid model and scaler saved to backend/ directory.")
    
    # Display full report
    print("\n" + "=" * 80)
    print("DETAILED PERFORMANCE REPORT")
    print("=" * 80)
    for name, metrics in model_results.items():
        print(f"\n{name.upper()}:")
        print(f"  Accuracy:  {metrics['accuracy']:.5f}")
        print(f"  Precision: {metrics['precision']:.5f}")
        print(f"  Recall:    {metrics['recall']:.5f}")
        print(f"  F1-Score:  {metrics['f1_score']:.5f}")
        print(f"  AUC-ROC:   {metrics['auc']:.5f}")
        
        cm = confusion_matrix(y_test, metrics['predictions'])
        tn, fp, fn, tp = cm.ravel()
        print(f"  Confusion Matrix:")
        print(f"    TP: {tp} | FP: {fp}")
        print(f"    FN: {fn} | TN: {tn}")
    print("=" * 80)

if __name__ == '__main__':
    train_and_evaluate()
