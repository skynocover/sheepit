import type { Context, Next } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { generateId } from './id';

const COOKIE_NAME = 'sid';
const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days in seconds

interface SessionPayload {
  id: string;
  userId?: string;
}

const encoder = new TextEncoder();

const getSigningKey = async (secret: string): Promise<CryptoKey> => {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
};

const toBase64Url = (buf: ArrayBuffer): string => {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromBase64Url = (str: string): Uint8Array => {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const signPayload = async (payload: SessionPayload, key: CryptoKey): Promise<string> => {
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = toBase64Url(encoder.encode(payloadJson).buffer as ArrayBuffer);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadB64));
  const sigB64 = toBase64Url(sig);
  return `${payloadB64}.${sigB64}`;
};

const verifyAndDecode = async (cookie: string, key: CryptoKey): Promise<SessionPayload | null> => {
  const dotIndex = cookie.indexOf('.');
  if (dotIndex === -1) return null;

  const payloadB64 = cookie.slice(0, dotIndex);
  const sigB64 = cookie.slice(dotIndex + 1);

  try {
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64Url(sigB64),
      encoder.encode(payloadB64),
    );
    if (!valid) return null;

    const payloadJson = new TextDecoder().decode(fromBase64Url(payloadB64));
    return JSON.parse(payloadJson) as SessionPayload;
  } catch {
    return null;
  }
};

export const sessionMiddleware = async (c: Context, next: Next): Promise<void> => {
  const key = await getSigningKey(c.env.SESSION_SECRET);
  const raw = getCookie(c, COOKIE_NAME);
  let session: SessionPayload | null = null;

  if (raw) {
    session = await verifyAndDecode(raw, key);
  }

  if (!session) {
    session = { id: generateId() };
  }

  c.set('session', session);

  await next();

  const updated = c.get('session') as SessionPayload;
  const signed = await signPayload(updated, key);

  setCookie(c, COOKIE_NAME, signed, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_TTL,
  });
};
