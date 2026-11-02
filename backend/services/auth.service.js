// Nonce-based wallet login (prevents replay). Sessions are in memory:
// restarting the server logs everyone out. Use Redis/DB if you scale to >1 instance.
const crypto = require('crypto');
const { verifySignature } = require('../utils/signatureVerify');

const NONCE_TTL = 5 * 60 * 1000;      // 5 minutes to sign
const SESSION_TTL = 60 * 60 * 1000;   // 1 hour session
const nonces = new Map();             // address(lower) -> { message, expires }
const sessions = new Map();           // token -> { address, expires }

function createChallenge(address) {
  const nonce = crypto.randomBytes(16).toString('hex');
  const message = `Sign in to Supply Chain Tracker\nAddress: ${address}\nNonce: ${nonce}\nIssued: ${new Date().toISOString()}`;
  nonces.set(address.toLowerCase(), { message, expires: Date.now() + NONCE_TTL });
  return message;
}

function login(address, signature) {
  const key = address.toLowerCase();
  const entry = nonces.get(key);
  if (!entry || entry.expires < Date.now()) return null;
  nonces.delete(key); // one-time use
  if (!verifySignature(entry.message, signature, address)) return null;
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { address, expires: Date.now() + SESSION_TTL });
  return { token, expiresIn: SESSION_TTL / 1000 };
}

function getSession(token) {
  const s = sessions.get(token);
  if (!s) return null;
  if (s.expires < Date.now()) { sessions.delete(token); return null; }
  return s;
}

function logout(token) { sessions.delete(token); }

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of nonces) if (v.expires < now) nonces.delete(k);
  for (const [k, v] of sessions) if (v.expires < now) sessions.delete(k);
}, 60 * 1000).unref();

module.exports = { createChallenge, login, getSession, logout };
