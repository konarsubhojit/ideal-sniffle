import { describe, expect, it, vi } from 'vitest';
import { requireContributor, requireRole } from '../src/middleware/authorization.js';

function response() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe('receipt RBAC', () => {
  it('allows readers to view receipt metadata and signed URLs', () => {
    const next = vi.fn();
    requireRole({ user: { id: 1, role: 'reader' } }, response(), next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('only allows contributors and admins to modify receipts', () => {
    const readerResponse = response();
    requireContributor({ user: { id: 1, role: 'reader' } }, readerResponse, vi.fn());
    expect(readerResponse.status).toHaveBeenCalledWith(403);

    for (const role of ['contributor', 'admin']) {
      const next = vi.fn();
      requireContributor({ user: { id: 1, role } }, response(), next);
      expect(next).toHaveBeenCalledOnce();
    }
  });
});
