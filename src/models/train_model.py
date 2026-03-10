import joblib
import os
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import f1_score, recall_score, roc_auc_score
from src.data_loader import load_data
from src.preprocessing import prepare_data
from src.feature_engineering import engineer_features
from utils.config import MODEL_PATH, RANDOM_STATE
from utils.logger import logger

def train_and_select_model():
    # 1. Load and Engineer
    df = load_data()
    df = engineer_features(df)
    
    # 2. Preprocess
    X_train, X_test, y_train, y_test, preprocessor = prepare_data(df)
    
    # XGBoost expects 0-indexed classes if using certain objectives
    # Triage is 1-5, so we map to 0-4
    y_train_shifted = y_train - 1
    y_test_shifted = y_test - 1
    
    models = {
        "LogisticRegression": LogisticRegression(max_iter=1000, random_state=RANDOM_STATE),
        "RandomForest": RandomForestClassifier(n_estimators=100, random_state=RANDOM_STATE),
        "XGBoost": XGBClassifier(use_label_encoder=False, eval_metric='mlogloss', random_state=RANDOM_STATE)
    }
    
    best_model = None
    best_score = -1
    best_model_name = ""
    
    logger.info("Starting model comparison...")
    
    for name, model in models.items():
        model.fit(X_train, y_train_shifted)
        y_pred = model.predict(X_test)
        
        # Metrics
        f1 = f1_score(y_test_shifted, y_pred, average='weighted')
        # Recall for Level 1 (mapped to 0)
        recall_l1 = recall_score(y_test_shifted, y_pred, labels=[0], average='macro')
        
        logger.info(f"Model: {name} | Weighted F1: {f1:.4f} | Recall Level 1: {recall_l1:.4f}")
        
        # Selection logic: Primary F1, but must have decent Recall for Level 1
        # In production, we default to XGBoost as requested
        if name == "XGBoost":
            best_model = model
            best_model_name = name
            break

    # Save the production artifacts
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    production_payload = {
        "model": best_model,
        "preprocessor": preprocessor,
        "model_name": best_model_name
    }
    
    joblib.dump(production_payload, MODEL_PATH)
    logger.info(f"Production model ({best_model_name}) saved to {MODEL_PATH}")
    
    return production_payload, X_test, y_test_shifted

if __name__ == "__main__":
    train_and_select_model()
