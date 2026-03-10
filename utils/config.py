import os

# Base Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "models")

# File Paths
DATASET_PATH = os.path.join(DATA_DIR, "triage_dataset.csv")
MODEL_PATH = os.path.join(MODELS_DIR, "triage_model.pkl")

# Model Configuration
TARGET_COLUMN = "triage_level"
RANDOM_STATE = 42
TEST_SIZE = 0.2

# Clinical Safety Config
CRITICAL_LEVEL = 1
MIN_RECALL_LEVEL_1 = 0.90
