import CryptoJS from "crypto-js";

const SECRET_KEY = import.meta.env.VITE_JWT_SECRET || "default_secret";

export class EncryptionService {
  static encrypt(phoneNumber: string): string {
    if (!phoneNumber) {
      throw new Error("Phone number is required");
    }
    try {
      return CryptoJS.AES.encrypt(String(phoneNumber), String(SECRET_KEY)).toString();
    } catch {
      throw new Error("Failed to encrypt phone number");
    }
  }

  static decrypt(encrypted: string): string {
    if (!encrypted) {
      throw new Error("Encrypted value is required");
    }

    try {
      const bytes = CryptoJS.AES.decrypt(String(encrypted), String(SECRET_KEY));
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);

      if (typeof decrypted === "string" && decrypted.length > 0) {
        return decrypted;
      }

      if (typeof encrypted === "string" && encrypted.match(/^\+?[0-9]+$/)) {
        return encrypted;
      }

      throw new Error("Invalid encrypted value");
    } catch {
      if (typeof encrypted === "string" && encrypted.match(/^\+?[0-9]+$/)) {
        return encrypted;
      }
      throw new Error("Failed to decrypt phone number");
    }
  }
}
