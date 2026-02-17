"""
Export Model Script for final_model.ipynb
Run this code block at the end of your final_model.ipynb notebook to save the trained model.
"""
import pickle
import json
from pathlib import Path

# Define model directory relative to the notebook location
# This assumes notebook is in backend/ and we want to save to backend/src/ml/models
model_dir = Path('src/ml/models')
model_dir.mkdir(parents=True, exist_ok=True)

print(f"Exporting model files to {model_dir.absolute()}...")

# 1. Save the XGBoost model
with open(model_dir / 'model.pkl', 'wb') as f:
    pickle.dump(best_model, f)
print("✓ Model saved: model.pkl")

# 2. Save the StandardScaler
with open(model_dir / 'scaler.pkl', 'wb') as f:
    pickle.dump(scaler, f)
print("✓ Scaler saved: scaler.pkl")

# 3. Save the Label Encoders
with open(model_dir / 'encoders.pkl', 'wb') as f:
    pickle.dump(label_encoders, f)
print("✓ Encoders saved: encoders.pkl")

# 4. Save feature names for reference (Critical for aligning DB data to Model)
# We try to get feature names from the dataframe X
try:
    cols = X.columns.tolist()
    with open(model_dir / 'feature_names.txt', 'w') as f:
        f.write('\n'.join(cols))
    print("✓ Feature names saved: feature_names.txt")
except NameError:
    print("! Warning: X is not defined, skipping feature_names.txt. Please ensure X is in scope.")

# 5. Save model metadata
metadata = {
    'model_type': 'XGBoost',
    'high_risk_threshold': HIGH_RISK_THRESHOLD,
    'med_risk_threshold': MED_RISK_THRESHOLD
}

with open(model_dir / 'metadata.json', 'w') as f:
    json.dump(metadata, f, indent=2)
print("✓ Metadata saved: metadata.json")

print("\nDone! Now you can run the backend scoring script.")
