from flask import Flask, request, jsonify
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import os
from datetime import datetime
import math
from collections import defaultdict, Counter
import pandas as pd
import glob

app = Flask(__name__)

# ================= CONFIG =================
CSV_FILES = glob.glob(r"C:\Users\USER\Desktop\project\python\dataset\*.csv")

MODEL_PATH = 'anomaly_detector.pkl'
SCALER_PATH = 'scaler.pkl'

MAX_ROWS = 100000   # ✅ LIMIT DATA (important)

# ================= TRACKING =================
user_activity = defaultdict(list)
failed_attempts = defaultdict(int)

# ================= ENTROPY =================
def calculate_entropy(s):
    if not s:
        return 0
    counts = Counter(s)
    prob = [v / len(s) for v in counts.values()]
    return -sum(p * math.log(p, 2) for p in prob)

# ================= RULE ENGINE =================
def rule_based_detection(text):
    text = text.lower()

    patterns = {
        "SQL_INJECTION": ["' or 1=1", "select", "union", "--"],
        "XSS_ATTACK": ["<script>", "javascript:"],
        "PATH_TRAVERSAL": ["../", "..\\"],
        "COMMAND_INJECTION": ["; rm", "|", "&&"]
    }

    for attack, keys in patterns.items():
        if any(k in text for k in keys):
            return attack

    if len(text) > 200:
        return "SUSPICIOUS_LENGTH"

    return None

# ================= LOAD CSV =================
def load_csv_data():
    all_data = []
    count = 0

    for file in CSV_FILES:
        try:
            df = pd.read_csv(file).fillna("")
            for _, row in df.iterrows():
                all_data.append({
                    "email": row.get("email", ""),
                    "password": row.get("password", "")
                })
                count += 1
                if count >= MAX_ROWS:
                    return all_data
        except Exception as e:
            print("CSV Error:", file, e)

    return all_data

# ================= MODEL =================
class AnomalyDetector:
    def __init__(self):
        self.model = IsolationForest(
            n_estimators=120,
            contamination=0.08,
            random_state=42
        )
        self.scaler = StandardScaler()
        self.is_trained = False

        self.load_model()

    # ================= LOAD MODEL =================
    def load_model(self):
        if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
            try:
                self.model = joblib.load(MODEL_PATH)
                self.scaler = joblib.load(SCALER_PATH)
                self.is_trained = True
                print("✅ Model loaded from file")
            except Exception as e:
                print("⚠️ Model load failed:", e)

    # ================= FEATURES =================
    def extract_features(self, data, ua="", ip="0.0.0.0"):
        try:
            email = str(data.get('email', ''))
            password = str(data.get('password', ''))
            text = email + password

            now = datetime.now()

            # IP feature
            try:
                ip_parts = [int(x) for x in ip.split('.') if x.isdigit()]
                ip_feature = sum(ip_parts) / 1000 if ip_parts else 0
            except:
                ip_feature = 0

            activity_count = len(user_activity.get(ip, [])) / 50
            fail_count = failed_attempts.get(ip, 0) / 10

            descriptor = data.get('faceDescriptor') or []
            try:
                # Safely convert descriptor values to float
                descriptor_values = []
                if isinstance(descriptor, (list, tuple)):
                    for x in descriptor:
                        try:
                            descriptor_values.append(float(x))
                        except (ValueError, TypeError):
                            pass  # Skip invalid values
                elif isinstance(descriptor, (int, float)):
                    descriptor_values = [float(descriptor)]
            except:
                descriptor_values = []
                
            face_length = len(descriptor_values)
            face_mean = float(np.mean(descriptor_values)) if face_length > 0 else 0.0
            face_var = float(np.var(descriptor_values)) if face_length > 0 else 0.0

            features = [
                now.hour / 24 if now.hour else 0,
                now.weekday() / 6 if now.weekday() else 0,
                now.minute / 60 if now.minute else 0,

                len(text) / 500 if text else 0,
                len(email) / 100 if email else 0,
                len(password) / 100 if password else 0,

                sum(c.isdigit() for c in text) / 50 if text else 0,
                sum(c.isalpha() for c in text) / 300 if text else 0,
                calculate_entropy(text) / 8 if text else 0,

                len(ua) / 200 if ua else 0,
                1 if ua and "bot" in ua.lower() else 0,

                ip_feature,
                activity_count,
                fail_count,

                face_length / 200 if face_length else 0,
                face_mean,
                face_var / 10 if face_var else 0,
            ]

            return np.array(features, dtype=np.float64).reshape(1, -1)
        except Exception as e:
            print(f"❌ Error extracting features: {str(e)}")
            # Return default features if extraction fails
            return np.zeros((1, 17), dtype=np.float64)

    # ================= TRAIN =================
    def train(self, dataset):
        if len(dataset) == 0:
            print("❌ Empty dataset")
            return

        X = np.vstack(dataset)

        self.scaler.fit(X)
        X_scaled = self.scaler.transform(X)

        self.model.fit(X_scaled)

        joblib.dump(self.model, MODEL_PATH)
        joblib.dump(self.scaler, SCALER_PATH)

        self.is_trained = True
        print("✅ Model trained & saved")

    # ================= PREDICT =================
    def predict(self, data, ua="", ip="0.0.0.0"):
        try:
            text = str(data.get("email", "")) + str(data.get("password", ""))

            # RULE ENGINE
            rule_result = rule_based_detection(text)
            if rule_result:
                return {
                    "is_anomaly": True,
                    "confidence": 0.99,
                    "mode": "rule_engine",
                    "attack_type": rule_result,
                    "risk": "HIGH"
                }

            if not self.is_trained:
                return {
                    "is_anomaly": False,
                    "confidence": 0.0,
                    "mode": "not_trained",
                    "risk": "LOW"
                }

            features = self.extract_features(data, ua, ip)
            scaled = self.scaler.transform(features)

            pred = self.model.predict(scaled)[0]
            score = self.model.decision_function(scaled)[0]

            # Convert numpy bool to native Python bool for JSON serialization
            is_anomaly = bool(pred == -1)

            # Normalize confidence
            confidence = float(min(max(1 - score, 0), 1))

            # Risk levels
            if not is_anomaly:
                risk = "LOW"
            elif confidence > 0.7:
                risk = "HIGH"
            else:
                risk = "MEDIUM"

            return {
                "is_anomaly": is_anomaly,
                "confidence": confidence,
                "mode": "ml",
                "risk": risk
            }
        except Exception as e:
            print(f"❌ Error in predict: {str(e)}")
            raise

# ================= INIT =================
detector = AnomalyDetector()

# Train ONLY if model not exists
if not detector.is_trained:
    print("📂 Loading dataset for training...")
    raw_data = load_csv_data()

    feature_list = [
        detector.extract_features(d)[0]
        for d in raw_data
    ]

    print("📊 Dataset size:", len(feature_list))

    if len(feature_list) > 0:
        detector.train(feature_list)

# ================= API =================
@app.route('/api/ml/check_anomaly', methods=['POST'])
def check_anomaly():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No input data"}), 400

        ip = request.remote_addr or "0.0.0.0"
        ua = request.headers.get("User-Agent", "")

        # Track activity
        user_activity[ip].append(datetime.now())
        user_activity[ip] = user_activity[ip][-20:]

        result = detector.predict(data, ua, ip)

        if result["is_anomaly"]:
            failed_attempts[ip] += 1
        else:
            failed_attempts[ip] = 0

        return jsonify(result)

    except Exception as e:
        print(f"❌ ML API Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": str(e),
            "is_anomaly": True,
            "confidence": 0.0
        }), 500

# ================= TRAIN API =================
@app.route('/api/ml/train', methods=['POST'])
def train_api():
    try:
        request_data = request.get_json()
        if not request_data:
            return jsonify({"error": "No input data"}), 400
            
        dataset = request_data.get("data", [])
        
        if not dataset:
            return jsonify({"error": "Empty dataset"}), 400

        feature_list = [
            detector.extract_features(d)[0]
            for d in dataset
        ]

        detector.train(feature_list)

        return jsonify({"message": "Model trained successfully", "samples": len(feature_list)})

    except Exception as e:
        print(f"❌ Train API Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ================= RUN =================
if __name__ == '__main__':
    app.run(debug=True, port=5001)