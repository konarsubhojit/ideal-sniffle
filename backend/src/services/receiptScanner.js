import { GoogleGenAI } from '@google/genai';

const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Utilities',
  'Healthcare',
  'Travel',
  'Other',
];

const draftSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'merchantName',
    'totalAmount',
    'currency',
    'date',
    'suggestedCategory',
    'suggestedGroup',
    'lineItems',
    'confidence',
  ],
  properties: {
    merchantName: { type: ['string', 'null'] },
    totalAmount: { type: ['number', 'null'] },
    currency: { type: ['string', 'null'] },
    date: { type: ['string', 'null'], description: 'ISO 8601 date (YYYY-MM-DD)' },
    suggestedCategory: { type: ['string', 'null'], enum: [...CATEGORIES, null] },
    suggestedGroup: { type: ['string', 'null'] },
    lineItems: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['description', 'amount'],
        properties: {
          description: { type: 'string' },
          amount: { type: ['number', 'null'] },
        },
      },
    },
    confidence: { type: ['number', 'null'], minimum: 0, maximum: 1 },
  },
};

export class ReceiptScanError extends Error {
  constructor(message, code, status) {
    super(message);
    this.name = 'ReceiptScanError';
    this.code = code;
    this.status = status;
  }
}

function validateDraft(draft) {
  if (!draft || typeof draft !== 'object' || Array.isArray(draft)) return false;
  if (draft.totalAmount !== null && typeof draft.totalAmount !== 'number') return false;
  if (!Array.isArray(draft.lineItems)) return false;
  return true;
}

export async function scanReceiptDraft(file, options = {}) {
  const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new ReceiptScanError(
      'Receipt scanning is not configured. You can still enter the expense manually.',
      'NOT_CONFIGURED',
      503,
    );
  }

  const client = options.client || new GoogleGenAI({ apiKey });
  try {
    const response = await client.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: file.mimetype,
              data: file.buffer.toString('base64'),
            },
          },
          {
            text: 'Extract this receipt into the requested schema. Use null when a field is not legible. Do not infer a total that is not visible.',
          },
        ],
      }],
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: draftSchema,
      },
    });
    const responseText = typeof response.text === 'function' ? response.text() : response.text;
    const draft = JSON.parse(responseText);
    if (!validateDraft(draft)) throw new Error('Invalid receipt draft shape');
    return draft;
  } catch (error) {
    if (error instanceof ReceiptScanError) throw error;
    if (error instanceof SyntaxError || error.message === 'Invalid receipt draft shape') {
      throw new ReceiptScanError(
        'The receipt could not be read. Please enter the expense manually.',
        'INVALID_RESPONSE',
        422,
      );
    }
    throw new ReceiptScanError(
      'Receipt scanning is temporarily unavailable. Please enter the expense manually.',
      'UNAVAILABLE',
      503,
    );
  }
}

export function isReceiptScanningConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}
