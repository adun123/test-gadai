# Pegadaian AI Assessment System

## Overview
An AI-powered digital pawn assessment application designed to streamline the initial pawn application process. This system enables pawnshop employees to upload photos of collateral items (vehicles) and obtain preliminary loan estimates using advanced AI analysis with Google Gemini.

The application focuses on the **Vehicle Pawn Pipeline** which analyzes motorcycles through:
1. **Vehicle Scanning** - AI-powered vehicle identification and defect detection
2. **Market Price Estimation** - Real-time market price search using Google Search
3. **Pawn Calculation** - Automatic loan calculation with Gadai Reguler & Gadai Harian options

---

## Purpose
Main objectives of this application:
- Provide transparent preliminary loan estimates to customers
- Reduce waiting time and appraisal workload at outlets
- Support pawnshop employees with AI-based decision support systems
- Maintain consistency and quality in collateral assessment
- Automate defect detection and condition scoring

---

## Features

### Vehicle Pawn Assessment
- **Vehicle Scanning**: AI-powered identification of brand, model, year from photos
- **Defect Detection**: Automatic detection of damage/defects from uploaded images
- **Condition Scoring**: Score calculated from 100% minus defect deductions (min 30%)
- **Market Price Search**: Real-time price estimation via Google Search grounding
- **Dual Product Options**: Gadai Reguler (1-120 days) and Gadai Harian (1-60 days)
- **Loan Calculation**: Automatic calculation with LTV, depreciation, and fees

### Condition Scoring System

| Defect Severity | Deduction | Example |
|-----------------|-----------|---------|
| Minor | -2% | Small scratches, light scuffs |
| Moderate | -5% | Small dents, peeling paint |
| Major | -10% | Large dents, cracked body |
| Severe | -15% | Broken parts, leaks, non-functional |

**Safeguards:**
- Maximum total deduction: 50%
- Minimum condition score: 30%

---

## Technology Stack
- **Frontend:** Next.js 15 (React, TypeScript)
- **Backend:** Node.js + Express
- **AI Model:** Google Gemini 2.5 Flash (Vision & Text)
- **Security:** Helmet, Rate Limiting, Input Validation, CORS
- **File Processing:** Multer with magic byte validation

---

## Project Structure

```
pegadaian-ai-app/
├── backend/                 # Node.js Express API
│   ├── src/
│   │   ├── config/         # Gemini AI configuration
│   │   ├── middleware/     # Security, validation, upload
│   │   ├── routes/         # API endpoints
│   │   └── services/       # Business logic
│   ├── .env                # Environment variables
│   ├── package.json
│   └── README.md           # Backend documentation
│
├── frontend/               # Next.js application
│   ├── app/               # App router pages
│   ├── public/            # Static assets
│   ├── package.json
│   └── README.md          # Frontend documentation
│
├── .gitignore
└── README.md              # This file
```

---

## Quick Start

### Prerequisites
- Node.js 18+ installed
- Gemini API Key (get from https://aistudio.google.com/app/apikey)

### Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env`:
```env
PORT=5000
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key_here
ALLOWED_ORIGINS=http://localhost:3000
```

4. Start the server:
```bash
npm run dev
```

Server runs at `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

Frontend runs at `http://localhost:3000`

---

## API Endpoints

### 1. Vehicle Scan
```
POST /api/scan/vehicle
```
- Upload vehicle photos (1-4 images)
- Returns: brand, model, year, defects, condition score

### 2. Pricing Engine
```
POST /api/calculate/pricing
```
- Get market price estimation
- Input: brand, model, year, province, condition score
- Returns: market price, adjusted value, max loan amount

### 3. Pawn Decision Engine
```
POST /api/calculate/pawn
```
- Calculate loan options
- Input: asset value, loan amount, tenor
- Returns: Gadai Reguler vs Gadai Harian comparison

For detailed API documentation, see [backend/README.md](backend/README.md)

---

## Usage Flow

1. **Upload Photos**: Employee uploads 1-4 photos of the motorcycle
2. **AI Scanning**: System identifies brand, model, year and detects defects
3. **Condition Score**: Score calculated based on defects (100% - deductions, min 30%)
4. **Market Price**: AI searches real-time market prices via Google Search
5. **Value Adjustment**: Price adjusted by condition score and depreciation
6. **Max Loan**: LTV 75% applied to determine maximum loan amount
7. **User Selection**: Customer chooses loan amount and tenor
8. **Product Comparison**: System compares Gadai Reguler vs Gadai Harian
9. **Recommendation**: Display recommended product with lower total cost

---

## Pawn Products

### Gadai Reguler
| Parameter | Value |
|-----------|-------|
| Tenor | 1-120 days |
| Interest Rate | 1.2% per 15 days |
| Minimum Interest | 1% |
| Max Loan | Unlimited |
| Admin Fee | Rp 50,000 |

### Gadai Harian
| Parameter | Value |
|-----------|-------|
| Tenor | 1-60 days |
| Interest Rate | 0.09% per day |
| Minimum Interest | 0.09% |
| Max Loan | Rp 20,000,000 |
| Admin Fee | Rp 50,000 |

---

## Calculation Constants

| Constant | Value | Description |
|----------|-------|-------------|
| LTV (Loan to Value) | 75% | Maximum loan percentage |
| Depreciation Rate | 0.5% per month | Short-term value decline |
| Admin Fee | Rp 50,000 | Fixed administration cost |
| Max Deduction | 50% | Maximum condition deduction |
| Min Score | 30% | Minimum condition score |

---

## Security Features

- **Rate Limiting**: 20 requests per 15 minutes for uploads
- **File Validation**: Magic byte verification, MIME type check
- **Input Validation**: NIK format, field constraints
- **CORS Protection**: Whitelist allowed origins
- **Helmet Security**: CSP, HSTS, X-Frame-Options
- **Error Handling**: Secure error messages

---

## Testing

Test the backend API:

```bash
# Test vehicle scan with photos
curl -X POST http://localhost:5000/api/scan/vehicle \
  -F "images=@/path/to/photo1.jpg" \
  -F "images=@/path/to/photo2.jpg"

# Test pricing calculation
curl -X POST http://localhost:5000/api/calculate/pricing \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "Honda",
    "model": "Vario 125",
    "year": 2020,
    "province": "DKI Jakarta",
    "conditionScore": {"final_score": 0.91}
  }'

# Test pawn calculation
curl -X POST http://localhost:5000/api/calculate/pawn \
  -H "Content-Type: application/json" \
  -d '{
    "assetValue": 15000000,
    "loanAmount": 5000000,
    "tenor": 30
  }'
```

---

## Development Status

**Completed:**
- ✅ Backend API with Express.js
- ✅ Vehicle scanning with Gemini AI
- ✅ Automatic defect detection
- ✅ Condition scoring (defects-based)
- ✅ Market price estimation with Google Search
- ✅ Pawn calculation engine (Reguler & Harian)
- ✅ Security middleware implementation
- ✅ Unit tests with Jest
- ✅ API documentation

**In Progress:**
- 🔄 Frontend UI development
- 🔄 Integration testing

**Planned:**
- 📋 Database integration
- 📋 User authentication
- 📋 Admin dashboard
- 📋 Production deployment

---
