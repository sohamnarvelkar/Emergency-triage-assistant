import pytest
import os
import joblib
import pandas as pd
import numpy as np
from src.explainability.shap_explainer import TriageExplainer, explain_prediction
from utils.config import MODEL_PATH

# Mock patient data
VALID_PATIENT = {
    "age": 65,
    "heart_rate": 120,
    "systolic_blood_pressure": 90,
    "oxygen_saturation": 88,
    "respiratory_rate": 30,
    "body_temperature": 38.2,
    "pain_level": 8,
    "chronic_disease_count": 2,
    "previous_er_visits": 1,
    "arrival_mode": "ambulance"
}

@pytest.fixture
def explainer():
    """Fixture to provide a TriageExplainer instance if the model exists."""
    if not os.path.exists(MODEL_PATH):
        pytest.skip("Model not found. Skipping SHAP explainer tests.")
    return TriageExplainer()

def test_explainer_initialization_error(monkeypatch):
    """Test that FileNotFoundError is raised when model path is invalid."""
    # Mock the MODEL_PATH to a non-existent file
    monkeypatch.setattr("src.explainability.shap_explainer.MODEL_PATH", "non_existent_model.pkl")
    
    with pytest.raises(FileNotFoundError) as excinfo:
        TriageExplainer()
    assert "Model not found" in str(excinfo.value)

def test_explain_output_structure(explainer):
    """Test that the explanation output has the correct structure and types."""
    result = explainer.explain(VALID_PATIENT)
    
    assert isinstance(result, dict)
    assert "top_features" in result
    assert "feature_importance_values" in result
    assert "explanation_summary" in result
    
    assert isinstance(result["top_features"], list)
    assert len(result["top_features"]) <= 3
    
    assert isinstance(result["feature_importance_values"], dict)
    assert len(result["feature_importance_values"]) <= 5
    
    assert isinstance(result["explanation_summary"], str)
    assert "primarily driven by" in result["explanation_summary"]

def test_explain_prediction_singleton():
    """Test the convenience function explain_prediction."""
    if not os.path.exists(MODEL_PATH):
        pytest.skip("Model not found. Skipping SHAP explainer tests.")
    
    # This will initialize the global _explainer if not already done
    result = explain_prediction(VALID_PATIENT)
    assert "top_features" in result

def test_feature_importance_sorting(explainer):
    """Test that features are correctly sorted by absolute importance."""
    result = explainer.explain(VALID_PATIENT)
    importances = list(result["feature_importance_values"].values())
    
    # Check if they are sorted by absolute value descending
    abs_importances = [abs(v) for v in importances]
    assert abs_importances == sorted(abs_importances, reverse=True)

def test_invalid_input_handling(explainer):
    """Test how the explainer handles missing or invalid features."""
    invalid_patient = VALID_PATIENT.copy()
    del invalid_patient["age"] # Missing feature
    
    # This should raise an error during preprocessing or feature engineering
    with pytest.raises(Exception):
        explainer.explain(invalid_patient)
