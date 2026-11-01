const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  signJwt,
  verifyJwt,
  hashPassword,
  verifyPassword,
} = require('../../utils/authHelpers');

describe('Unit Tests: Authentication, JWT & Security Cryptography', () => {

  describe('1. JWT Signing and Verification', () => {
    it('should generate a valid 3-part JWT token and verify its payload', () => {
      const payload = { id: 'usr-123', username: 'dr_sara', role: 'ADMIN' };
      const token = signJwt(payload, 3600);

      assert.equal(typeof token, 'string');
      const parts = token.split('.');
      assert.equal(parts.length, 3, 'JWT should contain header, payload, and signature');

      const decoded = verifyJwt(token);
      assert.ok(decoded, 'Token should decode successfully');
      assert.equal(decoded.id, 'usr-123');
      assert.equal(decoded.username, 'dr_sara');
      assert.equal(decoded.role, 'ADMIN');
      assert.ok(decoded.exp > Math.floor(Date.now() / 1000));
    });

    it('should reject an expired JWT token', () => {
      const payload = { id: 'usr-456', username: 'reception_test' };
      // Expired 10 seconds ago (-10)
      const token = signJwt(payload, -10);

      const decoded = verifyJwt(token);
      assert.equal(decoded, null, 'Expired token must return null');
    });

    it('should reject a tampered JWT token with modified payload', () => {
      const token = signJwt({ id: 'usr-789', role: 'RECEPTIONIST' });
      const parts = token.split('.');
      
      // Tamper payload to elevate role to ADMIN
      const tamperedPayload = Buffer.from(JSON.stringify({ id: 'usr-789', role: 'ADMIN' }))
        .toString('base64')
        .replace(/=/g, '');
      const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

      const decoded = verifyJwt(tamperedToken);
      assert.equal(decoded, null, 'Tampered token signature mismatch must return null');
    });

    it('should return null for malformed or empty tokens', () => {
      assert.equal(verifyJwt(''), null);
      assert.equal(verifyJwt(null), null);
      assert.equal(verifyJwt('not-a-token'), null);
      assert.equal(verifyJwt('part1.part2'), null);
    });
  });

  describe('2. Scrypt Password Hashing and Safe Timing Verification', () => {
    it('should hash a password and verify it correctly', () => {
      const rawPassword = 'ClinicSecretPassword@2026';
      const hash = hashPassword(rawPassword);

      assert.ok(hash.startsWith('scrypt$'), 'Hash should start with scrypt$ prefix');
      assert.equal(verifyPassword(rawPassword, hash), true, 'Correct password must verify');
      assert.equal(verifyPassword('WrongPassword', hash), false, 'Incorrect password must fail');
    });

    it('should produce distinct salt and hash for the same password', () => {
      const p1 = 'password123';
      const h1 = hashPassword(p1);
      const h2 = hashPassword(p1);

      assert.notEqual(h1, h2, 'Two hashes with different salts must not be identical');
      assert.equal(verifyPassword(p1, h1), true);
      assert.equal(verifyPassword(p1, h2), true);
    });

    it('should support legacy plaintext passwords seamlessly for backward compatibility', () => {
      const legacyPassword = '123';
      assert.equal(verifyPassword('123', legacyPassword), true);
      assert.equal(verifyPassword('wrong', legacyPassword), false);
    });

    it('should safely reject empty or invalid inputs', () => {
      assert.equal(hashPassword(''), '');
      assert.equal(verifyPassword('', ''), false);
      assert.equal(verifyPassword('123', null), false);
    });
  });

});
