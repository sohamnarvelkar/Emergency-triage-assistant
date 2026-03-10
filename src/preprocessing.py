import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from utils.config import TARGET_COLUMN, TEST_SIZE, RANDOM_STATE
from utils.logger import logger

class Preprocessor:
    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.categorical_cols = ['arrival_mode']
        self.numerical_cols = [
            'age', 'heart_rate', 'systolic_blood_pressure', 
            'oxygen_saturation', 'respiratory_rate', 
            'body_temperature', 'pain_level', 
            'chronic_disease_count', 'previous_er_visits'
        ]
        self.arrival_mode_map = {
            'ambulance': 'ambulance',
            'walk-in': 'walk-in',
            'public_transport': 'public_transport',
            'other': 'other'
        }

    def fit(self, df):
        # Handle categorical encoding
        for col in self.categorical_cols:
            le = LabelEncoder()
            le.fit(df[col])
            self.label_encoders[col] = le
        
        # Handle numerical scaling
        self.scaler.fit(df[self.numerical_cols])
        return self

    def transform(self, df):
        df_processed = df.copy()
        
        # Missing value imputation (simple mean/mode for this version)
        for col in self.numerical_cols:
            df_processed[col] = df_processed[col].fillna(df_processed[col].mean())
        
        for col in self.categorical_cols:
            df_processed[col] = df_processed[col].fillna(df_processed[col].mode()[0])
            le = self.label_encoders[col]
            # Handle unseen labels by mapping to a default if necessary
            df_processed[col] = df_processed[col].apply(
                lambda x: le.transform([x])[0] if x in le.classes_ else -1
            )
            
        # Feature scaling
        df_processed[self.numerical_cols] = self.scaler.transform(df_processed[self.numerical_cols])
        
        return df_processed

def prepare_data(df):
    """Performs train-test split and preprocessing."""
    X = df.drop(columns=[TARGET_COLUMN])
    y = df[TARGET_COLUMN]
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )
    
    preprocessor = Preprocessor()
    preprocessor.fit(X_train)
    
    X_train_proc = preprocessor.transform(X_train)
    X_test_proc = preprocessor.transform(X_test)
    
    logger.info("Data preprocessing completed.")
    return X_train_proc, X_test_proc, y_train, y_test, preprocessor
