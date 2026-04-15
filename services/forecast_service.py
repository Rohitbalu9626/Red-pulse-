import os
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestRegressor
from datetime import datetime, timedelta

# Path to save the ML model
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'demand_forecast.pkl')

def prepare_synthetic_training_data():
    """
    Generates synthetic past 90-days data for each blood type to train the ML model.
    In a real system, this would be queried from the 'requests' table.
    """
    blood_types = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]
    data = []
    
    start_date = datetime.now() - timedelta(days=180)
    
    for _ in range(1000):
        bt = np.random.choice(blood_types)
        d_date = start_date + timedelta(days=np.random.randint(0, 180))
        day_of_week = d_date.weekday()
        month = d_date.month
        # Demand pattern: more demand on weekends/holidays (simple mock)
        base_demand = np.random.randint(5, 15)
        if day_of_week >= 5: # Weekend
            base_demand += np.random.randint(3, 8)
            
        data.append({
            'blood_type': bt,
            'day_of_week': day_of_week,
            'month': month,
            'demand': base_demand
        })
        
    df = pd.DataFrame(data)
    # One-hot encode blood_type for ML
    df = pd.get_dummies(df, columns=['blood_type'])
    return df

def train_forecast_model():
    """
    Train the Scikit-Learn Random Forest Regressor and save to a file.
    """
    df = prepare_synthetic_training_data()
    
    X = df.drop('demand', axis=1)
    y = df['demand']
    
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    # Ensure models directory exists
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print("Demand Forecast Model Trained and Saved!")
    return list(X.columns) # return feature columns for alignment in prediction

def get_forecast(blood_type, days=7):
    """
    Load the trained model and generate predictions for the next 'days'.
    """
    if not os.path.exists(MODEL_PATH):
        # Auto-train if it doesn't exist
        feature_cols = train_forecast_model()
    else:
        # Quick hack for keeping track of feature columns
        # In prod, we'd save the columns together with the model
        feature_cols = ['day_of_week', 'month', 'blood_type_A+', 'blood_type_A-', 
                        'blood_type_AB+', 'blood_type_AB-', 'blood_type_B+', 
                        'blood_type_B-', 'blood_type_O+', 'blood_type_O-']
        
    model = joblib.load(MODEL_PATH)
    
    forecasts = []
    base_date = datetime.now()
    
    for i in range(days):
        target_date = base_date + timedelta(days=i)
        
        # Build feature dict matching training data
        input_data = {
            'day_of_week': [target_date.weekday()],
            'month': [target_date.month]
        }
        
        # Fill in one-hot encoded columns
        for col in feature_cols:
            if col.startswith('blood_type_'):
                bt_val = col.split('_')[-1]
                input_data[col] = [1 if bt_val == blood_type else 0]
                
        df_input = pd.DataFrame(input_data)[feature_cols] # Ensure column order matches
        predicted_val = model.predict(df_input)[0]
        forecasts.append(int(predicted_val))
        
    return forecasts
