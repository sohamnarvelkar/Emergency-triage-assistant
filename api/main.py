from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from src.models.predict import predict_triage
from src.explainability.shap_explainer import explain_prediction
from utils.logger import logger
import time

app = FastAPI(
    title="Emergency Triage AI Assistant",
    description="AI-driven decision support for emergency department triage.",
    version="1.0.0"
)

class PatientInput(BaseModel):
    age: int = Field(
        ..., 
        ge=0, le=120, 
        description="Patient age in years",
        json_schema_extra={"example": 45}
    )
    heart_rate: int = Field(
        ..., 
        ge=20, le=250, 
        description="Heart rate in beats per minute (BPM)",
        json_schema_extra={"example": 82}
    )
    systolic_blood_pressure: int = Field(
        ..., 
        ge=40, le=260, 
        description="Systolic blood pressure in mmHg",
        json_schema_extra={"example": 128}
    )
    oxygen_saturation: int = Field(
        ..., 
        ge=50, le=100, 
        description="Oxygen saturation percentage (SpO2)",
        json_schema_extra={"example": 98}
    )
    respiratory_rate: int = Field(
        ..., 
        ge=4, le=60, 
        description="Respiratory rate in breaths per minute",
        json_schema_extra={"example": 16}
    )
    body_temperature: float = Field(
        ..., 
        ge=30.0, le=45.0, 
        description="Body temperature in Celsius (°C)",
        json_schema_extra={"example": 36.8}
    )
    pain_level: int = Field(
        ..., 
        ge=0, le=10, 
        description="Pain level on a scale of 0 (no pain) to 10 (worst imaginable)",
        json_schema_extra={"example": 4}
    )
    chronic_disease_count: int = Field(
        0, 
        ge=0, le=20, 
        description="Number of known chronic conditions (e.g., diabetes, hypertension)",
        json_schema_extra={"example": 1}
    )
    previous_er_visits: int = Field(
        0, 
        ge=0, le=50, 
        description="Number of ER visits in the last 6 months",
        json_schema_extra={"example": 0}
    )
    arrival_mode: str = Field(
        ..., 
        description="The method by which the patient arrived at the emergency department",
        json_schema_extra={"example": "walk-in"}
    )

    @field_validator('age')
    @classmethod
    def validate_age(cls, v):
        if not 0 <= v <= 120:
            raise ValueError(f"Invalid age: {v}. Age must be a realistic value between 0 and 120 years.")
        return v

    @field_validator('heart_rate')
    @classmethod
    def validate_heart_rate(cls, v):
        if not 20 <= v <= 250:
            raise ValueError(f"Invalid heart rate: {v} BPM. Expected clinical range is 20 to 250 BPM.")
        return v

    @field_validator('systolic_blood_pressure')
    @classmethod
    def validate_sbp(cls, v):
        if not 40 <= v <= 260:
            raise ValueError(f"Invalid systolic BP: {v} mmHg. Expected clinical range is 40 to 260 mmHg.")
        return v

    @field_validator('oxygen_saturation')
    @classmethod
    def validate_spo2(cls, v):
        if not 50 <= v <= 100:
            raise ValueError(f"Invalid SpO2: {v}%. Oxygen saturation must be between 50% and 100%.")
        return v

    @field_validator('respiratory_rate')
    @classmethod
    def validate_rr(cls, v):
        if not 4 <= v <= 60:
            raise ValueError(f"Invalid respiratory rate: {v} breaths/min. Expected range is 4 to 60.")
        return v

    @field_validator('body_temperature')
    @classmethod
    def validate_temp(cls, v):
        if not 30.0 <= v <= 45.0:
            raise ValueError(f"Invalid temperature: {v}°C. Clinical range for triage is 30.0°C to 45.0°C.")
        return v

    @field_validator('pain_level')
    @classmethod
    def validate_pain(cls, v):
        if not 0 <= v <= 10:
            raise ValueError(f"Invalid pain level: {v}. Must be an integer between 0 (none) and 10 (extreme).")
        return v

    @field_validator('chronic_disease_count')
    @classmethod
    def validate_chronic(cls, v):
        if not 0 <= v <= 20:
            raise ValueError(f"Invalid chronic disease count: {v}. Must be between 0 and 20.")
        return v

    @field_validator('previous_er_visits')
    @classmethod
    def validate_er_visits(cls, v):
        if not 0 <= v <= 50:
            raise ValueError(f"Invalid ER visit count: {v}. Must be between 0 and 50.")
        return v

    @field_validator('arrival_mode')
    @classmethod
    def validate_arrival(cls, v):
        allowed = ["ambulance", "walk-in", "public_transport", "other"]
        if v.lower() not in allowed:
            raise ValueError(f"Invalid arrival mode: '{v}'. Must be one of: {', '.join(allowed)}.")
        return v.lower()

class PredictionResponse(BaseModel):
    triage_level: int
    confidence: float
    risk_factors: List[str]

class ExplanationResponse(BaseModel):
    top_features: List[str]
    feature_importance_values: dict
    explanation_summary: str

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": time.time()}

@app.post("/predict-triage", response_model=PredictionResponse)
def predict(patient: PatientInput):
    try:
        logger.info(f"Received prediction request for age {patient.age}")
        result = predict_triage(patient.model_dump())
        return result
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail="Model not trained yet.")
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/explain-prediction", response_model=ExplanationResponse)
def explain(patient: PatientInput):
    try:
        logger.info(f"Received explanation request")
        result = explain_prediction(patient.model_dump())
        return result
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail="Model not trained yet.")
    except Exception as e:
        logger.error(f"Explanation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # In AI Studio, we must use port 3000
    uvicorn.run(app, host="0.0.0.0", port=3000)
