import { describe, expect, it, vi } from 'vitest';
import { ReceiptScanError, scanReceiptDraft } from '../src/services/receiptScanner.js';

const file = {
  mimetype: 'image/png',
  buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
};

describe('receipt scanner', () => {
  it('returns a structured, editable draft', async () => {
    const client = {
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: JSON.stringify({
            merchantName: 'Corner Shop',
            totalAmount: 12.5,
            currency: 'USD',
            date: '2026-08-16',
            suggestedCategory: 'Shopping',
            suggestedGroup: null,
            lineItems: [{ description: 'Milk', amount: 12.5 }],
            confidence: 0.91,
          }),
        }),
      },
    };

    await expect(scanReceiptDraft(file, { apiKey: 'test', client })).resolves.toMatchObject({
      merchantName: 'Corner Shop',
      totalAmount: 12.5,
      confidence: 0.91,
    });
  });

  it('is cleanly disabled when Gemini is not configured', async () => {
    await expect(scanReceiptDraft(file, { apiKey: '' })).rejects.toMatchObject({
      code: 'NOT_CONFIGURED',
      status: 503,
    });
  });

  it('rejects malformed model output without blocking manual entry', async () => {
    const client = {
      models: { generateContent: vi.fn().mockResolvedValue({ text: '{bad json' }) },
    };

    await expect(scanReceiptDraft(file, { apiKey: 'test', client })).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
      status: 422,
    });
  });

  it('normalizes quota failures into a clear fallback response', async () => {
    const client = {
      models: { generateContent: vi.fn().mockRejectedValue({ status: 429 }) },
    };

    await expect(scanReceiptDraft(file, { apiKey: 'test', client })).rejects.toEqual(
      expect.objectContaining({
        code: 'UNAVAILABLE',
        status: 503,
      }),
    );
    expect(ReceiptScanError).toBeTypeOf('function');
  });
});
