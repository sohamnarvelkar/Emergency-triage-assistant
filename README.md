# Emergency Triage AI Assistant

## Project Overview
The **Emergency Triage AI Assistant** is a production-grade machine learning system designed to assist healthcare professionals in Emergency Departments (ED). It predicts patient triage levels (1-5) based on vital signs, symptoms, and medical history, ensuring that critical patients receive immediate attention.

### Medical Triage Explanation
Triage is the process of determining the priority of patients' treatments based on the severity of their condition.
- **Level 1 (Resuscitation):** Immediate life-saving intervention required.
- **Level 2 (Emergent):** High risk, life or limb-threatening.
- **Level 3 (Urgent):** Stable but requires multiple resources.
- **Level 4 (Less Urgent):** Stable, requires single resource.
- **Level 5 (Non-Urgent):** Stable, requires no resources.

## System Architecture
The system follows a modular architecture:
- **Data Pipeline:** Handles loading, cleaning, and feature engineering.
- **Model Engine:** Trains and evaluates multiple models (Logistic Regression, Random Forest, XGBoost), selecting the best performer with a focus on clinical safety (Recall for Level 1).
- **Explainability Layer:** Uses SHAP to provide interpretable insights for every prediction.
- **API Service:** A FastAPI-based REST service for real-time inference.

## Dataset Format
The model expects the following features:
- `age`: Patient age
- `heart_rate`: Beats per minute
- `systolic_blood_pressure`: mmHg
- `oxygen_saturation`: SpO2 %
- `respiratory_rate`: Breaths per minute
- `body_temperature`: Celsius
- `pain_level`: 0-10 scale
- `chronic_disease_count`: Number of pre-existing conditions
- `previous_er_visits`: Count in the last year
- `arrival_mode`: `ambulance`, `walk-in`, `public_transport`

## Installation & Setup

1. **Create a Virtual Environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Train the Model:**
   ```bash
   python src/models/train_model.py
   ```

4. **Run the API:**
   ```bash
   uvicorn api.main:app --reload --port 3000
   ```

## API Usage Examples

### Predict Triage
**POST** `/predict-triage`
```json
{
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
```

### Explain Prediction
**POST** `/explain-prediction`
(Same payload as above)

## Clinical Safety
In emergency triage, **minimizing false negatives for Level 1 patients** is the highest priority. A missed critical patient (Type II error) can lead to catastrophic outcomes. Our model selection algorithm prioritizes Recall for Level 1 to ensure maximum sensitivity for life-threatening cases.
