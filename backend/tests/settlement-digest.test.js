import { describe, expect, it, vi } from 'vitest';
import { runSettlementDigest, verifyDigestSecret } from '../src/services/settlementDigest.js';

describe('settlement digest', () => {
  it('rejects requests without the shared secret', () => {
    const req = { get: vi.fn().mockReturnValue('wrong') };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    verifyDigestSecret(req, res, vi.fn(), 'expected');

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid digest secret' });
  });

  it('is idempotent for each recipient and period', async () => {
    const sendEmail = vi.fn().mockResolvedValue({ id: 'email-1' });
    const claimDelivery = vi.fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    const input = {
      period: '2026-08',
      recipients: [{ id: 7, email: 'person@example.com', name: 'Person', groupId: 2 }],
      transactions: [{ from: 2, fromName: 'Person', to: 3, toName: 'Other', amount: 25 }],
      claimDelivery,
      releaseDelivery: vi.fn(),
      sendEmail,
    };

    await runSettlementDigest(input);
    await runSettlementDigest(input);

    expect(sendEmail).toHaveBeenCalledOnce();
    expect(claimDelivery).toHaveBeenCalledTimes(2);
  });
});
