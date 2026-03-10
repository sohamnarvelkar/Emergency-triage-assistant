import shap
import joblib
import pandas as pd
import numpy as np
from utils.config import MODEL_PATH
from src.feature_engineering import engineer_features
from utils.logger import logger
import os

class TriageExplainer:
    def __init__(self):
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError("Model not found.")
            
        payload = joblib.load(MODEL_PATH)
        self.model = payload['model']
        self.preprocessor = payload['preprocessor']
        
        # For SHAP, we often need a background dataset
        # In a real app, we'd use a sample from the training set
        # Here we'll use a small dummy background for initialization
        self.explainer = shap.TreeExplainer(self.model)

    def explain(self, patient_data: dict):
        df = pd.DataFrame([patient_data])
        df_eng = engineer_features(df)
        df_proc = self.preprocessor.transform(df_eng)
        
        shap_values = self.explainer.shap_values(df_proc)
        
        # For multi-class, shap_values is a list of arrays
        # We'll explain the predicted class
        prediction_idx = self.model.predict(df_proc)[0]
        class_shap_values = shap_values[prediction_idx][0]
        
        feature_names = df_proc.columns.tolist()
        
        # Sort features by absolute SHAP value
        feature_importance = dict(zip(feature_names, class_shap_values))
        sorted_features = sorted(feature_importance.items(), key=lambda x: abs(x[1]), reverse=True)
        
        top_features = [f[0] for f in sorted_features[:3]]
        
        summary = f"The prediction was primarily driven by {top_features[0]} and {top_features[1]}."
        
        return {
            "top_features": top_features,
            "feature_importance_values": {k: float(v) for k, v in sorted_features[:5]},
            "explanation_summary": summary
        }

_explainer = None

def explain_prediction(patient_data):
    global _explainer
    if _explainer is None:
        _explainer = TriageExplainer()
    return _explainer.explain(patient_data)
