# Pegadaian Pricing Analytics API

Backend API for motorcycle pawn assessment system using AI.

## Quick Start

```bash
cd backend
npm install
cp .env.example .env  # Edit GEMINI_API_KEY
npm run dev           # Server runs at http://localhost:5000
```

## API Endpoints

### 1. Scan Vehicle
Scan motorcycle photos for identification and defect detection.

```
POST /api/scan/vehicle
Content-Type: multipart/form-data
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| images | File[] | Yes | 1-5 motorcycle photos (JPEG/PNG) |

**Response:**
```json
{
  "vehicle_identification": {
    "vehicle_type": "Matic",
    "make": "Yamaha",
    "model": "Mio",
    "color": "Blue",
    "license_plate": "B **** ZET",
    "estimated_year": "2003-2007"
  },
  "physical_condition": {
    "defects": [
      { "description": "Paint fading on front panel", "severity": "Moderate" },
      { "description": "Scratches on side body", "severity": "Minor" }
    ]
  },
  "conditionScore": {
    "final_score": 0.93,
    "defect_count": 2,
    "base_score": 1.0,
    "deduction": 0.07
  },
  "confidence": 0.9,
  "images_processed": 4,
  "scanned_at": "2025-12-24T11:28:45.490Z"
}
```

---

### 2. Scan SLIK Document
Scan SLIK OJK document for credit data extraction.

```
POST /api/scan/slik
Content-Type: multipart/form-data
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| document | File | Yes | SLIK document (JPEG/PNG/PDF) |

---

### 3. Scan Salary Slip
Scan salary slip for income data extraction.

```
POST /api/scan/salary-slip
Content-Type: multipart/form-data
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| document | File | Yes | Salary slip (JPEG/PNG/PDF) |

---

### 4. Calculate Pricing
Calculate appraisal value based on vehicle data.

```
POST /api/calculate/pricing
Content-Type: application/json
```

**Request Body:**
```json
{
  "brand": "Yamaha",
  "model": "Mio",
  "year": 2005,
  "province": "DKI Jakarta",
  "conditionScore": {
    "final_score": 0.93,
    "defect_count": 2,
    "base_score": 1.0,
    "deduction": 0.07
  }
}
```

---

### 5. Calculate Pawn Options
Simulate pawn options based on appraisal value.

```
POST /api/calculate/pawn
Content-Type: application/json
```

**Request Body:**
```json
{
  "assetValue": 15000000,
  "loanAmount": 5000000,
  "tenor": 30
}
```

**Response:**
```json
{
  "products": {
    "regular": {
      "product": { "type": "REGULAR", "name": "Gadai Kendaraan Reguler" },
      "approvedLoanAmount": 5000000,
      "sewaModal": { "periods": 2, "rate": 0.024, "amount": 120000 },
      "adminFee": 50000,
      "totalRepayment": 5170000,
      "schedule": { "startDate": "2025-12-25", "dueDate": "2026-01-24" }
    },
    "daily": {
      "product": { "type": "DAILY", "name": "Gadai Kendaraan Harian" },
      "approvedLoanAmount": 5000000,
      "sewaModal": { "days": 30, "rate": 0.027, "amount": 135000 },
      "adminFee": 50000,
      "totalRepayment": 5185000,
      "schedule": { "startDate": "2025-12-25", "dueDate": "2026-01-24" }
    }
  },
  "recommendation": "REGULAR",
  "reason": "Gadai Reguler lebih hemat Rp 15.000"
}
```

---

### 6. Health Check
```
GET /health
```

---

## Pawn Products

| Product | Tenor | Rate | Min Rate | Max Loan | Admin Fee |
|---------|-------|------|----------|----------|----------|
| Gadai Reguler | 1-120 days | 1.2% per 15 days | 1% | Unlimited | Rp 50,000 |
| Gadai Harian | 1-60 days | 0.09% per day | 0.09% | Rp 20,000,000 | Rp 50,000 |

## Condition Scoring

| Defect Severity | Deduction |
|-----------------|----------|
| Minor | -2% |
| Moderate | -5% |
| Major | -10% |
| Severe | -15% |

**Safeguards:** Max deduction 50%, Min score 30%

## Calculation Constants

| Constant | Value |
|----------|-------|
| LTV (Loan to Value) | 75% |
| Depreciation Rate | 0.5% per month |
| Admin Fee | Rp 50,000 |

## Mock Mode

Add `?mock=true` for testing without AI:
```
POST /api/scan/vehicle?mock=true
```

## cURl Example
```
# 1. Check server
curl.exe http://localhost:5000/health

# 2. Scan vehicle (mock)
curl.exe -X POST "http://localhost:5000/api/scan/vehicle?mock=true" -F "images=@photo.jpg"

# 3. Calculate pricing
curl.exe -X POST http://localhost:5000/api/calculate/pricing -H "Content-Type: application/json" -d "{\"brand\":\"Honda\",\"model\":\"Beat\",\"year\":2022,\"province\":\"Jawa Barat\",\"conditionScore\":{\"final_score\":0.91}}"

# 4. Calculate pawn (30 days)
curl.exe -X POST http://localhost:5000/api/calculate/pawn -H "Content-Type: application/json" -d "{\"assetValue\":10000000,\"loanAmount\":5000000,\"tenor\":30}"

# 5. Calculate pawn (60 days)
curl.exe -X POST http://localhost:5000/api/calculate/pawn -H "Content-Type: application/json" -d "{\"assetValue\":10000000,\"loanAmount\":5000000,\"tenor\":60}"
```


## Error Response

```json
{
  "error": "Error message here"
}
```

| Status | Description |
|--------|-------------|
| 400 | Bad Request - Invalid input |
| 429 | Rate Limit - Too many requests |
| 500 | Server Error |

## Frontend Integration Example

```javascript
// 1. Scan vehicle
const formData = new FormData();
files.forEach(f => formData.append('images', f));
const scanResult = await fetch('/api/scan/vehicle', { method: 'POST', body: formData }).then(r => r.json());

// 2. Calculate pricing with condition score from scan result
const pricingResult = await fetch('/api/calculate/pricing', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    brand: scanResult.vehicle_identification.make,
    model: scanResult.vehicle_identification.model,
    year: 2020,
    province: 'DKI Jakarta',
    conditionScore: scanResult.conditionScore
  })
}).then(r => r.json());

// 3. Calculate pawn options
const pawnResult = await fetch('/api/calculate/pawn', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    assetValue: pricingResult.appraisalValue,
    loanAmount: 5000000,
    tenor: 30
  })
}).then(r => r.json());
```

