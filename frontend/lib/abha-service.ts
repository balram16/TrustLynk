// ABHA Service - Fetch patient data from ABDM
export interface PatientInfo {
  name: string;
  identifier: string;
  identifier_type: string;
  age: number;
  gender: string;
  blood_group: string;
  marital_status: string;
  occupation: string;
  address: {
    city: string;
    state: string;
    pincode: string;
  };
}

export interface RecentVisit {
  date: string;
  hospital: string;
  department: string;
  doctor: string;
  diagnosis: string;
  prescribed_medications: string[];
  follow_up_date: string;
}

export interface MedicalHistory {
  chronic_conditions: string[];
  allergies: string[];
  family_history: string[];
  surgeries: Array<{
    procedure: string;
    date: string;
    hospital: string;
    surgeon: string;
  }>;
}

export interface HealthRecordData {
  patient_info: PatientInfo;
  medical_history: MedicalHistory;
  recent_visits: RecentVisit[];
}

export interface HealthRecordResponse {
  status: string;
  data: HealthRecordData;
}

// Dummy data mapping - In production, this would call the ABDM API
const DUMMY_DATA_MAP: Record<string, HealthRecordData> = {
  "123456789012": {
    patient_info: {
      name: "Aarav Sharma",
      identifier: "123456789012",
      identifier_type: "Aadhaar",
      age: 45,
      gender: "Male",
      blood_group: "B+",
      marital_status: "Married",
      occupation: "Service",
      address: {
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001"
      }
    },
    medical_history: {
      chronic_conditions: ["Type 2 Diabetes Mellitus", "Essential Hypertension"],
      allergies: ["Penicillin"],
      family_history: ["Father - Diabetes", "Mother - Hypertension"],
      surgeries: [
        {
          procedure: "Laparoscopic Cholecystectomy",
          date: "2023-06-15",
          hospital: "Fortis Memorial Research Institute",
          surgeon: "Dr. Gupta"
        }
      ]
    },
    recent_visits: [
      {
        date: "2024-02-15",
        hospital: "Apollo Hospitals, Chennai",
        department: "Endocrinology",
        doctor: "Dr. Patel",
        diagnosis: "Type 2 Diabetes Mellitus",
        prescribed_medications: ["Metformin 500mg BD", "Glimepiride 1mg OD"],
        follow_up_date: "2024-03-15"
      }
    ]
  },
  "234567890123": {
    patient_info: {
      name: "Priya Patel",
      identifier: "234567890123",
      identifier_type: "Aadhaar",
      age: 32,
      gender: "Female",
      blood_group: "A+",
      marital_status: "Married",
      occupation: "Teacher",
      address: {
        city: "Delhi",
        state: "Delhi",
        pincode: "110001"
      }
    },
    medical_history: {
      chronic_conditions: ["Asthma"],
      allergies: ["Dust", "Pollen"],
      family_history: ["Mother - Asthma"],
      surgeries: []
    },
    recent_visits: [
      {
        date: "2024-01-20",
        hospital: "Max Super Speciality Hospital, Delhi",
        department: "Pulmonology",
        doctor: "Dr. Verma",
        diagnosis: "Bronchial Asthma",
        prescribed_medications: ["Budecort 200 Inhaler", "Levolin Inhaler"],
        follow_up_date: "2024-04-20"
      }
    ]
  },
  // Add more dummy data as needed
};

/**
 * Fetch health records for a patient by ABHA ID
 */
export async function fetchHealthRecords(abhaId: string): Promise<HealthRecordResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Clean the ABHA ID (remove spaces, dashes)
  const cleanedId = abhaId.replace(/[\s-]/g, '');

  // Check if we have data for this ID
  const data = DUMMY_DATA_MAP[cleanedId];

  if (!data) {
    throw new Error(`No health records found for ABHA ID: ${abhaId}`);
  }

  return {
    status: "success",
    data
  };
}

/**
 * Validate ABHA ID format
 */
export function validateAbhaId(abhaId: string): boolean {
  // Remove spaces and dashes
  const cleaned = abhaId.replace(/[\s-]/g, '');
  
  // Should be 12 digits
  return /^\d{12}$/.test(cleaned);
}

/**
 * Format ABHA ID for display (XXXX-XXXX-XXXX)
 */
export function formatAbhaId(abhaId: string): string {
  const cleaned = abhaId.replace(/[\s-]/g, '');
  return cleaned.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3');
}

/**
 * Get all available ABHA IDs (for testing)
 */
export function getAvailableAbhaIds(): string[] {
  return Object.keys(DUMMY_DATA_MAP);
}

