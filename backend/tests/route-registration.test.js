import { describe, expect, it } from 'vitest';
import settlementRoutes from '../src/routes/settlement.js';
import userRoutes from '../src/routes/users.js';

function registeredPaths(router) {
  return router.stack
    .filter(layer => layer.route)
    .map(layer => `${Object.keys(layer.route.methods)[0].toUpperCase()} ${layer.route.path}`);
}

describe('feature route registration', () => {
  it('registers the digest endpoint at startup', () => {
    expect(registeredPaths(settlementRoutes)).toContain('POST /settlement/digest');
  });

  it('registers both digest preference endpoints at startup', () => {
    const paths = registeredPaths(userRoutes);
    expect(paths).toContain('GET /me/digest-preference');
    expect(paths).toContain('PATCH /me/digest-preference');
  });
});
