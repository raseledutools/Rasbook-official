// src/services/e2eEncryption.js
// AES-GCM End-to-End Encryption — Web Crypto API (works on both web + native via expo-crypto)
// Key per chat pair: derived from both UIDs using PBKDF2

// ── Key derivation ─────────────────────────────────────────────────────────
// chatId দিয়ে একটা unique key বানাও — দুই পাশে same key হবে
const deriveKey = async (chatId) => {
  const encoder = new TextEncoder();
  // Static app salt + chatId → unique per conversation
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode('RasBook-E2E-v1-' + chatId),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('rasbook-salt-2024'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

// ── Encrypt ────────────────────────────────────────────────────────────────
export const encryptMessage = async (plaintext, chatId) => {
  try {
    const key = await deriveKey(chatId);
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(plaintext)
    );

    // IV + ciphertext একসাথে base64 করে পাঠাও
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch (e) {
    console.warn('[E2E] Encrypt failed:', e.message);
    return plaintext; // fallback: plain (should not happen)
  }
};

// ── Decrypt ────────────────────────────────────────────────────────────────
export const decryptMessage = async (ciphertext, chatId) => {
  try {
    if (!ciphertext || typeof ciphertext !== 'string') return ciphertext;

    // Legacy plain messages (before encryption) — base64 check
    // base64 strings contain only A-Z a-z 0-9 + / =
    const isBase64 = /^[A-Za-z0-9+/]+=*$/.test(ciphertext) && ciphertext.length > 20;
    if (!isBase64) return ciphertext; // plain text — old message

    const key = await deriveKey(chatId);
    const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));

    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch (e) {
    // Decryption fail = old unencrypted message, show as-is
    return ciphertext;
  }
};

// ── Encrypt file metadata ──────────────────────────────────────────────────
// File URL টা encrypt করার দরকার নেই (Cloudinary signed URL already secure)
// কিন্তু fileName encrypt করা যায়
export const encryptMeta = async (meta, chatId) => {
  if (!meta) return meta;
  const encrypted = {};
  for (const [k, v] of Object.entries(meta)) {
    if (typeof v === 'string' && k === 'fileName') {
      encrypted[k] = await encryptMessage(v, chatId);
    } else {
      encrypted[k] = v;
    }
  }
  return encrypted;
};

export const decryptMeta = async (meta, chatId) => {
  if (!meta) return meta;
  const decrypted = {};
  for (const [k, v] of Object.entries(meta)) {
    if (typeof v === 'string' && k === 'fileName') {
      decrypted[k] = await decryptMessage(v, chatId);
    } else {
      decrypted[k] = v;
    }
  }
  return decrypted;
};
