#!/usr/bin/env python3
"""
ML API Server for Anomaly Detection
Run this script to start the Flask server for ML-based security checks.
"""

from ml_api import app

if __name__ == '__main__':
    print("🚀 Starting ML Anomaly Detection API Server...")
    print("📡 Server will be available at http://localhost:5001")
    print("🔍 Anomaly detection endpoint: POST /api/ml/check_anomaly")
    app.run(host='0.0.0.0', port=5001, debug=False)