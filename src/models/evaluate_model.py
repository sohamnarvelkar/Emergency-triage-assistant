import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from utils.config import MODEL_PATH
from utils.logger import logger

def evaluate_production_model():
    if not os.path.exists(MODEL_PATH):
        logger.error("Model file not found. Please train the model first.")
        return

    payload = joblib.load(MODEL_PATH)
    model = payload['model']
    preprocessor = payload['preprocessor']
    
    # Load test data (re-loading for evaluation script)
    from src.data_loader import load_data
    from src.preprocessing import prepare_data
    from src.feature_engineering import engineer_features
    
    df = load_data()
    df = engineer_features(df)
    _, X_test, _, y_test, _ = prepare_data(df)
    y_test_shifted = y_test - 1
    
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)
    
    logger.info("--- Evaluation Metrics ---")
    print(classification_report(y_test_shifted, y_pred, target_names=[f"Level {i}" for i in range(1, 6)]))
    
    # Safety Metrics
    cm = confusion_matrix(y_test_shifted, y_pred)
    recall_l1 = cm[0,0] / cm[0,:].sum() if cm[0,:].sum() > 0 else 0
    
    # False Negative Rate for Critical Patients (Level 1)
    # Defined as (Actual Level 1 predicted as Level 2-5) / Total Actual Level 1
    fn_l1 = cm[0, 1:].sum() / cm[0,:].sum() if cm[0,:].sum() > 0 else 0
    
    logger.info(f"Recall for Triage Level 1 (Critical): {recall_l1:.4f}")
    logger.info(f"False Negative Rate for Critical Patients: {fn_l1:.4f}")
    
    try:
        auc = roc_auc_score(y_test_shifted, y_prob, multi_class='ovr')
        logger.info(f"ROC-AUC (OVR): {auc:.4f}")
    except:
        pass

    print("\nClinical Safety Note:")
    print("Minimizing false negatives for Level 1 patients is vital. A false negative means a patient ")
    print("requiring immediate resuscitation is incorrectly categorized as less urgent, delaying life-saving care.")

if __name__ == "__main__":
    import os
    evaluate_production_model()
