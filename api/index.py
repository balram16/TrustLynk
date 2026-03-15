import os
import json
import re
import hashlib
import requests
import fitz  # PyMuPDF
import uvicorn
from datetime import datetime, timedelta
from dateutil.parser import parse as date_parse
from dateutil.relativedelta import relativedelta
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Tuple, Any
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

try:
    from groq import Groq
except ImportError:
    Groq = None

# --- Fileverse Audit Log Helper ---
FILEVERSE_API_URL = "http://localhost:8001"
FILEVERSE_API_KEY = os.getenv("FILEVERSE_API_KEY", "")

def save_audit_to_fileverse(result: dict, claim_id: str = "") -> None:
    """Save AI analysis result as an encrypted audit log on Fileverse. Non-blocking."""
    print(f"🔍 [Fileverse] save_audit_to_fileverse called for Claim: {claim_id}")
    import sys; sys.stdout.flush()
    if not FILEVERSE_API_KEY:
        print("[Fileverse] API key not set. Skipping audit log.")
        return
    try:
        audit_payload = {
            "claim_id": claim_id,
            "ai_score": result.get("aggregate_score"),
            "recommendation": result.get("recommendation"),
            "red_flags": result.get("red_flags", []),
            "reasoning": result.get("reasoning", ""),
            "pre_risk_score": result.get("pre_risk_score"),
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
        title = f"TrustLynk_Audit_{claim_id or 'claim'}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        resp = requests.post(
            f"{FILEVERSE_API_URL}/api/ddocs?apiKey={FILEVERSE_API_KEY}",
            headers={
                "Content-Type": "application/json",
            },
            json={"title": title, "content": json.dumps(audit_payload, indent=2)},
            timeout=10,
        )
        if resp.ok:
            data = resp.json().get("data", {})
            file_id = data.get("ddocId") if isinstance(data, dict) else ""
            print(f"✅ [Fileverse] Audit log saved. File ID: {file_id}")
            import sys; sys.stdout.flush()
        else:
            print(f"⚠️ [Fileverse] Audit log failed: {resp.status_code} - {resp.text[:200]}")
            import sys; sys.stdout.flush()
    except Exception as fv_err:
        print(f"⚠️ [Fileverse] Audit log exception (non-blocking): {fv_err}")
        import sys; sys.stdout.flush()


# --- FastAPI App ---
app = FastAPI(title="Decentralized Claim Verifier API")

# Enable CORS for frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class Diagnosis(BaseModel):
    code: str
    description: str

class AbhaRecord(BaseModel):
    abha_id: str
    name: str
    dob: str # Format: "DD-MM-YYYY" (Can be approximate)
    address: str
    past_diagnoses: List[Diagnosis] = Field(default_factory=list)
    medications: List[str] = Field(default_factory=list)

# --- Input models for the API endpoint ---
class ClaimRequest(BaseModel):
    ipfs_hash: str = Field(..., description="IPFS hash (CID) of the claim PDF.")
    abha_identifier: str = Field(..., description="Patient's Aadhaar/ABHA identifier.")


# --- Groq AI client initialization ---
try:
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise RuntimeError("GROQ_API_KEY is not set. Configure it in .env")
    if Groq is None:
        raise RuntimeError("groq package not installed. Run: pip install groq")

    client = Groq(api_key=groq_api_key)

    print("⏳ Testing Groq API connection...")
    test_chat = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": "Respond with a single word: OK"}],
        max_tokens=5
    )
    print(f"✅ Groq API is WORKING! Response: '{test_chat.choices[0].message.content.strip()}'")

except Exception as e:
    print(f"❌ Groq client NOT working. Error: {e}")
    client = None

# --- KNOWLEDGE BASES ---
DRUG_DIAGNOSIS_MAP = {
    "losartan": ["hypertension", "high blood pressure"],
    "methotrexate": ["arthritis", "rheumatoid arthritis", "psoriasis"],
    "albuterol": ["asthma", "copd"], "metformin": ["diabetes"],
}
DIAGNOSIS_AGE_RANGE = {
    "juvenile idiopathic arthritis": (0, 18), "alzheimer's": (60, 120),
    "hypertension": (20, 120), "asthma": (1, 120),
}

# --- MOCK DATABASES ---
MOCK_MEDICAL_COUNCIL_DB = {
    "MH-MC-11223": {"name": "Dr. Alok Deshpande", "status": "ACTIVE"},
    "MH-MC-54321": {"name": "Dr. Priya Sharma", "status": "ACTIVE"},
}
MOCK_PROVIDER_RISK_DB = {
    "MUMBAI ARTHRITIS & HEART CLINIC": {"risk_score": 5, "claims_processed": 1200},
    "PUNE RESPIRATORY CLINIC": {"risk_score": 2, "claims_processed": 4500},
}
MOCK_POLICY_DB = {
    "123456789012": {"policy_id": "POL-AAA", "waiting_period_days": 30, "sum_insured": 300000, "start_date": "01-07-2024"},
    "234567890123": {"policy_id": "POL-BBB", "waiting_period_days": 90, "sum_insured": 500000, "start_date": "15-03-2023"},
    "98-7654-3210-9876": {"policy_id": "POL-CCC", "waiting_period_days": 0, "sum_insured": 1000000, "start_date": "01-01-2020"},
}
MOCK_USER_CLAIM_HISTORY_DB = {
    "123456789012": [{"claim_date": "10-09-2025", "amount": 4500}, {"claim_date": "05-08-2025", "amount": 6000}],
    "98-7654-3210-9876": [{"claim_date": "15-06-2025", "amount": 5000}, {"claim_date": "02-03-2025", "amount": 3500}],
}
MOCK_DUPLICATE_HASH_DB = {
    "example_hash_12345": "Claim-001",
}

# --- Helper Function: Fetch PDF from IPFS ---
def fetch_pdf_from_ipfs(ipfs_hash: str) -> bytes:
    """Fetches PDF content from a public IPFS gateway."""
    gateway_url = f"https://ipfs.io/ipfs/{ipfs_hash}"
    print(f"Attempting to fetch PDF from: {gateway_url}")
    try:
        response = requests.get(gateway_url, timeout=60)
        response.raise_for_status()
        content_type = response.headers.get('Content-Type', '')
        print(f"IPFS response status: {response.status_code}, Content-Type: {content_type}")

        if 'pdf' not in content_type and 'octet-stream' not in content_type:
            content_disposition = response.headers.get('Content-Disposition', '')
            if not (content_disposition and '.pdf' in content_disposition.lower()):
                 print(f"Warning: Unexpected Content-Type from IPFS: {content_type}. Proceeding anyway.")

        pdf_content = response.content
        if not pdf_content:
             raise HTTPException(status_code=400, detail=f"IPFS fetch returned empty content (Hash: {ipfs_hash})")
        print(f"Successfully fetched {len(pdf_content)} bytes from IPFS.")
        return pdf_content
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail=f"Timeout fetching PDF from IPFS ({gateway_url})")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Could not fetch PDF from IPFS ({gateway_url}): {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing IPFS fetch: {e}")


# --- Helper Function: Extract Data from Large Dummy ABHA DB ---
def get_simplified_abha_data(database_filepath: str, identifier: str) -> Optional[dict]:
    try:
        with open(database_filepath, 'r', encoding='utf-8') as f:
            full_data = json.load(f)
    except Exception as e:
        print(f"Error reading/parsing dummy ABHA DB '{database_filepath}': {e}")
        return None

    patient_record = None
    for request in full_data.get("api_examples", {}).get("requests", []):
        data = request.get("example_response", {}).get("data", {})
        patient_info = data.get("patient_info", {})
        if patient_info.get("identifier") == identifier:
            patient_record = data
            break

    if not patient_record:
        return None # Identifier not found

    # Map to simple format
    patient_info = patient_record.get("patient_info", {})
    medical_history = patient_record.get("medical_history", {})
    recent_visits = patient_record.get("recent_visits", [])

    approx_dob_str = "N/A"
    age = patient_info.get("age")
    if age:
        try:
            birth_year = datetime.now().year - int(age)
            approx_dob_str = datetime(birth_year, 1, 1).strftime("%d-%m-%Y")
        except: pass

    addr = patient_info.get("address", {})
    full_address = f"{addr.get('city', '')}, {addr.get('state', '')} {addr.get('pincode', '')}".strip(', ')

    diagnoses_list = []
    seen_diags = set()
    conditions = medical_history.get("chronic_conditions", []) + [v.get("diagnosis") for v in recent_visits if v.get("diagnosis")]
    for condition in conditions:
        if condition and condition.lower() not in seen_diags:
            diagnoses_list.append({"code": "N/A", "description": condition})
            seen_diags.add(condition.lower())

    medications_list = []
    seen_meds = set()
    for visit in recent_visits:
        for med_string in visit.get("prescribed_medications", []):
             match = re.match(r"([a-zA-Z\s\-]+)", med_string)
             if match:
                 med_name = match.group(1).strip()
                 if med_name and med_name.lower() not in seen_meds:
                     medications_list.append(med_name)
                     seen_meds.add(med_name.lower())

    simplified_data = {
        "abha_id": patient_info.get("identifier", "N/A"),
        "name": patient_info.get("name", "N/A"),
        "dob": approx_dob_str,
        "address": full_address,
        "past_diagnoses": diagnoses_list,
        "medications": medications_list,
    }
    return simplified_data


# --- UPGRADED Rule Engine ---
class RuleEngine:
    def __init__(self, pdf_content: bytes, abha_data: AbhaRecord):
        self.pdf_content = pdf_content
        self.pdf_text = self._extract_text_from_pdf_internal()
        if not self.pdf_text:
             raise ValueError("Could not extract text from the provided PDF content. Is it an image PDF?")
        self.pdf_lower = self.pdf_text.lower()
        self.abha = abha_data

        self.risk_score = 0
        self.detailed_analysis = []
        self.red_flags = []

        self.extracted = {
            "total_amount": 0.0, "age": None, "bill_date": None,
            "provider_name": "UNKNOWN", "doc_reg_id": None,
            "diagnoses": [], "medications": [], "file_hash": None,
            "admission_date": None, "discharge_date": None,
        }
        self.policy = MOCK_POLICY_DB.get(abha_data.abha_id, {})

    def _extract_text_from_pdf_internal(self) -> str:
        text = ""
        try:
            with fitz.open(stream=self.pdf_content, filetype="pdf") as doc:
                for page in doc:
                    page_text = page.get_text("text") 
                    if page_text:
                        text += page_text
        except Exception as e:
            print(f"Error extracting PDF text internally: {e}")
            return ""
        return text

    def run_all_checks(self) -> Tuple[int, List[str], List[str]]:
        self._extract_data_from_pdf() 

        checks_to_run = [
            self._check_identity, self._check_medical_history, self._check_medication_disease_consistency,
            self._check_age_vs_disease, self._check_treatment_duration, self._check_invoice_structure,
            self._check_lab_result_consistency, self._check_icd_code_consistency, self._check_policy_compliance,
            self._check_prescriber_authenticity, self._check_provider_behavior, self._check_outlier_pricing,
            self._check_claim_frequency, self._check_previous_diagnosis_conflict, self._check_medication_refill_velocity,
            self._check_document_tampering, self._check_duplicate_document, self._add_placeholders_for_other_rules
        ]
        for check_func in checks_to_run:
            try: check_func()
            except Exception as e:
                rule_name = check_func.__name__; self.detailed_analysis.append(f"Analysis ({rule_name}): FAILED with error: {e}"); self.risk_score += 5
        return self.risk_score, self.detailed_analysis, self.red_flags

    def _extract_data_from_pdf(self):
        try: self.extracted["age"] = relativedelta(datetime.now(), date_parse(self.abha.dob, dayfirst=True)).years
        except: pass
        self.extracted["file_hash"] = hashlib.sha256(self.pdf_content).hexdigest()
        lines = self.pdf_text.split('\n'); provider_found = False
        for i in range(min(5, len(lines))):
             line_upper = lines[i].strip().upper()
             if "CLINIC" in line_upper or "HOSPITAL" in line_upper or "MEDICAL CENTER" in line_upper:
                 self.extracted["provider_name"] = line_upper; provider_found = True; break
        if not provider_found and len(lines) > 1: self.extracted["provider_name"] = lines[1].strip().upper() 
        total_match = re.search(r"(net amount|total amount|net payable).*?([\d,]+\.?\d{2})", self.pdf_lower, re.DOTALL | re.IGNORECASE)
        if total_match:
            try: self.extracted["total_amount"] = float(total_match.group(2).replace(",", ""))
            except: pass
        date_match = re.search(r"(?:bill|invoice)\s*date:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{4})", self.pdf_lower)
        if date_match:
            try: self.extracted["bill_date"] = date_parse(date_match.group(1).replace('/', '-'), dayfirst=True)
            except: pass
        reg_match = re.search(r"reg(?:istration)?\.?\s*id:?\s*([A-Za-z0-9/\-]+)", self.pdf_text, re.IGNORECASE) 
        if reg_match: self.extracted["doc_reg_id"] = reg_match.group(1).upper()
        diag_patterns = [r"diagnosis:?\s*(?:[A-Z]\d{2}(?:\.\d+)?)\s*-\s*([\w\s\(\),/\-]+)", r"primary diagnosis:?\s*([\w\s\(\),/\-]+)", r"secondary diagnosis:?\s*([\w\s\(\),/\-]+)", r"provisional diagnosis:?\s*([\w\s\(\),/\-]+)"]
        found_diags = set();
        for pattern in diag_patterns:
            for match in re.finditer(pattern, self.pdf_text, re.IGNORECASE):
                diag_text = match.group(1).strip().lower(); diag_text = re.sub(r'\((primary|secondary)\)', '', diag_text).strip();
                if diag_text and len(diag_text) > 3: found_diags.add(diag_text)
        self.extracted["diagnoses"] = list(found_diags)
        med_patterns = [r"medicine:?\s*([\w\s\-\(\)\+]+?)\s*(?:\(|tab|mg|inj|unit|cream|suspension|\d)", r"rx only\s*([\w\s\-\+]+)", r"prescribed_medications\":\s*\[\"([\w\s\d]+)"]
        found_meds = set(); ignore_words = {"description", "sr. no.", "medicine:", "dosage", "quantity", "amount", "total", "consultation", "test", "procedure", "fee", "charges", "room", "nursing", "tax", "gst", "paid", "therapy", "counseling", "sessions", "exercises"}
        for pattern in med_patterns:
             for match in re.finditer(pattern, self.pdf_text, re.IGNORECASE):
                 med_name = match.group(1).strip().lower(); med_name_cleaned = re.sub(r'\s*\d+.*', '', med_name).strip()
                 is_ignored = any(word == med_name_cleaned for word in ignore_words) or any(word in med_name_cleaned.split() for word in ignore_words)
                 if med_name_cleaned and len(med_name_cleaned) > 3 and not is_ignored: found_meds.add(med_name_cleaned)
        self.extracted["medications"] = list(found_meds)

    def _check_identity(self): 
        alerts = [];
        if self.abha.name.lower() not in self.pdf_lower: alerts.append("Name Mismatch")
        if self.abha.dob not in self.pdf_text: alerts.append("DOB Mismatch")
        try:
            abha_city = self.abha.address.split(',')[-1].strip().lower()
            if abha_city not in self.pdf_lower: alerts.append(f"City Mismatch ('{abha_city}')")
        except: pass
        if alerts: self.risk_score += 30; self.red_flags.append(f"Identity Warn: {', '.join(alerts)}")
        self.detailed_analysis.append("Analysis (Rule 1): Checked Bill vs ABHA identity (Name, DOB, City).")

    def _check_medical_history(self): 
        abha_diags_desc = [d.description.lower() for d in self.abha.past_diagnoses]; abha_meds = [m.lower() for m in self.abha.medications]; alerts_diag = []; alerts_med = []
        pdf_diags_found = {diag: False for diag in self.extracted["diagnoses"]}
        for pdf_diag in self.extracted["diagnoses"]:
            found_in_abha = any(pdf_diag in abha_diag for abha_diag in abha_diags_desc);
            if not found_in_abha: alerts_diag.append(pdf_diag)
            pdf_diags_found[pdf_diag] = found_in_abha
        if alerts_diag: self.risk_score += 15; self.red_flags.append(f"History Mismatch (Diagnosis): '{', '.join(alerts_diag)}' not in ABHA history.")
        self.detailed_analysis.append(f"Analysis (Rule 2a - Diagnoses): Checked PDF diagnoses vs ABHA. Matches: {pdf_diags_found}")
        pdf_meds_found = {med: False for med in self.extracted["medications"]}
        for pdf_med in self.extracted["medications"]:
             found_in_abha = pdf_med in abha_meds;
             if not found_in_abha: alerts_med.append(pdf_med)
             pdf_meds_found[pdf_med] = found_in_abha
        if alerts_med: self.risk_score += 10; self.red_flags.append(f"History Mismatch (Medication): '{', '.join(alerts_med)}' not in ABHA history.")
        self.detailed_analysis.append(f"Analysis (Rule 2b - Medications): Checked PDF medications vs ABHA. Matches: {pdf_meds_found}")

    def _check_medication_disease_consistency(self): 
        if not self.extracted["medications"] or not self.extracted["diagnoses"]: return; alerts = []
        for med in self.extracted["medications"]:
            med_key = med.split(' ')[0];
            if med_key in DRUG_DIAGNOSIS_MAP:
                valid_diags_keywords = DRUG_DIAGNOSIS_MAP[med_key];
                is_valid = any(kw in pdf_diag for kw in valid_diags_keywords for pdf_diag in self.extracted["diagnoses"])
                if not is_valid: alerts.append(f"'{med}' vs {self.extracted['diagnoses']}")
        if alerts: self.risk_score += 10; self.red_flags.append(f"Logic Warn (Drug-Disease): Mismatches found - {'; '.join(alerts)}.")
        self.detailed_analysis.append("Analysis (Rule 5): Checked Medication vs. Diagnosis consistency on the bill.")

    def _check_age_vs_disease(self): 
        age = self.extracted["age"];
        if not age or not self.extracted["diagnoses"]: return;
        main_diag = self.extracted["diagnoses"][0];
        if main_diag in DIAGNOSIS_AGE_RANGE:
            min_age, max_age = DIAGNOSIS_AGE_RANGE[main_diag];
            if not (min_age <= age <= max_age): self.risk_score += 40; self.red_flags.append(f"Logic Fail (Age-Disease): Patient age ({age}) is not plausible for '{main_diag}' (Expected: {min_age}-{max_age}).")
        self.detailed_analysis.append(f"Analysis (Rule 19): Checked Age ({age}) vs. Primary Diagnosis ('{main_diag}').")

    def _check_treatment_duration(self): 
        if "opd" in self.pdf_lower or "outpatient" in self.pdf_lower or "consultation" in self.pdf_lower: self.detailed_analysis.append("Analysis (Rule 6): Treatment duration identified as 'OPD' (plausible).")
        elif self.extracted["admission_date"] and self.extracted["discharge_date"]: self.detailed_analysis.append("Analysis (Rule 6): SKIPPED - In-patient duration logic vs diagnosis not yet implemented.")
        else: self.risk_score += 5; self.red_flags.append("Logic Warn: Treatment type (OPD/In-patient) is unclear from PDF."); self.detailed_analysis.append("Analysis (Rule 6): Could not clearly determine treatment duration type (OPD/Inpatient).")

    def _check_invoice_structure(self): 
        missing = [];
        if not re.search(r"bill id|invoice no", self.pdf_lower): missing.append("Bill ID")
        if not re.search(r"patient name", self.pdf_lower): missing.append("Patient Name")
        if self.extracted["total_amount"] == 0: missing.append("Total Amount")
        if not re.search(r"doctor|dr\.", self.pdf_lower): missing.append("Doctor Details")
        if self.extracted["provider_name"] == "UNKNOWN": missing.append("Provider Name")
        if not re.search(r"date of birth|dob", self.pdf_lower) and self.abha.dob not in self.pdf_text: missing.append("Patient DOB")
        if missing: self.risk_score += 10; self.red_flags.append(f"Authenticity Warn (Invoice Structure): Missing standard fields: {', '.join(missing)}.");
        self.detailed_analysis.append("Analysis (Rule 22): Checked basic invoice structure.")

    def _check_lab_result_consistency(self): 
        alerts = []; has_asthma = any("asthma" in d for d in self.extracted["diagnoses"]); has_hypertension = any("hypertension" in d for d in self.extracted["diagnoses"]); has_diabetes = any("diabetes" in d for d in self.extracted["diagnoses"]);
        mentions_spirometry = "spirometry" in self.pdf_lower or "pft" in self.pdf_lower; mentions_bp = "blood pressure" in self.pdf_lower or " bp " in self.pdf_lower; mentions_hba1c = "hba1c" in self.pdf_lower or "glycated hemoglobin" in self.pdf_lower;
        if has_asthma and not mentions_spirometry: alerts.append("Spirometry/PFT for Asthma")
        if has_hypertension and not mentions_bp: alerts.append("BP Check for Hypertension")
        if has_diabetes and not mentions_hba1c: alerts.append("HbA1c for Diabetes")
        if alerts: self.risk_score += 5; self.red_flags.append(f"Logic Warn (Lab Consistency): Expected tests missing: {', '.join(alerts)}.");
        self.detailed_analysis.append("Analysis (Rule 20): Checked for expected tests based on diagnosis.")

    def _check_icd_code_consistency(self): 
        found_codes = re.findall(r"([A-Z]\d{2}(?:\.\d+)?)", self.pdf_text); alerts = []
        if not found_codes: self.risk_score += 5; self.red_flags.append("Authenticity Warn: No valid ICD-10 codes found."); self.detailed_analysis.append("Analysis (Rule 15): No ICD codes found."); return
        if "J45" in found_codes and not any("asthma" in d for d in self.extracted["diagnoses"]): alerts.append("J45 code present but 'Asthma' diagnosis missing/mismatched")
        if "I10" in found_codes and not any("hypertension" in d for d in self.extracted["diagnoses"]): alerts.append("I10 code present but 'Hypertension' diagnosis missing/mismatched")
        if "M08" in found_codes and not any("arthritis" in d for d in self.extracted["diagnoses"]): alerts.append("M08 code present but 'Arthritis' diagnosis missing/mismatched")
        if alerts: self.risk_score += 10; self.red_flags.append(f"Logic Warn (ICD Consistency): Issues found - {'; '.join(alerts)}.");
        self.detailed_analysis.append(f"Analysis (Rule 15): Checked ICD codes vs diagnosis text. Codes Found: {found_codes}")

    def _check_policy_compliance(self): 
        if not self.policy: self.detailed_analysis.append("Analysis (Rule 29): SKIPPED - Policy data not found for user in Mock DB."); return; alerts = []
        try:
            wait_days = self.policy.get("waiting_period_days", 30); policy_start = date_parse(self.policy.get("start_date", "1900-01-01")); claim_date = self.extracted["bill_date"] or datetime.now(); sum_insured = self.policy.get("sum_insured", float('inf'));
            if (claim_date - policy_start).days < wait_days: alerts.append(f"Claim within {wait_days}-day waiting period")
            if self.extracted["total_amount"] > sum_insured: alerts.append(f"Amount > Sum Insured (₹{sum_insured})")
            if alerts: self.risk_score += 100; self.red_flags.append(f"Policy Fail: {'; '.join(alerts)}.");
            self.detailed_analysis.append("Analysis (Rule 29): Checked policy compliance (Waiting Period, Sum Insured).")
        except Exception as e: self.detailed_analysis.append(f"Analysis (Rule 29): ERROR during policy check - {e}")

    def _check_prescriber_authenticity(self): 
        reg_id = self.extracted["doc_reg_id"];
        if not reg_id: self.detailed_analysis.append("Analysis (Rule 14): SKIPPED - Doctor Registration ID not found on PDF."); return;
        doc_info = MOCK_MEDICAL_COUNCIL_DB.get(reg_id);
        if not doc_info: self.risk_score += 10; self.red_flags.append(f"Authenticity Warn: Doctor's license ({reg_id}) could not be verified in Mock Council DB.")
        elif doc_info.get("status") == "SUSPENDED": self.risk_score += 50; self.red_flags.append(f"Authenticity Fail: Doctor's license ({reg_id} - {doc_info.get('name')}) is SUSPENDED.")
        self.detailed_analysis.append(f"Analysis (Rule 14): Checked doctor's license status ({reg_id}) via Mock Council DB.")

    def _check_provider_behavior(self): 
        provider = self.extracted["provider_name"];
        if provider == "UNKNOWN": self.detailed_analysis.append("Analysis (Rule 7): SKIPPED - Provider name not clearly extracted from PDF."); return;
        risk_data = MOCK_PROVIDER_RISK_DB.get(provider);
        if not risk_data: self.risk_score += 5; self.red_flags.append(f"External Warn: Provider '{provider}' not found in Mock Risk DB.")
        else:
            provider_risk = risk_data.get("risk_score", 0);
            if provider_risk > 80: self.risk_score += 30; self.red_flags.append(f"External Risk: Provider '{provider}' has a high fraud risk score ({provider_risk}).")
            elif provider_risk > 50: self.risk_score += 15; self.red_flags.append(f"External Warn: Provider '{provider}' has moderate fraud risk ({provider_risk}).")
        self.detailed_analysis.append(f"Analysis (Rule 7): Checked provider '{provider}' risk score via Mock Risk DB.")

    def _check_outlier_pricing(self): 
        self.detailed_analysis.append("Analysis (Rule 26): SKIPPED - Outlier line-item pricing (requires detailed line item extraction & standard pricing DB).")

    def _check_claim_frequency(self): 
        history = MOCK_USER_CLAIM_HISTORY_DB.get(self.abha.abha_id, []);
        if not history or not self.extracted["bill_date"]: self.detailed_analysis.append("Analysis (Rule 4): Checked claim frequency (No prior history or bill date)."); return;
        claims_in_last_month = 0; current_claim_date = self.extracted["bill_date"];
        for claim in history:
            try:
                past_claim_date = date_parse(claim["claim_date"], dayfirst=True)
                if 0 < (current_claim_date - past_claim_date).days <= 30: claims_in_last_month += 1
            except: continue
        if claims_in_last_month >= 2: self.risk_score += 20; self.red_flags.append(f"History Risk: High claim frequency ({claims_in_last_month + 1} claims within ~30 days).");
        self.detailed_analysis.append(f"Analysis (Rule 4): Checked claim frequency ({claims_in_last_month} other claims in ~30 days found in Mock History).")

    def _check_previous_diagnosis_conflict(self): 
        abha_diags_str = " ".join(d.description.lower() for d in self.abha.past_diagnoses); pdf_diags_str = " ".join(self.extracted["diagnoses"]); is_unrelated = False
        if "arthritis" in pdf_diags_str and "arthritis" not in abha_diags_str and "diabetes" in abha_diags_str: is_unrelated = True
        if "cancer" in pdf_diags_str and "cancer" not in abha_diags_str and "hypertension" in abha_diags_str: is_unrelated = True
        if is_unrelated: self.risk_score += 10; self.red_flags.append("History Warn: Claim diagnosis seems unrelated to known chronic conditions in ABHA.");
        self.detailed_analysis.append("Analysis (Rule 12): Basic check for conflict between new claim and chronic history.")

    def _check_medication_refill_velocity(self): 
        self.detailed_analysis.append("Analysis (Rule 13): SKIPPED - Medication refill velocity (needs historical prescription DB).")

    def _check_document_tampering(self): 
        non_ascii_count = len(re.findall(r'[^\x00-\x7F\s]', self.pdf_text));
        if non_ascii_count > 20: self.risk_score += 5; self.red_flags.append(f"Authenticity Warn (Tampering?): High count ({non_ascii_count}) of unusual characters found.");
        self.detailed_analysis.append("Analysis (Rule 8): Basic check for signs of document tampering (unusual character count).")

    def _check_duplicate_document(self): 
        file_hash = self.extracted["file_hash"];
        if file_hash in MOCK_DUPLICATE_HASH_DB: self.risk_score += 100; self.red_flags.append(f"Authenticity Fail (Duplicate): Document hash {file_hash[:8]}... found in Mock DB (Claim {MOCK_DUPLICATE_HASH_DB[file_hash]}).")
        self.detailed_analysis.append("Analysis (Rule 10): Checked document hash against Mock Duplicate DB.")

    def _add_placeholders_for_other_rules(self):
        # User requested to remove placeholders for rules 9, 11, 16, 17, 18, 21, 23, 24, 25, 27, 28
        self.detailed_analysis.append("Analysis (Rule 30): PASSED - Explainability provided via this detailed analysis.")


# --- Helper Function 4: Groq AI ---
def get_ai_score_and_reasoning(
    pre_risk_score: int,
    detailed_analysis: List[str],
    red_flags: List[str],
    extracted_data: Dict[str, Any]
) -> Tuple[int, str, str]:

    if not client:
        rec = "PENDING REVIEW"; score = pre_risk_score
        if pre_risk_score >= 100 or any("Fail" in flag for flag in red_flags): rec = "REJECT"; score = max(score, 85)
        elif pre_risk_score == 0 and not red_flags: rec = "APPROVE"; score = min(score, 25)
        return score, "AI Error: Groq client not initialized. Recommendation based on rule score.", rec

    prompt = f"""
    Analyze the insurance claim based on the Rule Engine's findings. Provide a final aggregate_score (0-100), reasoning, and recommendation ('APPROVE', 'REJECT', 'PENDING REVIEW').

    **Scoring Guide (Low Score = Good):**
    * 0-30: APPROVE (Low risk - ONLY if ZERO red flags of any kind)
    * 31-70: PENDING REVIEW (Moderate risk, any warnings present, or requires human check)
    * 71-100: REJECT (High risk or rule failures - "Fail" flags present)

    **Input Data:**
    1.  **Rule Engine Risk Score:** {pre_risk_score} (0=Low, 100+=Very High)
    2.  **Red Flags Found:** {json.dumps(red_flags)}
    3.  **Extracted PDF Data:** {json.dumps(extracted_data, default=str)}

    **Your Task:**
    1.  **Cost Plausibility:** Assess if the 'total_amount' (₹{extracted_data.get('total_amount', 0)}) is reasonable for the primary 'diagnosis' ('{(extracted_data.get('diagnoses') or ["N/A"])[0]}'). Use general Indian medical cost knowledge.
    2.  **Recommendation Logic (STRICT):**
        * If any red flag contains "Fail" OR pre_risk_score >= 100: You MUST Recommend REJECT.
        * If NO red flags exist AND pre_risk_score == 0 AND cost is plausible: Recommend APPROVE.
        * In ALL OTHER CASES (any "Warn", "Mismatch", "External" flags, or pre_risk_score > 0): Recommend PENDING REVIEW.
    3.  **Final Score:** Assign a score (0-100) consistent with your recommendation.
    4.  **Reasoning:** Summarize all key factors clearly. Be specific about what triggered each concern.

    **Output (JSON only, no markdown):**
    {{"aggregate_score": <score>, "reasoning": "<your detailed summary>", "recommendation": "<APPROVE|REJECT|PENDING REVIEW>"}}
    """

    try:

        chat = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert insurance fraud detection AI. Always respond in valid JSON exactly as requested."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.1,
            max_tokens=1024,
            response_format={"type": "json_object"}
        )
        response_content = chat.choices[0].message.content
        response_json = json.loads(response_content)

        rec = response_json.get("recommendation", "REJECT").upper()
        score = int(response_json.get("aggregate_score", 99))
        reason = response_json.get("reasoning", "AI did not provide reasoning.")

        if rec == "APPROVE" and score > 30: score = 25
        elif rec == "PENDING REVIEW" and (score < 31 or score > 70): score = 50
        elif rec == "REJECT" and score < 71: score = 85

        return score, reason, rec

    except Exception as e:
        print(f"Groq API error: {e}")
        rec = "PENDING REVIEW"
        if pre_risk_score >= 100 or any("Fail" in flag for flag in red_flags): rec = "REJECT"
        elif pre_risk_score == 0 and not red_flags: rec = "APPROVE"
        fail_score = max(0, min(100, pre_risk_score))
        return fail_score, f"AI Error: {e}. Recommendation based on rule score.", rec


# --- MAIN API ENDPOINT ---
@app.post("/verify-claim/")
async def verify_claim(request: ClaimRequest):
    print(f"\n{'─'*60}")
    print(f"📥 NEW CLAIM REQUEST")
    print(f"   ABHA ID  : {request.abha_identifier}")
    print(f"   IPFS Hash: {request.ipfs_hash}")
    print('─'*60)

    try:
        pdf_content = fetch_pdf_from_ipfs(request.ipfs_hash)
        simplified_abha_dict = get_simplified_abha_data("dummy_abha_database.json", request.abha_identifier)

        if not simplified_abha_dict:
            print(f"Error: ABHA Identifier '{request.abha_identifier}' not found.")
            raise HTTPException(status_code=404, detail=f"ABHA Identifier '{request.abha_identifier}' not found.")

        abha_data = AbhaRecord(**simplified_abha_dict)
        print(f"Successfully fetched and parsed ABHA data for {abha_data.name}.")

    except HTTPException as e:
        raise e 
    except Exception as e:
        print(f"Error during input processing: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid Input or DB Error: {e}")

    try:
        print("Initializing Rule Engine...")
        engine = RuleEngine(pdf_content, abha_data)
        print("Running all checks...")
        pre_risk_score, detailed_analysis, red_flags = engine.run_all_checks()
        print(f"Rule Engine finished. Pre-risk score: {pre_risk_score}, Red Flags: {len(red_flags)}")
    except ValueError as e: 
        print(f"Error: Rule Engine failed on PDF extraction: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error: Unexpected error during rule execution: {e}")
        raise HTTPException(status_code=500, detail=f"Error during rule execution: {e}")

    print("Getting AI score and reasoning...")
    final_score, final_reasoning, final_recommendation = get_ai_score_and_reasoning(
        pre_risk_score, detailed_analysis, red_flags, engine.extracted
    )
    print(f"AI Result - Score: {final_score}, Recommendation: {final_recommendation}")

    ex = engine.extracted  # shorthand

    # ── Helpers ──────────────────────────────────────────────────────────────
    def yn(val):
        if val is True:  return "✅ YES"
        if val is False: return "❌ NO"
        return str(val) if val not in (None, "") else "N/A"

    def section(title):
        print(f"\n{'─'*60}")
        print(f"  {title}")
        print('─'*60)

    # ── Header ────────────────────────────────────────────────────────────────
    decision_icon = {"APPROVE": "✅", "PENDING REVIEW": "⚠️ ", "REJECT": "🚫"}.get(final_recommendation, "❓")
    print("\n" + "═"*60)
    print(f"  📊  CLAIM ANALYSIS COMPLETE  {decision_icon} {final_recommendation}")
    print("═"*60)
    print(f"  ABHA ID      : {request.abha_identifier}")
    print(f"  IPFS Hash    : {request.ipfs_hash}")

    # ── Patient / ABHA ────────────────────────────────────────────────────────
    section("👤 PATIENT INFO (ABHA Record)")
    abha = simplified_abha_dict or {}
    print(f"  Name         : {abha.get('name', 'N/A')}")
    print(f"  DOB / Age    : {abha.get('dob', 'N/A')}  |  Claimed age: {ex.get('patient_age', 'N/A')}")
    print(f"  Gender       : {yn(abha.get('gender', 'N/A'))}  |  Policy gender: {ex.get('patient_gender', 'N/A')}")
    print(f"  Blood Group  : {abha.get('blood_group', 'N/A')}")
    print(f"  Existing Cond: {', '.join(abha.get('existing_conditions', [])) or 'None listed'}")
    print(f"  Policy Type  : {abha.get('policy_type', 'N/A')}")
    print(f"  Policy Since : {abha.get('policy_start_date', 'N/A')}  (waiting period: {abha.get('waiting_period_months', '?')} months)")
    print(f"  Prior Claims : {abha.get('prior_claims_count', 0)}")

    # ── Extracted PDF Data ────────────────────────────────────────────────────
    section("📄 EXTRACTED FROM PDF DOCUMENT")
    print(f"  Hospital     : {ex.get('hospital_name', 'N/A')}")
    print(f"  Patient Name : {ex.get('patient_name', 'N/A')}")
    print(f"  Admission    : {ex.get('admission_date', 'N/A')}  →  Discharge: {ex.get('discharge_date', 'N/A')}")
    days = ex.get('days_in_hospital', 'N/A')
    print(f"  Stay (days)  : {days}")
    diagnoses = ex.get('diagnoses') or []
    print(f"  Diagnoses    : {', '.join(diagnoses) if diagnoses else 'None extracted'}")
    procedures = ex.get('procedures') or []
    print(f"  Procedures   : {', '.join(procedures) if procedures else 'None extracted'}")
    print(f"  Total Bill   : ₹{ex.get('total_amount', 'N/A')}")
    print(f"  Breakdown    : Room ₹{ex.get('room_charges', 'N/A')}  |  Surg ₹{ex.get('surgery_charges', 'N/A')}  |  Meds ₹{ex.get('medicine_charges', 'N/A')}")
    print(f"  Doctor Sig   : {yn(ex.get('has_doctor_signature'))}")
    print(f"  Hospital Seal: {yn(ex.get('has_hospital_seal'))}")
    print(f"  File Hash    : {str(ex.get('file_hash', 'N/A'))[:24]}...")

    # ── Scores ────────────────────────────────────────────────────────────────
    section("🎯 SCORES & DECISION")
    print(f"  Rule Engine  : {pre_risk_score:>4}/100")
    print(f"  Groq AI      : {final_score:>4}/100  →  {decision_icon} {final_recommendation}")
    band = "🟢 LOW RISK" if final_score <= 30 else ("🟡 MEDIUM RISK" if final_score <= 70 else "🔴 HIGH RISK")
    print(f"  Risk Band    : {band}")

    # ── Red Flags ─────────────────────────────────────────────────────────────
    section(f"🚩 RED FLAGS  ({len(red_flags)} found)")
    if red_flags:
        for i, flag in enumerate(red_flags, 1):
            print(f"  {i:>2}. {flag}")
    else:
        print("  None — all checks passed!")

    # ── Rule Analysis Steps ───────────────────────────────────────────────────
    section(f"🔍 RULE-BY-RULE ANALYSIS  ({len(detailed_analysis)} checks)")
    for step in detailed_analysis:
        icon = "⚠️ " if "Warn" in step or "Mismatch" in step else ("❌ " if "Fail" in step or "SKIPPED" in step else "✅ ")
        print(f"  {icon} {step}")

    # ── AI Reasoning ──────────────────────────────────────────────────────────
    section("🤖 GROQ AI REASONING")
    for part in final_reasoning.replace('\n', ' ').split('. '):
        part = part.strip()
        if part:
            print(f"  • {part}.")

    print("\n" + "═"*60 + "\n")



    hard_failure = pre_risk_score >= 120 or any("Fail" in flag for flag in red_flags)
    if hard_failure and final_recommendation != "REJECT":
        print(f"Overriding AI recommendation. Hard failure detected (Score: {pre_risk_score}, Flags: {red_flags})")
        final_score = max(final_score, 85) 
        final_recommendation = "REJECT"
        final_reasoning = f"[AUTO-REJECTED due to hard rule failure]. AI Reason: {final_reasoning}"

    print("Sending final response.")
    result = {
        "aggregate_score": final_score,
        "reasoning": final_reasoning,
        "recommendation": final_recommendation,
        "pre_risk_score": pre_risk_score,
        "red_flags": red_flags,
        "detailed_analysis_steps": detailed_analysis,
        "extracted_data_points": engine.extracted,
        "simplified_abha_data_used": simplified_abha_dict
    }

    # --- Save encrypted AI audit log to Fileverse (non-blocking) ---
    save_audit_to_fileverse(result, claim_id=request.abha_identifier or "unknown")
    # ---------------------------------------------------------------

    return result

# --- Server Run Command ---
if __name__ == "__main__":
    db_file = "dummy_abha_database.json"
    if not os.path.exists(db_file):
        print(f"\nERROR: '{db_file}' file not found.")
    else:
        print(f"Found '{db_file}'. Starting server...")
        uvicorn.run(app, host="0.0.0.0", port=8000)
