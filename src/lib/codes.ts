// Friendly join code generator. Avoids ambiguous letters (I, O) and uses
// a 4-character alphabet so codes are easy to read on a slide and type
// on a phone, e.g. "KITE", "WAVE", "ZULU".

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateSessionCode(length = 4): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export function generateHostKey(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
