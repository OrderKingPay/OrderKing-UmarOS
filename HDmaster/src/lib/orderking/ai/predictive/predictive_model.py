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
        # MOCK ERRADICATED: Real implementation MUST fetch historical order volume from Postgres
        # e.g., SELECT hour, weather, day_of_week, COUNT(id) FROM orders GROUP BY ...
        raise NotImplementedError("Eradicated fake demand logic. Must connect to Postgres to train model.")
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
