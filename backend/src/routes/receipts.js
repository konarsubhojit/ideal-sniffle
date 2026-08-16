import crypto from 'node:crypto';
import path from 'node:path';
import express from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { neon } from '@neondatabase/serverless';
import { requireAuth } from '../middleware/auth.js';
import { requireContributor, requireRole } from '../middleware/authorization.js';
import {
  ALLOWED_RECEIPT_TYPES,
  MAX_RECEIPT_SIZE,
  deleteReceipt,
  getReceiptUrl,
  isReceiptStorageConfigured,
  uploadReceipt,
  validateReceiptFile,
} from '../storage.js';
import { isReceiptScanningConfigured, scanReceiptDraft } from '../services/receiptScanner.js';
import logger from '../utils/logger.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_RECEIPT_SIZE, files: 1 },
  fileFilter: (req, file, callback) => callback(
    ALLOWED_RECEIPT_TYPES.has(file.mimetype) ? null : new Error('Unsupported receipt type'),
    ALLOWED_RECEIPT_TYPES.has(file.mimetype),
  ),
});

const scanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: req => String(req.user.id),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Receipt scan limit reached. Please enter the expense manually.' },
});

function getSql() {
  return neon(process.env.DATABASE_URL);
}

function receiveFile(req, res, next) {
  upload.single('receipt')(req, res, error => {
    if (!error) return next();
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({ error: error.message });
  });
}

async function logReceiptActivity(sql, userId, action, receiptId, details) {
  try {
    await sql`
      INSERT INTO activity_log (user_id, action, entity_type, entity_id, details)
      VALUES (${userId}, ${action}, 'receipt', ${receiptId}, ${JSON.stringify(details)})
    `;
  } catch (error) {
    logger.error('Error logging receipt activity', error);
  }
}

router.get('/features', requireAuth, requireRole, (req, res) => {
  res.json({
    receiptStorage: isReceiptStorageConfigured(),
    receiptScanning: isReceiptScanningConfigured(),
    maxReceiptSize: MAX_RECEIPT_SIZE,
    allowedReceiptTypes: [...ALLOWED_RECEIPT_TYPES],
  });
});

router.post(
  '/scan-receipt',
  requireAuth,
  requireContributor,
  scanLimiter,
  receiveFile,
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'A receipt file is required' });
    try {
      validateReceiptFile(req.file);
      const draft = await scanReceiptDraft(req.file);
      res.json({ draft, message: 'Review and edit this draft before saving.' });
    } catch (error) {
      const status = error.status || 400;
      res.status(status).json({
        error: error.message,
        code: error.code,
        manualEntryAvailable: true,
      });
    }
  },
);

router.get('/:expenseId/receipts', requireAuth, requireRole, async (req, res) => {
  try {
    const sql = getSql();
    const receipts = await sql`
      SELECT r.id, r.original_name as "originalName", r.mime_type as "mimeType",
             r.size, r.created_at as "createdAt"
      FROM receipts r
      JOIN expenses e ON e.id = r.expense_id
      WHERE r.expense_id = ${req.params.expenseId} AND e.deleted_at IS NULL
      ORDER BY r.created_at DESC
    `;
    res.json(receipts);
  } catch (error) {
    logger.error('Error fetching receipts', error);
    res.status(500).json({ error: 'Failed to fetch receipts' });
  }
});

router.post(
  '/:expenseId/receipts',
  requireAuth,
  requireContributor,
  receiveFile,
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'A receipt file is required' });
    const sql = getSql();
    let objectKey;
    try {
      validateReceiptFile(req.file);
      const expense = await sql`
        SELECT id FROM expenses WHERE id = ${req.params.expenseId} AND deleted_at IS NULL
      `;
      if (expense.length === 0) return res.status(404).json({ error: 'Expense not found' });

      const extension = path.extname(req.file.originalname).toLowerCase().slice(0, 10);
      objectKey = `receipts/${req.params.expenseId}/${crypto.randomUUID()}${extension}`;
      await uploadReceipt(req.file, objectKey);
      const rows = await sql`
        INSERT INTO receipts (expense_id, object_key, original_name, mime_type, size, uploaded_by)
        VALUES (${req.params.expenseId}, ${objectKey}, ${req.file.originalname},
                ${req.file.mimetype}, ${req.file.size}, ${req.user.id})
        RETURNING id, original_name as "originalName", mime_type as "mimeType",
                  size, created_at as "createdAt"
      `;
      await logReceiptActivity(sql, req.user.id, 'UPLOAD', rows[0].id, {
        expenseId: Number(req.params.expenseId),
        mimeType: req.file.mimetype,
        size: req.file.size,
      });
      res.status(201).json(rows[0]);
    } catch (error) {
      if (objectKey) {
        try {
          await deleteReceipt(objectKey);
        } catch (cleanupError) {
          logger.error('Failed to clean up receipt after upload error', cleanupError);
        }
      }
      logger.error('Error uploading receipt', error);
      res.status(error.message?.includes('not configured') ? 503 : 400).json({ error: error.message });
    }
  },
);

router.get('/:expenseId/receipts/:receiptId/url', requireAuth, requireRole, async (req, res) => {
  try {
    const sql = getSql();
    const rows = await sql`
      SELECT r.object_key
      FROM receipts r
      JOIN expenses e ON e.id = r.expense_id
      WHERE r.id = ${req.params.receiptId}
        AND r.expense_id = ${req.params.expenseId}
        AND e.deleted_at IS NULL
    `;
    if (rows.length === 0) return res.status(404).json({ error: 'Receipt not found' });
    res.json({ url: await getReceiptUrl(rows[0].object_key), expiresIn: 300 });
  } catch (error) {
    logger.error('Error generating receipt URL', error);
    res.status(error.message?.includes('not configured') ? 503 : 500)
      .json({ error: 'Failed to access receipt' });
  }
});

router.delete('/:expenseId/receipts/:receiptId', requireAuth, requireContributor, async (req, res) => {
  try {
    const sql = getSql();
    const rows = await sql`
      SELECT r.object_key, r.original_name
      FROM receipts r
      JOIN expenses e ON e.id = r.expense_id
      WHERE r.id = ${req.params.receiptId}
        AND r.expense_id = ${req.params.expenseId}
        AND e.deleted_at IS NULL
    `;
    if (rows.length === 0) return res.status(404).json({ error: 'Receipt not found' });
    await deleteReceipt(rows[0].object_key);
    await sql`DELETE FROM receipts WHERE id = ${req.params.receiptId}`;
    await logReceiptActivity(sql, req.user.id, 'DELETE', Number(req.params.receiptId), {
      expenseId: Number(req.params.expenseId),
      originalName: rows[0].original_name,
    });
    res.json({ message: 'Receipt deleted successfully' });
  } catch (error) {
    logger.error('Error deleting receipt', error);
    res.status(error.message?.includes('not configured') ? 503 : 500)
      .json({ error: 'Failed to delete receipt' });
  }
});

export default router;
