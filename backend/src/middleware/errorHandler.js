const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large, maximum 10MB' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files' });
    }
    return res.status(400).json({ error: 'File upload error' });
  }

  if (err.message.includes('Invalid file type')) {
    return res.status(400).json({ error: 'Invalid file type, use JPG, PNG, or PDF' });
  }

  if (err.message.includes('GEMINI_API_KEY')) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

const notFound = (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, notFound, asyncHandler };
