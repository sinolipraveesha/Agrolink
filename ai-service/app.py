import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np

app = Flask(__name__)
CORS(app)

# Load Model and Encoders
model = joblib.load('price_model.joblib')
le_region = joblib.load('le_region.joblib')
le_commodity = joblib.load('le_commodity.joblib')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        
        # Expected input:
        # {
        #   "month": 5,
        #   "region": "Colombo",
        #   "commodity": "Banana",
        #   "temperature": 32.5,
        #   "rainfall": 150.0,
        #   "humidity": 80.0,
        #   "yield_score": 1.5
        # }
        
        # Encode categorical
        try:
            region_enc = le_region.transform([data['region']])[0]
        except:
            region_enc = 0 # Default/Unknown
            
        try:
            comm_enc = le_commodity.transform([data['commodity']])[0]
        except:
            comm_enc = 0 # Default/Unknown
            
        features = np.array([[
            data['month'],
            region_enc,
            data.get('temperature', 30.0),
            data.get('rainfall', 100.0),
            data.get('humidity', 75.0),
            data.get('yield_score', 1.0),
            comm_enc
        ]])
        
        prediction = model.predict(features)[0]
        
        return jsonify({
            'predicted_price': round(float(prediction), 2),
            'currency': 'LKR',
            'unit': 'kg'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/metadata', methods=['GET'])
def get_metadata():
    return jsonify({
        'regions': le_region.classes_.tolist(),
        'commodities': le_commodity.classes_.tolist()
    })

if __name__ == '__main__':
    # Using dynamic PORT for cloud providers (like Railway) or 5001 locally
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)
