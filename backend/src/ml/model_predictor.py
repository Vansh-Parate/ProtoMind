"""
ML Model Predictor
Loads the trained XGBoost model and provides risk predictions.
"""
import pickle
import numpy as np
import pandas as pd
from typing import Dict, Optional
from pathlib import Path

class RiskPredictor:
    def __init__(self, model_path: str):
        self.model_path = Path(model_path)
        self.model = None
        self.scaler = None
        self.label_encoders = {}
        self.feature_columns = []
        self.load_model()
    
    def load_model(self):
        try:
            with open(self.model_path / 'model.pkl', 'rb') as f:
                self.model = pickle.load(f)
            
            with open(self.model_path / 'scaler.pkl', 'rb') as f:
                self.scaler = pickle.load(f)
            
            with open(self.model_path / 'encoders.pkl', 'rb') as f:
                self.label_encoders = pickle.load(f)
                
            # Load feature names
            feat_file = self.model_path / 'feature_names.txt'
            if feat_file.exists():
                with open(feat_file, 'r') as f:
                    self.feature_columns = [line.strip() for line in f.readlines() if line.strip()]
            else:
                raise ValueError("feature_names.txt not found. Please re-export the model.")
                
        except FileNotFoundError as e:
            raise ValueError(f"Model file missing: {e}")

    def preprocess(self, data: Dict) -> np.ndarray:
        # Create DataFrame from single dict
        df = pd.DataFrame([data])
        
        # Ensure all required columns exist, fill with 0/defaults if missing
        for col in self.feature_columns:
            if col not in df.columns:
                df[col] = 0 // 2  # Default to 0/NaN behavior
                
        # Fill numeric NaNs
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            df[col] = df[col].fillna(0) # Simple fill for inference

        # Encode categoricals
        for col, le in self.label_encoders.items():
            if col in df.columns:
                # Handle unknown categories by mapping to a safe value or 0
                # Here we convert to string first as encoders were trained on strings
                df[col] = df[col].astype(str)
                
                # Careful apply: if value not in encoder classes, pick first class (usually 0)
                # This prevents crashing on new unseen values
                known_classes = set(le.classes_)
                df[col] = df[col].apply(lambda x: x if x in known_classes else le.classes_[0])
                
                df[col] = le.transform(df[col])

        # Reorder columns to match training
        df = df[self.feature_columns]
        
        # Scale
        return self.scaler.transform(df)

    def predict(self, case_data: Dict):
        X = self.preprocess(case_data)
        
        # Get probabilities
        probs = self.model.predict_proba(X)
        risk_prob = float(probs[0][1]) # Probability of 1 (SAR)
        
        # Calculate Risk Score (0-100)
        risk_score = int(round(risk_prob * 100))
        
        # Determine Level (using standard thresholds from notebook)
        if risk_prob >= 0.75:
            risk_level = "HIGH"
        elif risk_prob >= 0.20:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
            
        return {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "confidence": round(risk_prob, 4)
        }
