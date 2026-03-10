import pytest
from fastapi.testclient import TestClient
from api.main import app
import os

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_predict_validation_error():
    # Missing required field
    payload = {
        "age": 65,
        "heart_rate": 120
    }
    response = client.post("/predict-triage", json=payload)
    assert response.status_code == 422

def test_predict_invalid_arrival_mode():
    payload = {
        "age": 65,
        "heart_rate": 120,
        "systolic_blood_pressure": 90,
        "oxygen_saturation": 88,
        "respiratory_rate": 30,
        "body_temperature": 38.2,
        "pain_level": 8,
        "chronic_disease_count": 2,
        "arrival_mode": "teleportation" # Invalid
    }
    response = client.post("/predict-triage", json=payload)
    assert response.status_code == 422

@pytest.mark.skipif(not os.path.exists("models/triage_model.pkl"), reason="Model not trained")
def test_predict_success():
    payload = {
        "age": 65,
        "heart_rate": 120,
        "systolic_blood_pressure": 90,
        "oxygen_saturation": 88,
        "respiratory_rate": 30,
        "body_temperature": 38.2,
        "pain_level": 8,
        "chronic_disease_count": 2,
        "arrival_mode": "ambulance"
    }
    response = client.post("/predict-triage", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "triage_level" in data
    assert 1 <= data["triage_level"] <= 5
