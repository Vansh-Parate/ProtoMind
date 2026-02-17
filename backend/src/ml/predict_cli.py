#!/usr/bin/env python3
"""
CLI script to predict risk for a single case payload.
Usage: python predict_cli.py '{"total_amount": 5000, ...}'
"""
import sys
import json
from pathlib import Path
from model_predictor import RiskPredictor

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No data provided"}))
        return

    try:
        # Load data
        raw_data = sys.argv[1]
        data = json.loads(raw_data)
        
        # Setup predictor
        # Model dir is adjacent to this script in 'models/'
        model_dir = Path(__file__).parent / 'models'
        predictor = RiskPredictor(str(model_dir))
        
        # Predict
        result = predictor.predict(data)
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
