# ABDM Mock Service

Mock ABDM (Ayushman Bharat Digital Mission) service for testing health record integration.

## Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the service
python app.py
```

The service will start on `http://localhost:5000`

## API Endpoints

### Get Health Records

```
GET /api/v1/health-records?identifier=ABHA1234567890
```

**Parameters:**
- `identifier`: ABHA ID (14 characters: ABHA + 10 digits) or Aadhaar number (12 digits)

**Response:**
```json
{
  "status": "success",
  "message": "Health records retrieved successfully",
  "data": {
    "patient_info": {...},
    "medical_history": {...},
    "recent_visits": [...],
    "laboratory_results": {...},
    "insurance_info": {...}
  }
}
```

## Testing

Use curl or any HTTP client:

```bash
# Test with ABHA ID
curl "http://localhost:5000/api/v1/health-records?identifier=ABHA1234567890"

# Test with Aadhaar
curl "http://localhost:5000/api/v1/health-records?identifier=123456789012"
```

## Notes

- This is a mock service for development/testing only
- It generates consistent dummy data based on the identifier
- In production, replace with real ABDM API integration



