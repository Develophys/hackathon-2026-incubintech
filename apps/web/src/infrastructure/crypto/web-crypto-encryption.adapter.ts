import type { EncryptionPort } from "@/ports/encryption.port";

const DB_NAME = "zelo-crypto";
const STORE_NAME = "keys";
const KEY_ID = "assessment-encryption-key";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getStoredKey(db: IDBDatabase): Promise<JsonWebKey | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(KEY_ID);
    req.onsuccess = () => resolve(req.result as JsonWebKey | undefined);
    req.onerror = () => reject(req.error);
  });
}

function putStoredKey(db: IDBDatabase, jwk: JsonWebKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(jwk, KEY_ID);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * AES-256-GCM, key generated once per device and persisted in IndexedDB
 * (exported/imported as JWK) — the key never leaves the device, so this
 * ciphertext is genuinely undecryptable by the backend that stores it
 * (spec Section D, PRD FR-14).
 */
export class WebCryptoEncryptionAdapter implements EncryptionPort {
  private keyPromise: Promise<CryptoKey> | undefined;

  private getKey(): Promise<CryptoKey> {
    if (!this.keyPromise) {
      this.keyPromise = this.loadOrCreateKey();
    }
    return this.keyPromise;
  }

  private async loadOrCreateKey(): Promise<CryptoKey> {
    const db = await openDb();
    const existing = await getStoredKey(db);
    if (existing) {
      return crypto.subtle.importKey("jwk", existing, { name: "AES-GCM" }, true, ["encrypt", "decrypt"]);
    }
    const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
    const exported = await crypto.subtle.exportKey("jwk", key);
    await putStoredKey(db, exported);
    return key;
  }

  async encrypt(plaintext: string): Promise<string> {
    const key = await this.getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);
    const ciphertextBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

    const combined = new Uint8Array(iv.length + ciphertextBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertextBuffer), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  async decrypt(ciphertext: string): Promise<string> {
    const key = await this.getKey();
    const combined = Uint8Array.from(atob(ciphertext), (char) => char.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const plaintextBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
    return new TextDecoder().decode(plaintextBuffer);
  }
}
