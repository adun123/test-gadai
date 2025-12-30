const express = require('express');
const router = express.Router();
const multer = require('multer');
const { scanSlikDocument, scanSalarySlipDocument, getMockSlikScan, getMockSalarySlipScan, summarizeDocuments } = require('../services/documentScanService');
const { asyncHandler } = require('../middleware/errorHandler');
const { extractDocumentData } = require("../services/documentOcrService");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Use JPEG, PNG, or PDF.'), false);
    }
  }
});

/**
 * @route POST /api/scan/slik
 * @desc Scan SLIK document and return editable form data
 * @access Public
 */
router.post('/slik', upload.single('document'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'SLIK document file is required'
    });
  }

  const useMock = req.query.mock === 'true' || process.env.USE_MOCK === 'true';

  let result;
  if (useMock) {
    result = getMockSlikScan();
  } else {
    result = await scanSlikDocument(req.file.buffer, req.file.mimetype);
  }

   res.json(result);
}));

/**
 * @route POST /api/scan/salary-slip
 * @desc Scan salary slip document and return editable form data
 * @access Public
 */
router.post('/salary-slip', upload.single('document'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'Salary slip document file is required'
    });
  }

  const useMock = req.query.mock === 'true' || process.env.USE_MOCK === 'true';

  let result;
  if (useMock) {
    result = getMockSalarySlipScan();
  } else {
    result = await scanSalarySlipDocument(req.file.buffer, req.file.mimetype);
  }

   res.json(result);
}));





router.post('/document', upload.single('document'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Document file is required' });
  }

  const useMock = req.query.mock === 'true' || process.env.USE_MOCK === 'true';
  console.log("AUTO DOC:", req.file.originalname, "mock:", useMock, "type:", req.query.type);

  // ===== MOCK MODE =====
  if (useMock) {
    const forced = String(req.query.type || "").toLowerCase().trim();

    if (["salary-slip", "slip-gaji", "salary", "gaji"].includes(forced)) {
      return res.json(getMockSalarySlipScan());
    }
    if (["slik", "ojk"].includes(forced)) {
      return res.json(getMockSlikScan());
    }

    const name = (req.file.originalname || "").toLowerCase();
    const isSlip = name.includes("gaji") || name.includes("salary") || name.includes("payslip") || name.includes("slip");
    return res.json(isSlip ? getMockSalarySlipScan() : getMockSlikScan());
  }

  // ===== REAL AI MODE (1x call, auto-detect) =====
  const ocr = await extractDocumentData(req.file.buffer, null, req.file.mimetype);

  return res.json({
    success: ocr.document_type && ocr.document_type !== "UNKNOWN",
    document_type: ocr.document_type || "UNKNOWN",
    scanned_data: ocr.extracted_data || {},
    scanned_at: new Date().toISOString(),
    is_editable: true,
    confidence: ocr.confidence_score ?? null,
    notes: ocr.extraction_notes ?? null
  });
}));



/**
 * @route POST /api/scan/vehicle
 * @desc Scan vehicle images and return editable form data
 * @access Public
 */
const { scanVehicleImages, getMockVehicleScan } = require('../services/vehicleScanService');

router.post('/vehicle', upload.array('images', 5), asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'At least one vehicle image is required'
    });
  }

  const useMock = req.query.mock === 'true' || process.env.USE_MOCK === 'true';

  let result;
  if (useMock) {
    result = getMockVehicleScan();
  } else {
    const imageBuffers = req.files.map(file => file.buffer);
    result = await scanVehicleImages(imageBuffers);
  }

  res.json(result);
}));

module.exports = router;
