import { describe, expect, it, vi } from 'vitest';
import {
  deleteReceipt,
  getReceiptUrl,
  uploadReceipt,
  validateReceiptFile,
} from '../src/storage.js';

const jpeg = {
  originalname: 'receipt.jpg',
  mimetype: 'image/jpeg',
  size: 4,
  buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
};

describe('receipt storage', () => {
  it('validates content instead of trusting the declared MIME type', () => {
    expect(validateReceiptFile(jpeg)).toBe('image/jpeg');
    expect(() => validateReceiptFile({ ...jpeg, buffer: Buffer.from('not an image') }))
      .toThrow('does not match');
    expect(() => validateReceiptFile({ ...jpeg, mimetype: 'image/gif' }))
      .toThrow('not supported');
  });

  it('uploads and deletes private receipt objects', async () => {
    const send = vi.fn().mockResolvedValue({});
    const client = { send };

    await uploadReceipt(jpeg, 'receipts/1/test.jpg', { client, bucket: 'receipts' });
    await deleteReceipt('receipts/1/test.jpg', { client, bucket: 'receipts' });

    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0][0].input).toMatchObject({
      Bucket: 'receipts',
      Key: 'receipts/1/test.jpg',
      ContentType: 'image/jpeg',
    });
    expect(send.mock.calls[1][0].input).toMatchObject({
      Bucket: 'receipts',
      Key: 'receipts/1/test.jpg',
    });
  });

  it('generates a short-lived presigned URL', async () => {
    const presign = vi.fn().mockResolvedValue('https://signed.example/receipt');
    const url = await getReceiptUrl('receipt-key', {
      client: {},
      bucket: 'receipts',
      presign,
      expiresIn: 300,
    });

    expect(url).toBe('https://signed.example/receipt');
    expect(presign).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ input: { Bucket: 'receipts', Key: 'receipt-key' } }),
      { expiresIn: 300 },
    );
  });
});
