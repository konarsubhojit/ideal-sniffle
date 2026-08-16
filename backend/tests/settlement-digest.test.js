import { describe, expect, it, vi } from 'vitest';
import {
  renderDigestText,
  runSettlementDigest,
  verifyDigestSecret,
} from '../src/services/settlementDigest.js';

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

  it('renders settled, owing, and owed personal positions', () => {
    const recipient = { groupId: 2 };
    expect(renderDigestText(recipient, [], '2026-08')).toContain('You are settled up.');
    expect(renderDigestText(recipient, [
      { from: 2, to: 3, toName: 'Other', amount: 25 },
      { from: 4, fromName: 'Friend', to: 2, amount: 10 },
    ], '2026-08')).toContain('You owe Other: ₹25.00');
    expect(renderDigestText(recipient, [
      { from: 4, fromName: 'Friend', to: 2, amount: 10 },
    ], '2026-08')).toContain('Friend owes you: ₹10.00');
  });

  it('continues after a failed delivery claim cleanup', async () => {
    const sendEmail = vi.fn()
      .mockRejectedValueOnce(new Error('email failed'))
      .mockResolvedValueOnce({ id: 'email-2' });

    await expect(runSettlementDigest({
      period: '2026-08',
      recipients: [
        { id: 1, email: 'one@example.com', groupId: 1 },
        { id: 2, email: 'two@example.com', groupId: 2 },
      ],
      transactions: [],
      claimDelivery: vi.fn().mockResolvedValue(true),
      releaseDelivery: vi.fn().mockRejectedValue(new Error('database failed')),
      sendEmail,
    })).resolves.toMatchObject({ sent: 1, failed: 1 });

    expect(sendEmail).toHaveBeenCalledTimes(2);
  });
});
