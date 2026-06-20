# Credit Card Fraud Detection: Technical Documentation & Analysis

This document provides a comprehensive technical overview of the Credit Card Fraud Detection System. It details the problem statement, dataset, mathematical/algorithmic details of the classifiers, metrics, preprocessing steps, and the final performance results.

---

## 1. Project Background & Objective

### Why Credit Card Fraud Detection?
Credit card fraud costs financial institutions and consumers billions of dollars annually. Efficient detection systems must analyze millions of transactions daily and flag suspicious behavior in real-time. 

However, fraud detection presents a severe challenge: **extreme class imbalance**. In a typical transaction dataset, fraudulent activities account for a tiny fraction of a percent. Standard machine learning models trained on such datasets often default to predicting every transaction as legitimate to achieve high accuracy. This project designs a robust, real-time classifier that handles this imbalance while minimizing both missed frauds (false negatives) and false alarms (false positives).

---

## 2. Dataset Description & Preprocessing

### The Dataset
The model is trained on a dataset containing transactions made by European cardholders.
* **Total Transactions**: 284,807
* **Fraudulent Transactions**: 492 (0.172% of total)
* **Features**:
  * `Time`: Number of seconds elapsed between this transaction and the first transaction in the dataset.
  * `Amount`: Transaction amount.
  * `V1 - V28`: Principal components obtained using Principal Component Analysis (PCA) to protect cardholder privacy.

### Preprocessing Pipeline
To prepare the data for training, the following steps are performed:

1. **Train-Test Split**:
   The dataset is split into **80% training** and **20% testing** sets. This split is *stratified* according to the class labels to ensure that both the training and testing sets have the exact same ratio of fraud to normal transactions (0.172%).
   
2. **SMOTE (Synthetic Minority Over-sampling Technique)**:
   To balance the classes, SMOTE is applied *only to the training set*. 
   * **Mechanism**: Rather than duplicating existing fraud entries (oversampling), SMOTE selects a minority class sample and finds its $k$-nearest neighbors. It then randomly selects one neighbor and generates a synthetic sample along the line segment connecting them.
   * **Result**: The minority class is upsampled until it matches the majority class size (yielding 454,902 transactions in the balanced training set, with exactly 50% normal and 50% fraud).

3. **Standardization**:
   Because algorithms like Logistic Regression and XGBoost are sensitive to feature scales, a `StandardScaler` is fit on the SMOTE-balanced training set. This transforms the features to have a mean of 0 and a standard deviation of 1. The testing set is scaled using the parameters computed from the training set to prevent data leakage.

---

## 3. Classification Algorithms Explained

The system implements and evaluates three core classification models and combines them into an ensemble:

### A. Logistic Regression
* **How it works**: A linear classification model that computes a weighted sum of the input features plus a bias. The result is passed through the sigmoid (logistic) function:
  $$\sigma(z) = \frac{1}{1 + e^{-z}}$$
  This maps the output to a probability value between 0 and 1.
* **Role**: Serves as a fast, highly interpretable baseline.

### B. Random Forest
* **How it works**: An ensemble method consisting of many independent Decision Trees. 
  * **Bagging**: Each tree is trained on a random bootstrap sample of the training data.
  * **Feature Randomness**: At each node split, only a random subset of features is considered.
  * **Output**: The forest votes on the final class.
* **Role**: Resists overfitting and handles non-linear boundaries.

### C. XGBoost (Extreme Gradient Boosting)
* **How it works**: A highly optimized gradient boosting framework. Unlike Random Forest where trees are independent, XGBoost builds decision trees sequentially. Each new tree corrects the residual errors made by the previous trees using gradient descent on the loss function.
* **Role**: Delivers state-of-the-art predictive performance on tabular data.

### D. Hybrid Model (Voting Classifier)
* **How it works**: Combines the predictions of Random Forest and XGBoost using **soft voting**. Instead of simple majority voting (hard voting), it averages the predicted class probabilities of the two classifiers:
  $$P(\text{Fraud}) = \frac{P_{\text{RF}}(\text{Fraud}) + P_{\text{XGB}}(\text{Fraud})}{2}$$
  If $P(\text{Fraud}) \ge 0.5$, the transaction is classified as Fraud.
* **Role**: Combines the robust generalization of Random Forest with the high sensitivity of XGBoost to minimize both false positives and false negatives.

---

## 4. Performance Evaluation Metrics

Using simple **Accuracy** for highly imbalanced datasets is misleading. We rely on a comprehensive set of evaluation metrics derived from the **Confusion Matrix**:

| | Predicted Normal | Predicted Fraud |
|---|---|---|
| **Actual Normal** | True Negative (TN) | False Positive (FP) |
| **Actual Fraud** | False Negative (FN) | True Positive (TP) |

### Key Metrics
1. **Accuracy**:
   $$\text{Accuracy} = \frac{TP + TN}{TP + TN + FP + FN}$$
   The percentage of correct predictions overall.

2. **Precision**:
   $$\text{Precision} = \frac{TP}{TP + FP}$$
   Of all transactions flagged as fraud, how many were actually fraud? High precision avoids blocking legitimate transactions (lowering user frustration).

3. **Recall (Sensitivity)**:
   $$\text{Recall} = \frac{TP}{TP + FN}$$
   Of all actual fraud transactions, how many did the model detect? High recall prevents losses by catching actual thieves.

4. **F1-Score**:
   $$\text{F1-Score} = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$$
   The harmonic mean of Precision and Recall. It is the best single-number metric for evaluating performance on imbalanced data.

5. **AUC-ROC (Area Under the Receiver Operating Characteristic Curve)**:
   Measures the model's ability to distinguish between classes across all possible probability thresholds. An AUC of 1.0 represents a perfect classifier, while 0.5 represents random guessing.

---

## 5. Performance Results

Following training on the balanced dataset, models were evaluated on the original (imbalanced) test split (56,962 transactions):

| Model | Accuracy | Precision | Recall | F1-Score | AUC-ROC | False Positives | False Negatives |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Logistic Regression** | 98.99% | 13.42% | 89.80% | 23.34% | 97.65% | 568 | 10 |
| **Random Forest** | 99.94% | 83.51% | 82.65% | 83.08% | 96.44% | 16 | 17 |
| **XGBoost** | 99.93% | 75.89% | 86.74% | 80.95% | 98.34% | 27 | 13 |
| **Hybrid (RF + XGB)** | **99.94%** | **82.35%** | **85.71%** | **84.00%** | **97.98%** | **18** | **14** |

### Analysis of the Results
* **Logistic Regression** achieved a high recall (89.80%) but a very low precision (13.42%), flagging 568 legitimate transactions as fraud.
* **Random Forest** had the highest precision (83.51%) but missed more fraudulent transactions (17 false negatives).
* **XGBoost** caught more frauds (86.74% recall) but had a slightly lower precision (75.89%).
* The **Hybrid model** achieved the best overall balance, matching the high recall of XGBoost while retaining the low false-positive rate of Random Forest. This results in the highest F1-Score of **84.00%** and makes it the ideal choice for production deployment.
