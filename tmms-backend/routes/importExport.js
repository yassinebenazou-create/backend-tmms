const express = require('express');
const multer = require('multer');
const { parseWorkbook } = require('../utils/excelParser');
const authMiddleware = require('../utils/authMiddleware');

const router = express.Router();

const maxFileSizeMb = Number(process.env.MAX_FILE_SIZE_MB || 10);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxFileSizeMb * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    const isExcelMime = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ].includes(file.mimetype);

    const isExcelExtension = file.originalname.toLowerCase().endsWith('.xlsx') || file.originalname.toLowerCase().endsWith('.xls');

    if (!isExcelMime && !isExcelExtension) {
      return cb(new Error('Only Excel files (.xlsx or .xls) are allowed.'));
    }

    return cb(null, true);
  }
});

router.post('/upload', authMiddleware, (req, res) => {
  upload.single('file')(req, res, (error) => {
    if (error) {
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            success: false,
            message: `File too large. Max ${maxFileSizeMb}MB.`
          });
        }

        return res.status(400).json({
          success: false,
          message: `Upload failed: ${error.message}`
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message || 'Invalid upload request.'
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded. Use field name "file".'
        });
      }

      const parsed = parseWorkbook(req.file.buffer);

      return res.status(200).json({
        success: true,
        fileName: req.file.originalname,
        ...parsed
      });
    } catch (parseError) {
      return res.status(422).json({
        success: false,
        message: parseError.message || 'Failed to parse Excel file.'
      });
    }
  });
});

module.exports = router;
