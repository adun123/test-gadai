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
    "overall_grade": "Poor",
    "defects": [
      "Paint fading on front panel (Moderate)",
      "Scratches on side body (Minor)"
    ]
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
  "vehicle_identification": {
    "make": "Yamaha",
    "model": "Mio",
    "year": 2005
  },
  "physical_condition": {
    "overall_grade": "Poor",
    "defects": ["Paint fading (Moderate)", "Rust (Minor)"]
  },
  "province": "DKI Jakarta"
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
  "appraisal_value": 5000000,
  "loan_amount": 5000000,
  "tenor_days": 30
}
```

**Response:**
```json
{
  "products": {
    "regular": {
      "product": { "type": "REGULAR", "name": "Gadai Kendaraan Reguler" },
      "max_loan_amount": 5000000,
      "sewa_modal": { "periods": 2, "total_rate": 2.4, "sewa_modal_amount": 120000 },
      "total_repayment": 5120000,
      "schedule": { "start_date": "2025-12-25", "due_date": "2026-01-24" }
    },
    "daily": {
      "product": { "type": "DAILY", "name": "Gadai Kendaraan Harian" },
      "max_loan_amount": 5000000,
      "sewa_modal": { "days": 30, "total_rate": 2.7, "sewa_modal_amount": 135000 },
      "total_repayment": 5135000,
      "schedule": { "start_date": "2025-12-25", "due_date": "2026-01-24" }
    },
    "recommendation": "REGULAR"
  }
}
```

---

### 6. Health Check
```
GET /health
```

---

## Pawn Products

| Product | Tenor | Rate |
|---------|-------|------|
| Gadai Reguler | 1-120 days | 1.2% per 15 days |
| Gadai Harian | 1-60 days | 0.09% per day |

## Mock Mode

Add `?mock=true` for testing without AI:
```
POST /api/scan/vehicle?mock=true
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

// 2. User edits the data, then calculate pricing
const pricingResult = await fetch('/api/calculate/pricing', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    vehicle_identification: { make: 'Yamaha', model: 'Mio', year: 2005 },
    physical_condition: { 
      overall_grade: 'Poor',
      defects: [...scanResult.physical_condition.defects, 'New defect added by user (Minor)']
    },
    province: 'DKI Jakarta'
  })
}).then(r => r.json());

// 3. Calculate pawn options
const pawnResult = await fetch('/api/calculate/pawn', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ appraisal_value: pricingResult.appraisal_value, tenor_days: 30 })
}).then(r => r.json());
```

