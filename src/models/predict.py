import joblib
import pandas as pd
import numpy as np
from utils.config import MODEL_PATH
from src.feature_engineering import engineer_features
from utils.logger import logger
import os

class TriagePredictor:
    def __init__(self):
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model not found at {MODEL_PATH}. Run training first.")
        
        payload = joblib.load(MODEL_PATH)
        self.model = payload['model']
        self.preprocessor = payload['preprocessor']
        logger.info(f"Loaded {payload['model_name']} for inference.")

    def predict(self, patient_data: dict):
        """
        Takes a dictionary of patient data and returns triage prediction.
        """
        df = pd.DataFrame([patient_data])
        
        # 1. Feature Engineering
        df_eng = engineer_features(df)
        
        # 2. Preprocessing
        df_proc = self.preprocessor.transform(df_eng)
        
        # 3. Inference
        prediction_idx = self.model.predict(df_proc)[0]
        probabilities = self.model.predict_proba(df_proc)[0]
        
        triage_level = int(prediction_idx + 1)
        confidence = float(probabilities[prediction_idx])
        
        # Identify risk factors (simple logic: features that are significantly out of range)
        # In a real system, this would use SHAP values
        risk_factors = []
        if patient_data.get('oxygen_saturation', 100) < 92: risk_factors.append("oxygen_saturation")
        if patient_data.get('heart_rate', 70) > 110: risk_factors.append("heart_rate")
        if patient_data.get('systolic_blood_pressure', 120) < 90: risk_factors.append("blood_pressure")
        
        return {
            "triage_level": triage_level,
            "confidence": round(confidence, 2),
            "risk_factors": risk_factors
        }

_predictor = None

def predict_triage(patient_input):
    global _predictor
    if _predictor is None:
        _predictor = TriagePredictor()
    return _predictor.predict(patient_input)
