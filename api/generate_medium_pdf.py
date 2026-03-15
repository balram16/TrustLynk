from fpdf import FPDF
import datetime

class PDF(FPDF):
    def header(self):
        self.set_font("Arial", 'B', 15)
        self.cell(0, 10, "XYZ CLINIC", ln=True, align="C")
        self.set_font("Arial", 'I', 10)
        self.cell(0, 5, "Phone: +91-800-555-0199 | Reg. No: MH-MC-99999", ln=True, align="C")
        self.ln(10)

def create_medium_risk_bill():
    pdf = PDF()
    pdf.add_page()
    
    # Trigger 1: Identity & City Mismatch (Rule 1)
    # The dummy DB says: Name="Rahul Sharma", Gender="M", YOB="1985", City="Mumbai"
    # We use a slightly wrong name and city to trigger low-level flags
    pdf.set_font("Arial", 'B', 12)
    pdf.set_fill_color(230, 230, 230)
    pdf.cell(0, 8, " PATIENT INFORMATION", border=1, ln=True, fill=True)
    
    pdf.set_font("Arial", '', 10)
    pdf.cell(95, 8, " Name: Rahul V. Sharma", border=1)  # Mismatch 1
    pdf.cell(95, 8, " ABHA ID: 12-3456-7890-12", border=1, ln=True)
    
    pdf.cell(95, 8, " DOB: 14-Aug-1985", border=1)      # Matches
    pdf.cell(95, 8, " Gender: M", border=1, ln=True)
    
    pdf.cell(190, 8, " Address: Pune, Maharashtra", border=1, ln=True) # Mismatch 2 (City mismatch)
    pdf.ln(5)

    # Trigger 2: Date logic
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(0, 8, " INVOICE DETAILS", border=1, ln=True, fill=True)
    
    pdf.set_font("Arial", '', 10)
    pdf.cell(95, 8, " Invoice No: CHH-2025-8899", border=1)
    pdf.cell(95, 8, " Invoice Date: 20-Oct-2025", border=1, ln=True) 
    
    pdf.cell(95, 8, " Admission: 12-Oct-2025", border=1)
    pdf.cell(95, 8, " Discharge: 15-Oct-2025", border=1, ln=True)
    pdf.ln(5)

    # Trigger 3: Unverifiable Provider (Rule 7) and Suspended Doctor (Rule 14)
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(0, 8, " MEDICAL DETAILS", border=1, ln=True, fill=True)
    
    pdf.set_font("Arial", '', 10)
    # Using 'hypertension' without 'bp check' triggers Lab Consistency Logic Warn (Rule 20)
    pdf.cell(190, 8, " Primary Diagnosis: Hypertension", border=1, ln=True)
    # Using a fake registration ID to trigger Authenticity Warn (Rule 14)
    pdf.cell(190, 8, " Attending Physician: Dr. Unknown (Reg: MH-MC-99999)", border=1, ln=True)
    pdf.ln(5)

    # 4. Add Billing Items
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(0, 8, " BILLING BREAKDOWN", border=1, ln=True, fill=True)
    
    pdf.set_font("Arial", 'B', 10)
    pdf.cell(15, 8, "S.No", border=1)
    pdf.cell(100, 8, "Description", border=1)
    pdf.cell(25, 8, "Qty", border=1, align="C")
    pdf.cell(50, 8, "Amount (INR)", border=1, align="R")
    pdf.ln(8)
    
    pdf.set_font("Arial", '', 10)
    
    items = [
        ("Room Rent", 3, 15000),     
        ("Doctor Consultation", 4, 8000),     
        ("Pharmacy", 5, 8500)
    ]
    
    total = 0
    for i, (desc, qty, amount) in enumerate(items, 1):
        pdf.cell(15, 8, f" {i}", border=1)
        pdf.cell(100, 8, f" {desc}", border=1)
        pdf.cell(25, 8, f"{qty}", border=1, align="C")
        pdf.cell(50, 8, f"{amount:,.2f} ", border=1, align="R")
        pdf.ln(8)
        total += amount

    # 5. Add Total Block
    pdf.set_font("Arial", 'B', 11)
    pdf.cell(140, 10, "GRAND TOTAL", border=1, align="R")
    pdf.cell(50, 10, f"INR {total:,.2f} ", border=1, align="R", ln=True)
    
    pdf.ln(10)
    pdf.set_font("Arial", 'I', 9)
    pdf.cell(0, 5, "* This is a computer-generated invoice and does not require a signature.", ln=True)

    filename = "medical_bill_medium.pdf"
    pdf.output(filename)
    print(f"Generated {filename} tailored for PENDING status (Score ~45).")

if __name__ == "__main__":
    create_medium_risk_bill()
