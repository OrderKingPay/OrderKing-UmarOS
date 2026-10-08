import numpy as np
from datetime import datetime, timedelta
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import joblib
import os

class PredictiveDemandModel:
    def __init__(self, model_path="model.joblib"):
        self.model_path = model_path
        self.model = None
        self._load_or_create_model()

    def _load_or_create_model(self):
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
        else:
            self.model = RandomForestRegressor(n_estimators=100, random_state=42)
            # Dummy train
            self._train_dummy()

    def _train_dummy(self):
        # Time (hour 0-23), weather (0-1: 0=clear, 1=rain), day_of_week (0-6)
        X = np.random.rand(1000, 3) 
        X[:, 0] = X[:, 0] * 24 # hour
        X[:, 1] = np.round(X[:, 1]) # weather
        X[:, 2] = np.round(X[:, 2] * 6) # day
        y = X[:, 0] * 10 + X[:, 1] * 50 + (X[:, 2] == 5) * 20 # fake demand logic
        self.model.fit(X, y)
        joblib.dump(self.model, self.model_path)

    def predict_surge(self, target_time, weather_condition, zone_id):
        hour = target_time.hour
        day_of_week = target_time.weekday()
        weather_encoded = 1 if weather_condition.lower() in ['rain', 'storm'] else 0
        
        features = np.array([[hour, weather_encoded, day_of_week]])
        expected_demand = self.model.predict(features)[0]
        
        is_surge = expected_demand > 150 # Threshold for surge
        return {
            "zone_id": zone_id,
            "target_time": target_time.isoformat(),
            "expected_demand": expected_demand,
            "is_surge": is_surge
        }
