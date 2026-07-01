// Client-side hashing for sensitive fields (currently: password) before they
// leave the browser. This is a defense-in-depth measure on top of TLS in
// transit and bcrypt hashing at rest on the backend — it is not a substitute
// for either. Other user fields (email, mobile, CTC, etc.) are intentionally
// left unhashed since the backend must query/display them in plaintext.
export async function sha256Hex(input) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
