from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timedelta
import random

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def generate_dummy_health_record(identifier):
    # Generate consistent dummy data based on the identifier
    random.seed(int(identifier[-4:]))  # Use last 4 digits for consistency
    
    conditions = [
        "Type 2 Diabetes Mellitus", "Essential Hypertension", "Coronary Artery Disease",
        "Hypothyroidism", "Tuberculosis", "Dengue Fever", "Chronic Kidney Disease",
        "COPD", "Bronchial Asthma", "Rheumatoid Arthritis", "Anemia",
        "Fatty Liver Disease", "Vitamin D Deficiency", "Vitamin B12 Deficiency"
    ]
    
    medications = [
        "Metformin 500mg BD", "Telmisartan 40mg OD", "Aspirin 75mg OD",
        "Atorvastatin 10mg HS", "Levothyroxine 25mcg OD", "Amlodipine 5mg OD",
        "Pantoprazole 40mg OD", "Rosuvastatin 10mg HS", "Glimepiride 1mg OD",
        "Montelukast 10mg HS", "Methylcobalamin 1500mcg OD"
    ]
    
    hospitals = [
        "AIIMS Delhi", "Medanta - The Medicity, Gurugram", "Apollo Hospitals, Chennai",
        "Fortis Memorial Research Institute", "Manipal Hospitals, Bangalore",
        "Max Super Speciality Hospital, Delhi", "Kokilaben Hospital, Mumbai",
        "Narayana Health City, Bangalore", "Tata Memorial Hospital, Mumbai"
    ]

    lab_tests = [
        {
            "name": "Complete Blood Count (CBC)",
            "parameters": {
                "Hemoglobin": f"{random.uniform(11.0, 15.5):.1f} g/dL",
                "WBC Count": f"{random.uniform(4000, 11000):.0f} cells/mcL",
                "Platelet Count": f"{random.uniform(150000, 450000):.0f} /mcL"
            }
        },
        {
            "name": "Lipid Profile",
            "parameters": {
                "Total Cholesterol": f"{random.uniform(150, 240):.0f} mg/dL",
                "Triglycerides": f"{random.uniform(100, 200):.0f} mg/dL",
                "HDL Cholesterol": f"{random.uniform(40, 60):.0f} mg/dL",
                "LDL Cholesterol": f"{random.uniform(70, 160):.0f} mg/dL"
            }
        },
        {
            "name": "Diabetes Profile",
            "parameters": {
                "Fasting Blood Sugar": f"{random.uniform(70, 180):.0f} mg/dL",
                "Post Prandial Blood Sugar": f"{random.uniform(100, 200):.0f} mg/dL",
                "HbA1c": f"{random.uniform(5.0, 8.0):.1f}%"
            }
        }
    ]

    # Generate Indian name components
    first_names = ["Aarav", "Advait", "Arjun", "Ishaan", "Reyansh", "Vihaan",
                  "Aanya", "Diya", "Kiara", "Myra", "Prisha", "Zara"]
    last_names = ["Patel", "Kumar", "Singh", "Sharma", "Verma", "Gupta",
                 "Malhotra", "Reddy", "Iyer", "Mehta"]
    
    # Generate visit dates
    base_date = datetime.now() - timedelta(days=365)
    visit_dates = []
    for _ in range(4):
        days_to_add = random.randint(0, 365)
        visit_dates.append((base_date + timedelta(days=days_to_add)).strftime("%Y-%m-%d"))
    visit_dates.sort()

    patient_name = f"{random.choice(first_names)} {random.choice(last_names)}"
    
    return {
        "patient_info": {
            "name": patient_name,
            "identifier": identifier,
            "identifier_type": "ABHA" if len(identifier) == 14 else "Aadhaar",
            "age": random.randint(25, 75),
            "gender": random.choice(["Male", "Female"]),
            "blood_group": random.choice(["A+", "B+", "O+", "AB+", "A-", "B-", "O-", "AB-"]),
            "marital_status": random.choice(["Married", "Single", "Widowed"]),
            "occupation": random.choice(["Service", "Business", "Healthcare", "Education", "Homemaker", "Retired"]),
            "address": {
                "city": random.choice(["Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Pune", "Kolkata"]),
                "state": random.choice(["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Telangana", "West Bengal"]),
                "pincode": f"{random.randint(100000, 999999)}"
            }
        },
        "medical_history": {
            "chronic_conditions": random.sample(conditions, random.randint(1, 3)),
            "allergies": random.sample(["Penicillin", "Sulfa Drugs", "Aspirin", "Dairy Products", "Pollen", "Dust"], random.randint(0, 2)),
            "family_history": [
                f"{random.choice(['Father', 'Mother', 'Sibling'])} - {random.choice(['Diabetes', 'Hypertension', 'Heart Disease', 'Cancer'])}"
                for _ in range(random.randint(1, 2))
            ],
            "surgeries": [
                {
                    "procedure": random.choice([
                        "Laparoscopic Cholecystectomy", "Appendectomy",
                        "Total Knee Replacement", "Coronary Angioplasty",
                        "Cataract Surgery"
                    ]),
                    "date": (datetime.now() - timedelta(days=random.randint(30, 730))).strftime("%Y-%m-%d"),
                    "hospital": random.choice(hospitals),
                    "surgeon": f"Dr. {random.choice(last_names)}"
                }
            ] if random.random() > 0.5 else []
        },
        "recent_visits": [
            {
                "date": visit_date,
                "hospital": random.choice(hospitals),
                "department": random.choice([
                    "General Medicine", "Cardiology", "Endocrinology",
                    "Orthopedics", "Gastroenterology", "Pulmonology"
                ]),
                "doctor": f"Dr. {random.choice(last_names)}",
                "diagnosis": random.choice(conditions),
                "prescribed_medications": random.sample(medications, random.randint(2, 4)),
                "follow_up_date": (datetime.strptime(visit_date, "%Y-%m-%d") + timedelta(days=random.randint(15, 45))).strftime("%Y-%m-%d")
            }
            for visit_date in visit_dates
        ],
        "laboratory_results": {
            "latest_tests": lab_tests,
            "test_date": (datetime.now() - timedelta(days=random.randint(1, 30))).strftime("%Y-%m-%d"),
            "laboratory": random.choice([
                "Thyrocare", "Dr Lal PathLabs", "SRL Diagnostics",
                "Metropolis Healthcare", "Apollo Diagnostics"
            ])
        },
        "insurance_info": {
            "policy_number": f"POL{random.randint(100000, 999999)}",
            "insurance_provider": random.choice([
                "Star Health Insurance", "LIC Health Insurance",
                "HDFC ERGO Health", "Max Bupa Health Insurance",
                "New India Assurance", "National Insurance"
            ]),
            "policy_type": random.choice([
                "Family Floater", "Individual Health Plan",
                "Senior Citizen Health Plan", "Critical Illness Cover"
            ]),
            "coverage_amount": random.choice([500000, 1000000, 2000000, 5000000, 10000000]),
            "valid_until": (datetime.now() + timedelta(days=365)).strftime("%Y-%m-%d"),
            "tpa": random.choice([
                "Medi Assist", "MD India", "Paramount Health",
                "Family Health Plan", "Vipul MedCorp"
            ])
        },
        "vitals_history": [
            {
                "date": (datetime.now() - timedelta(days=i*30)).strftime("%Y-%m-%d"),
                "blood_pressure": f"{random.randint(110,140)}/{random.randint(70,90)} mmHg",
                "heart_rate": f"{random.randint(60, 100)} bpm",
                "temperature": f"{round(random.uniform(97.0, 99.0), 1)}°F",
                "oxygen_saturation": f"{random.randint(95, 100)}%",
                "respiratory_rate": f"{random.randint(12, 20)} /min",
                "weight": f"{random.randint(55, 85)} kg",
                "bmi": f"{round(random.uniform(18.5, 29.9), 1)}"
            }
            for i in range(3)
        ]
    }

@app.route('/api/v1/health-records', methods=['GET'])
def get_health_records():
    identifier = request.args.get('identifier')
    
    if not identifier:
        return jsonify({
            "error": "Missing identifier parameter",
            "message": "Please provide either Aadhaar or ABHA number as identifier"
        }), 400
    
    # Validate identifier format
    is_valid_aadhaar = len(identifier) == 12 and identifier.isdigit()
    # ABHA format: 'ABHA' followed by exactly 10 digits
    is_valid_abha = (len(identifier) == 14 and 
                    identifier.startswith('ABHA') and 
                    identifier[4:].isdigit() and 
                    len(identifier[4:]) == 10)
    
    if not (is_valid_aadhaar or is_valid_abha):
        return jsonify({
            "error": "Invalid identifier format",
            "message": "Please provide valid Aadhaar (12 digits) or ABHA number (ABHA followed by 10 digits)"
        }), 400

    # For ABHA numbers, use last 4 digits for seed
    seed_value = identifier[-4:]
    random.seed(int(seed_value))
    
    health_record = generate_dummy_health_record(identifier)
    
    return jsonify({
        "status": "success",
        "message": "Health records retrieved successfully",
        "data": health_record
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "ok",
        "message": "ABDM Service is running",
        "timestamp": datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("""
╔═══════════════════════════════════════════╗
║     ABDM Mock Service                     ║
║     Running on port 5000                  ║
║     Health Records API                    ║
╚═══════════════════════════════════════════╝
    """)
    app.run(debug=True, port=5000)


