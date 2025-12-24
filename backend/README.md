# Pegadaian AI Backend API

Backend service for automated pawn assessment system using AI with two main pipelines: Financial Validation and Visual Appraiser.

## Tech Stack

- Node.js + Express
- Google Gemini AI (Vision + Text)
- Security: Helmet, Rate Limiting, Express Validator
- File Upload: Multer

## Setup & Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Rename `.env.example` to `.env` then Edit `.env` file:

```env
PORT=5000
NODE_ENV=development
GEMINI_API_KEY=your_actual_gemini_api_key_here
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

**How to Get Gemini API Key:**
1. Visit: https://aistudio.google.com/app/apikey
2. Login with Google account
3. Click "Create API Key"
4. Copy the key and paste it into `.env`

### 3. Start Server

```bash
npm run dev
```

Server will run at `http://localhost:5000`

## Architecture

```
backend/
├── src/
│   ├── index.js                 # Main server
│   ├── config/
│   │   └── gemini.js           # Gemini AI configuration
│   ├── middleware/
│   │   ├── upload.js           # File upload + validation
│   │   ├── rateLimiter.js      # Rate limiting
│   │   ├── validator.js        # Input validation
│   │   └── errorHandler.js     # Error handling
│   ├── routes/
│   │   ├── financialValidation.js
│   │   └── visualAppraiser.js
│   └── services/
│       ├── financialValidationService.js
│       └── visualAppraiserService.js
```

---

## API Endpoints

### 1. Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-12-23T10:30:00.000Z"
}
```

---

### 2. Pipeline A: Financial Validation

Validates customer's financial documents based on SLIK and Salary Slip.

#### Endpoint

```http
POST /api/financial-validation/process
```

#### Request

**Headers:**
```
Content-Type: multipart/form-data
```

**Form Data:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `region` | string | ✅ | City/Regency (min 3 characters) |
| `nik` | string | ✅ | National ID (16 digits) |
| `full_name` | string | ✅ | Full name (3-100 characters) |
| `monthly_income` | number | ✅ | Monthly net income |
| `loan_amount` | number | ✅ | Requested loan amount |
| `slik` | file | ✅ | PDF/Image of SLIK OJK document |
| `salary_slip` | file | ✅ | PDF/Image of salary slip/bank statement |

**Constraints:**
- File max size: 10MB per file
- Allowed formats: JPG, JPEG, PNG, PDF
- Rate limit: 20 requests per 15 minutes

#### Response

```json
{
  "region": "Jakarta",
  "applicant": {
    "nik": "3174012501950001",
    "full_name": "John Doe",
    "monthly_income": 8000000,
    "loan_amount": 20000000
  },
  "documents_verification": {
    "slik_detected": true,
    "salary_slip_detected": true,
    "data_match_status": "MATCH"
  },
  "risk_assessment": {
    "risk_score": "LOW_RISK",
    "reason": "Meets all criteria",
    "kolektibilitas": 1,
    "dbr": 25
  },
  "extracted_data": [...]
}
```

**Risk Score Logic:**
- `REJECT`: Collectibility > 2 (Bad debt)
- `HIGH_RISK`: DBR > 40% (Installment/Salary > 40%)
- `LOW_RISK`: Meets all criteria

---

### 3. Pipeline B: Visual Appraiser

Visual assessment of collateral items (Vehicles, Electronics, Jewelry).

#### Endpoint

```http
POST /api/visual-appraiser/assess
```

#### Request

**Headers:**
```
Content-Type: multipart/form-data
```

**Form Data:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `images` | file[] | ✅ | Multiple images (max 10) |
| `region` | string | ✅ | Region for market price reference |
| `risk_score` | string | ⚠️ | LOW_RISK/HIGH_RISK/REJECT (from Pipeline A) |
| `additional_defects` | JSON array | ❌ | Manual defects found by employee (optional) |

**Additional Defects Format:**
```json
["Scratches on left side not visible in photo", "Missing rubber foot", "Loose hinge"]
```

This field is **optional** and should be used when the pawnshop employee finds defects that the AI camera detection missed during manual inspection.

**Photo Requirements:**

**Vehicles:**
- Front, back, side photos
- Speedometer photo (odometer)
- STNK & BPKB photos

**Electronics:**
- Front, back, detail photos
- Screen-on photo (check for dead pixels)
- Serial number photo

**Jewelry:**
- Item on digital scale photo (MANDATORY - numbers visible)
- Close-up purity code photo (375, 700, 750, 999)
- Detail photos of item

**Constraints:**
- Max 10 images per request
- File max size: 10MB per image
- Allowed formats: JPG, JPEG, PNG
- Rate limit: 20 requests per 15 minutes

#### Response

```json
{
  "pawn_assessment": {
    "region_context": "Jakarta",
    "applicant_analysis": {
      "documents_verification": {
        "salary_slip_detected": true,
        "slik_checking_detected": true,
        "data_match_status": "MATCH"
      },
      "risk_score": "LOW_RISK"
    },
    "collaterals": [
      {
        "category": "KENDARAAN",
        "basic_info": {
          "type": "Scooter",
          "brand": "Honda",
          "model": "Vario 125",
          "is_luxury_brand": false
        },
        "technical_specifications": {
          "license_plate_year": "2020",
          "odometer_km": 15000,
          "vehicle_documents": ["STNK", "BPKB"],
          "jewelry_scale_visible": null,
          "jewelry_weight_grams": null,
          "jewelry_purity_code": null,
          "screen_condition": null
        },
        "physical_condition": {
          "grade": "A",
          "detected_defects": [],
          "authenticity_flag": "LIKELY_AUTHENTIC"
        },
        "value_estimation": {
          "search_query_used": "Used Honda Vario 125 2020 price Jakarta",
          "market_price_avg": 18000000,
          "confidence_score": 0.85
        }
      }
    ],
    "final_decision": {
      "status": "APPROVED",
      "total_loan_offer": 12600000,
      "reasoning": "Vehicle in Grade A condition (excellent), complete documents. Loan = 70% x Market Price"
    }
  }
}
```

**Grade & Loan Calculation:**
- Grade A (Excellent): 70% x Market Price
- Grade B (Minor scratches): 60% x Market Price
- Grade C (Damaged): 40% x Market Price
- Grade D (Destroyed/Fake): REJECT

**Auto Manual Review Triggers:**
- Jewelry without visible digital scale
- Luxury brands (Rolex, LV, Gucci) without certificate
- Authenticity flag: SUSPICIOUS or FAKE

---

## Security Features

### 1. Rate Limiting
- General endpoints: 100 requests/15 min
- Upload endpoints: 20 requests/15 min
- Strict endpoints: 50 requests/hour

### 2. File Validation
- Magic byte validation (file signature check)
- Extension whitelist
- MIME type validation
- Max file size: 10MB

### 3. Input Validation
- NIK: 16 digit numeric
- Name: 3-100 characters
- Currency: Positive numbers only
- XSS protection via sanitization

### 4. Headers Security (Helmet)
- CSP (Content Security Policy)
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff

### 5. CORS Configuration
- Whitelist allowed origins
- Method restrictions: GET, POST only

---

## Testing Without Photos (Mock Mode)

For development/testing purposes without uploading actual files, add `mock_mode=true` to get realistic dummy responses.

### 1. Test Financial Validation (No Files)

**Windows CMD:**
```cmd
curl -X POST http://localhost:5000/api/financial-validation/process -F "region=Jakarta" -F "nik=3174012501950001" -F "full_name=John Doe" -F "monthly_income=8000000" -F "loan_amount=20000000" -F "mock_mode=true"
```

**Windows PowerShell:**
```powershell
curl.exe -X POST http://localhost:5000/api/financial-validation/process `
  -F "region=Jakarta" `
  -F "nik=3174012501950001" `
  -F "full_name=John Doe" `
  -F "monthly_income=8000000" `
  -F "loan_amount=20000000" `
  -F "mock_mode=true"
```

**JavaScript:**
```javascript
const formData = new FormData();
formData.append('region', 'Jakarta');
formData.append('nik', '3174012501950001');
formData.append('full_name', 'John Doe');
formData.append('monthly_income', '8000000');
formData.append('loan_amount', '20000000');
formData.append('mock_mode', 'true');

const response = await fetch('http://localhost:5000/api/financial-validation/process', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result);
```

**Expected Response:**
```json
{
  "region": "Jakarta",
  "applicant": {
    "nik": "3174012501950001",
    "full_name": "John Doe",
    "monthly_income": 8000000,
    "loan_amount": 20000000
  },
  "documents_verification": {
    "slik_detected": true,
    "salary_slip_detected": true,
    "data_match_status": "MATCH"
  },
  "risk_assessment": {
    "risk_score": "LOW_RISK",
    "reason": "Meets all criteria",
    "collectibility": 1,
    "dbr": 25
  },
  "extracted_data": [...],
  "mock": true
}
```

### 2. Test Visual Appraiser (No Photos)

**Windows CMD:**
```cmd
curl -X POST http://localhost:5000/api/visual-appraiser/assess -F "region=Jakarta" -F "risk_score=LOW_RISK" -F "mock_mode=true"
```

**Windows PowerShell:**
```powershell
curl.exe -X POST http://localhost:5000/api/visual-appraiser/assess `
  -F "region=Jakarta" `
  -F "risk_score=LOW_RISK" `
  -F "mock_mode=true"
```

**JavaScript:**
```javascript
const formData = new FormData();
formData.append('region', 'Jakarta');
formData.append('risk_score', 'LOW_RISK');
formData.append('mock_mode', 'true');

const response = await fetch('http://localhost:5000/api/visual-appraiser/assess', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result);
```

**Expected Response:**
```json
{
  "pawn_assessment": {
    "region_context": "Jakarta",
    "applicant_analysis": {
      "documents_verification": {
        "salary_slip_detected": true,
        "slik_checking_detected": true,
        "data_match_status": "MATCH"
      },
      "risk_score": "LOW_RISK"
    },
    "collaterals": [
      {
        "category": "ELEKTRONIK",
        "basic_info": {
          "type": "Laptop",
          "brand": "ASUS",
          "model": "ROG Zephyrus G14",
          "is_luxury_brand": false
        },
        "physical_condition": {
          "grade": "B",
          "detected_defects": ["Minor scratch on lid", "Small dent on corner"],
          "authenticity_flag": "LIKELY_AUTHENTIC"
        },
        "value_estimation": {
          "search_query_used": "Used ASUS ROG Zephyrus G14 price Jakarta",
          "market_price_avg": 15000000,
          "confidence_score": 0.85
        }
      }
    ],
    "final_decision": {
      "status": "APPROVED",
      "total_loan_offer": 9000000,
      "reasoning": "Laptop in Grade B condition (minor scratches). Loan = 60% x Market Price (Rp 15,000,000) = Rp 9,000,000"
    }
  }
}
```

**⚠️ Important Notes:**
- Mock mode is for **development/testing only**
- Do NOT use mock mode in production
- Mock responses use realistic data for integration testing
- All validation rules still apply (NIK format, income values, etc.)

---

## Testing Backend

### 1. Test with cURL

**Health Check:**
```bash
curl http://localhost:5000/health
```

**Financial Validation (Linux/Mac):**
```bash
curl -X POST http://localhost:5000/api/financial-validation/process \
  -F "region=Jakarta" \
  -F "nik=3174012501950001" \
  -F "full_name=John Doe" \
  -F "monthly_income=8000000" \
  -F "loan_amount=20000000" \
  -F "slik=@/path/to/slik.jpg" \
  -F "salary_slip=@/path/to/salary_slip.jpg"
```

**Financial Validation (Windows CMD - SINGLE LINE):**
```cmd
curl -X POST http://localhost:5000/api/financial-validation/process -F "region=Jakarta" -F "nik=3174012501950001" -F "full_name=John Doe" -F "monthly_income=8000000" -F "loan_amount=20000000" -F "slik=@C:/path/to/slik.jpg" -F "salary_slip=@C:/path/to/salary_slip.jpg"
```

**Financial Validation (Windows PowerShell):**
```powershell
curl.exe -X POST http://localhost:5000/api/financial-validation/process `
  -F "region=Jakarta" `
  -F "nik=3174012501950001" `
  -F "full_name=John Doe" `
  -F "monthly_income=8000000" `
  -F "loan_amount=20000000" `
  -F "slik=@C:/path/to/slik.jpg" `
  -F "salary_slip=@C:/path/to/salary_slip.jpg"
```

**Visual Appraiser (Linux/Mac):**
```bash
curl -X POST http://localhost:5000/api/visual-appraiser/assess \
  -F "region=Jakarta" \
  -F "risk_score=LOW_RISK" \
  -F "images=@/path/to/foto1.jpg" \
  -F "images=@/path/to/foto2.jpg" \
  -F "images=@/path/to/foto3.jpg" \
  -F 'additional_defects=["Minor scratch on back panel", "Missing screw"]'
```

**Visual Appraiser (Windows CMD - SINGLE LINE):**
```cmd
curl -X POST http://localhost:5000/api/visual-appraiser/assess -F "region=Jakarta" -F "risk_score=LOW_RISK" -F "images=@C:/path/to/foto1.jpg" -F "images=@C:/path/to/foto2.jpg" -F "images=@C:/path/to/foto3.jpg" -F "additional_defects=[\"Scratch not visible in photo\"]"
```

**Visual Appraiser (Windows PowerShell):**
```powershell
curl.exe -X POST http://localhost:5000/api/visual-appraiser/assess `
  -F "region=Jakarta" `
  -F "risk_score=LOW_RISK" `
  -F "images=@C:/path/to/foto1.jpg" `
  -F "images=@C:/path/to/foto2.jpg" `
  -F "images=@C:/path/to/foto3.jpg" `
  -F 'additional_defects=["Dent on left side", "Loose component"]'
```

**💡 Windows Tips:**
- Use `curl.exe` in PowerShell (not the `curl` alias pointing to Invoke-WebRequest)
- Use backtick `` ` `` for line continuation in PowerShell
- Or write everything in 1 line in CMD
- Use forward slash `/` for file paths or escape backslash `\\`

### 2. Test with Postman

**Import Collection:**

1. Open Postman
2. Import > Raw Text
3. Paste JSON collection (see section below)

**Postman Collection:**

```json
{
  "info": {
    "name": "Pegadaian AI API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:5000/health",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["health"]
        }
      }
    },
    {
      "name": "Financial Validation",
      "request": {
        "method": "POST",
        "header": [],
        "body": {
          "mode": "formdata",
          "formdata": [
            {"key": "region", "value": "Jakarta", "type": "text"},
            {"key": "nik", "value": "3174012501950001", "type": "text"},
            {"key": "full_name", "value": "John Doe", "type": "text"},
            {"key": "monthly_income", "value": "8000000", "type": "text"},
            {"key": "loan_amount", "value": "20000000", "type": "text"},
            {"key": "slik", "type": "file"},
            {"key": "salary_slip", "type": "file"}
          ]
        },
        "url": {
          "raw": "http://localhost:5000/api/financial-validation/process",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "financial-validation", "process"]
        }
      }
    },
    {
      "name": "Visual Appraiser",
      "request": {
        "method": "POST",
        "header": [],
        "body": {
          "mode": "formdata",
          "formdata": [
            {"key": "region", "value": "Jakarta", "type": "text"},
            {"key": "risk_score", "value": "LOW_RISK", "type": "text"},
            {"key": "images", "type": "file"},
            {"key": "images", "type": "file"}
          ]
        },
        "url": {
          "raw": "http://localhost:5000/api/visual-appraiser/assess",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "visual-appraiser", "assess"]
        }
      }
    }
  ]
}
```

### 3. Test with JavaScript (Frontend)

**Financial Validation:**

```javascript
const formData = new FormData();
formData.append('region', 'Jakarta');
formData.append('nik', '3174012501950001');
formData.append('full_name', 'John Doe');
formData.append('monthly_income', '8000000');
formData.append('loan_amount', '20000000');
formData.append('slik', slikFile);
formData.append('salary_slip', salarySlipFile);

const response = await fetch('http://localhost:5000/api/financial-validation/process', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result);
```

**Visual Appraiser:**

```javascript
const formData = new FormData();
formData.append('region', 'Jakarta');
formData.append('risk_score', 'LOW_RISK');

images.forEach(image => {
  formData.append('images', image);
});

const additionalDefects = ["Scratch on bottom", "Loose button"];
formData.append('additional_defects', JSON.stringify(additionalDefects));

const response = await fetch('http://localhost:5000/api/visual-appraiser/assess', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result);
```

---

## Frontend Integration Guide

### Complete Flow

```
USER FLOW:
1. Pawnshop employee fills form with customer data (region, NIK, name, income, loan amount)
2. Employee uploads customer's SLIK + Salary Slip documents
3. Frontend: POST to /api/financial-validation/process
4. Backend: Returns risk_score (LOW_RISK/HIGH_RISK/REJECT)
5. If REJECT: Stop, show rejection message
6. If LOW_RISK/HIGH_RISK: Continue to collateral item photo upload
7. Employee takes photos of collateral item (max 10 photos)
8. [OPTIONAL] Employee adds manual defects found during physical inspection (additional_defects)
9. Frontend: POST to /api/visual-appraiser/assess (include risk_score from step 4 + optional additional_defects)
10. Backend: AI merges detected defects with employee-reported defects, returns complete assessment + loan offer
11. Frontend: Display final decision result
```

### Example: Complete Integration (React)

```javascript
import { useState } from 'react';

const API_BASE = 'http://localhost:5000/api';

export default function PawnApplicationForm() {
  const [step, setStep] = useState(1);
  const [financialData, setFinancialData] = useState({});
  const [riskScore, setRiskScore] = useState('');
  const [finalAssessment, setFinalAssessment] = useState(null);

  const handleFinancialSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    try {
      const response = await fetch(`${API_BASE}/financial-validation/process`, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.risk_assessment.risk_score === 'REJECT') {
        alert('Application rejected: ' + result.risk_assessment.reason);
        return;
      }
      
      setFinancialData(result);
      setRiskScore(result.risk_assessment.risk_score);
      setStep(2);
    } catch (error) {
      console.error('Error:', error);
      alert('Error during financial validation');
    }
  };

  const handleVisualSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    formData.append('region', financialData.region);
    formData.append('risk_score', riskScore);
    
    const manualDefects = ['Scratch on bottom panel', 'Loose hinge'];
    if (manualDefects.length > 0) {
      formData.append('additional_defects', JSON.stringify(manualDefects));
    }
    
    try {
      const response = await fetch(`${API_BASE}/visual-appraiser/assess`, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      setFinalAssessment(result);
      setStep(3);
    } catch (error) {
      console.error('Error:', error);
      alert('Error during visual assessment');
    }
  };

  if (step === 1) {
    return (
      <form onSubmit={handleFinancialSubmit}>
        <h2>Step 1: Financial Validation</h2>
        <input name="region" placeholder="Region" required />
        <input name="nik" placeholder="NIK (16 digits)" maxLength={16} required />
        <input name="full_name" placeholder="Full Name" required />
        <input name="monthly_income" type="number" placeholder="Monthly Income" required />
        <input name="loan_amount" type="number" placeholder="Loan Amount" required />
        
        <label>Upload SLIK (OJK):</label>
        <input name="slik" type="file" accept="image/*,application/pdf" required />
        
        <label>Upload Salary Slip/Bank Statement:</label>
        <input name="salary_slip" type="file" accept="image/*,application/pdf" required />
        
        <button type="submit">Validate Financial Data</button>
      </form>
    );
  }

  if (step === 2) {
    return (
      <form onSubmit={handleVisualSubmit}>
        <h2>Step 2: Upload Collateral Photos</h2>
        <p>Risk Status: <strong>{riskScore}</strong></p>
        
        <label>Upload Item Photos (Max 10):</label>
        <input name="images" type="file" accept="image/*" multiple required />
        
        <label>Manual Defects Found (Optional):</label>
        <textarea 
          name="manual_defects" 
          placeholder="Enter any defects not visible in photos (one per line)"
          rows="3"
        />
        
        <small>
          Tips:
          - Vehicles: Front, back, side, speedometer, STNK, BPKB photos
          - Electronics: Front, back, screen-on, serial number photos
          - Jewelry: On digital scale (numbers visible), purity code close-up
        </small>
        
        <button type="submit">Assess Item</button>
      </form>
    );
  }

  if (step === 3 && finalAssessment) {
    const decision = finalAssessment.pawn_assessment.final_decision;
    
    return (
      <div>
        <h2>Assessment Result</h2>
        <div className={`status-${decision.status.toLowerCase()}`}>
          <h3>Status: {decision.status}</h3>
          <p>{decision.reasoning}</p>
          
          {decision.status === 'APPROVED' && (
            <div>
              <h4>Loan Offer</h4>
              <p className="loan-amount">
                Rp {decision.total_loan_offer.toLocaleString('id-ID')}
              </p>
            </div>
          )}
          
          {decision.status === 'MANUAL_REVIEW' && (
            <p>Your application requires manual verification by our team.</p>
          )}
        </div>
        
        <button onClick={() => { setStep(1); setFinalAssessment(null); }}>
          New Application
        </button>
      </div>
    );
  }
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (validation error) |
| 404 | Endpoint not found |
| 429 | Too Many Requests (rate limit) |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "error": "Error message",
  "errors": [
    {
      "msg": "NIK must be 16 digit number",
      "param": "nik",
      "location": "body"
    }
  ]
}
```

---

## Production Checklist

- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Replace `GEMINI_API_KEY` with production key
- [ ] Update `ALLOWED_ORIGINS` with production domain
- [ ] Enable HTTPS
- [ ] Setup logging (Winston/Morgan)
- [ ] Database for storing results
- [ ] Implement authentication (JWT)
- [ ] Setup monitoring (PM2, New Relic)
- [ ] Configure reverse proxy (Nginx)
- [ ] Adjust rate limits for production traffic

---

## Troubleshooting

**Error: "GEMINI_API_KEY not configured"**
- Make sure `.env` file exists in backend root folder
- Ensure API key is correct and active

**Error: "Too many requests"**
- Rate limit reached, wait 15 minutes
- For development, you can adjust in `rateLimiter.js`

**Error: "File too large"**
- Max file size is 10MB
- Compress images before uploading

**Error: "Invalid file type"**
- Only JPG, PNG, PDF are accepted
- Check MIME type and extension

---

