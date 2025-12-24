# Pegadaian AI Pawn Assessment System

## Overview
An AI-powered digital pawn assessment application designed to streamline the initial pawn application process. This system enables pawnshop employees to upload photos of collateral items and obtain preliminary loan estimates using advanced AI analysis.

The application consists of two main pipelines:
1. **Financial Validation Pipeline** - Validates customer financial documents (SLIK, salary slips)
2. **Visual Appraiser Pipeline** - Analyzes collateral items through computer vision and market price estimation

---

## Purpose
Main objectives of this application:
- Provide transparent preliminary loan estimates to customers
- Reduce waiting time and appraisal workload at outlets
- Support pawnshop employees with AI-based decision support systems
- Maintain consistency and quality in collateral assessment
- Automate defect detection and grade evaluation

---

## Features

### Pipeline A: Financial Validation
- NIK verification and data matching
- OCR text extraction from SLIK and salary documents
- Credit score calculation based on collectibility and DBR (Debt to Income Ratio)
- Automatic risk assessment (LOW_RISK, HIGH_RISK, REJECT)

### Pipeline B: Visual Appraiser
- Multi-category object classification (Vehicles, Electronics, Jewelry, Luxury Fashion)
- AI-powered defect detection from photos
- Manual defect addition by employees (optional)
- Automatic grade evaluation (A, B, C, D) based on total defects
- Market price estimation with regional context
- Loan offer calculation based on grade and market price

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

### 1. Financial Validation
```
POST /api/financial-validation/process
```
- Upload SLIK and salary slip documents
- Get risk assessment and credit score

### 2. Visual Appraiser
```
POST /api/visual-appraiser/assess
```
- Upload collateral item photos
- Get AI assessment, grade, and loan offer

For detailed API documentation, see [backend/README.md](backend/README.md)

---

## Usage Flow

1. **Employee Input**: Pawnshop employee enters customer data (NIK, name, income, loan amount)
2. **Document Upload**: Upload SLIK and salary slip documents
3. **Financial Validation**: System validates documents and calculates risk score
4. **Collateral Photos**: Upload photos of collateral item (vehicles, electronics, jewelry)
5. **Manual Inspection** (Optional): Employee adds defects found during physical inspection
6. **AI Assessment**: AI analyzes photos, detects defects, estimates market price
7. **Grade Calculation**: System calculates final grade based on total defects
8. **Loan Offer**: System generates loan offer based on grade and market price
9. **Decision**: APPROVED, REJECTED, or MANUAL_REVIEW

---

## Grade System

| Grade | Condition | Defects | Loan Percentage |
|-------|-----------|---------|----------------|
| A | Excellent | 0 defects | 70% of market price |
| B | Good | 1-3 minor defects | 60% of market price |
| C | Fair | 4-6 defects | 40% of market price |
| D | Poor | 7+ defects or critical damage | REJECTED |

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

Test the backend API without frontend:

```bash
# Test financial validation (mock mode)
curl -X POST http://localhost:5000/api/financial-validation/process \
  -F "region=Jakarta" \
  -F "nik=3174012501950001" \
  -F "full_name=John Doe" \
  -F "monthly_income=8000000" \
  -F "loan_amount=20000000" \
  -F "mock_mode=true"

# Test visual appraiser with real photos
curl -X POST http://localhost:5000/api/visual-appraiser/assess \
  -F "region=Jakarta" \
  -F "risk_score=LOW_RISK" \
  -F "images=@/path/to/photo1.jpg" \
  -F "images=@/path/to/photo2.jpg"
```

---

## Development Status

**Completed:**
- Backend API with two pipelines
- Financial validation and credit scoring
- Visual AI assessment with Gemini
- Automatic defect detection
- Manual defect addition feature
- Grade calculation and loan offer
- Security middleware implementation
- API documentation

**In Progress:**
- Frontend UI development
- Integration testing
- User authentication

**Planned:**
- Database integration
- Real-time market price API
- Admin dashboard
- Production deployment

---
