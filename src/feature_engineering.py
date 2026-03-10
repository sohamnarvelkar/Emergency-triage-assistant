import pandas as pd
import numpy as np

def engineer_features(df):
    """
    Performs feature engineering to capture clinical interactions.
    """
    df_eng = df.copy()
    
    # Shock Index: Heart Rate / Systolic Blood Pressure
    # High shock index is a strong predictor of clinical deterioration
    df_eng['shock_index'] = df_eng['heart_rate'] / (df_eng['systolic_blood_pressure'] + 1e-5)
    
    # Age-Adjusted Vitals (simplified)
    # Elderly patients might have different 'normal' ranges
    df_eng['is_elderly'] = (df_eng['age'] > 65).astype(int)
    
    # Fever Indicator
    df_eng['has_fever'] = (df_eng['body_temperature'] > 38.0).astype(int)
    
    # Hypoxia Indicator
    df_eng['is_hypoxic'] = (df_eng['oxygen_saturation'] < 92).astype(int)
    
    return df_eng
