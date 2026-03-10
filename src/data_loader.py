import pandas as pd
import numpy as np
from utils.config import DATASET_PATH
from utils.logger import logger
import os

def generate_synthetic_data(n_samples=1000):
    """Generates synthetic triage data for demonstration purposes."""
    np.random.seed(42)
    
    data = {
        'age': np.random.randint(0, 95, n_samples),
        'heart_rate': np.random.randint(50, 160, n_samples),
        'systolic_blood_pressure': np.random.randint(80, 190, n_samples),
        'oxygen_saturation': np.random.randint(85, 100, n_samples),
        'respiratory_rate': np.random.randint(12, 40, n_samples),
        'body_temperature': np.random.uniform(35.5, 40.5, n_samples),
        'pain_level': np.random.randint(0, 11, n_samples),
        'chronic_disease_count': np.random.randint(0, 6, n_samples),
        'previous_er_visits': np.random.randint(0, 10, n_samples),
        'arrival_mode': np.random.choice(['ambulance', 'walk-in', 'public_transport'], n_samples)
    }
    
    df = pd.DataFrame(data)
    
    # Simple logic to assign triage level based on vitals
    def assign_triage(row):
        score = 0
        if row['oxygen_saturation'] < 90: score += 4
        if row['heart_rate'] > 130 or row['heart_rate'] < 50: score += 3
        if row['systolic_blood_pressure'] < 90 or row['systolic_blood_pressure'] > 180: score += 3
        if row['respiratory_rate'] > 30: score += 3
        if row['body_temperature'] > 39.5: score += 2
        if row['pain_level'] > 8: score += 2
        
        if score >= 6: return 1
        if score >= 4: return 2
        if score >= 2: return 3
        if score >= 1: return 4
        return 5

    df['triage_level'] = df.apply(assign_triage, axis=1)
    return df

def load_data():
    """Loads the triage dataset from the configured path."""
    if not os.path.exists(DATASET_PATH):
        logger.warning(f"Dataset not found at {DATASET_PATH}. Generating synthetic data.")
        os.makedirs(os.path.dirname(DATASET_PATH), exist_ok=True)
        df = generate_synthetic_data()
        df.to_csv(DATASET_PATH, index=False)
        return df
    
    try:
        df = pd.read_csv(DATASET_PATH)
        logger.info(f"Successfully loaded dataset with {len(df)} rows.")
        return df
    except Exception as e:
        logger.error(f"Error loading data: {e}")
        raise
