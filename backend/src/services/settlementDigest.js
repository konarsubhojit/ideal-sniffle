import crypto from 'node:crypto';
import logger from '../utils/logger.js';

function safeEqual(actual, expected) {
  if (!actual || !expected) return false;
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

export function verifyDigestSecret(req, res, next, secret = process.env.DIGEST_SECRET) {
  if (!safeEqual(req.get('x-digest-secret'), secret)) {
    return res.status(401).json({ error: 'Invalid digest secret' });
  }
  next();
}

function personalTransactions(groupId, transactions) {
  return transactions.filter(item => item.from === groupId || item.to === groupId);
}

export function renderDigestText(recipient, transactions, period) {
  const personal = personalTransactions(recipient.groupId, transactions);
  if (personal.length === 0) {
    return `Settlement digest for ${period}\n\nYou are settled up.`;
  }
  const lines = personal.map(item => (
    item.from === recipient.groupId
      ? `You owe ${item.toName}: ₹${item.amount.toFixed(2)}`
      : `${item.fromName} owes you: ₹${item.amount.toFixed(2)}`
  ));
  return `Settlement digest for ${period}\n\n${lines.join('\n')}`;
}

export async function runSettlementDigest({
  period,
  recipients,
  transactions,
  claimDelivery,
  releaseDelivery,
  sendEmail,
}) {
  const result = { sent: 0, skipped: 0, failed: 0 };
  for (const recipient of recipients) {
    const claimed = await claimDelivery(period, recipient.id);
    if (!claimed) {
      result.skipped += 1;
      continue;
    }
    try {
      await sendEmail({
        to: recipient.email,
        subject: `Settlement digest — ${period}`,
        text: renderDigestText(recipient, transactions, period),
      });
      result.sent += 1;
    } catch (error) {
      try {
        await releaseDelivery(period, recipient.id);
      } catch (releaseError) {
        logger.error('Failed to release settlement digest delivery claim', releaseError, {
          period,
          userId: recipient.id,
        });
      }
      result.failed += 1;
    }
  }
  return result;
}
