import CryptoJS from "crypto-js";

const SECRET_KEY = import.meta.env.VITE_JWT_SECRET || "default_secret";

export class StorageService {
  static encrypt(value: string): string {
    return CryptoJS.AES.encrypt(value, SECRET_KEY).toString();
  }

  static decrypt(value: string): string {
    const bytes = CryptoJS.AES.decrypt(value, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  static setItem(key: string, value: string): void {
    const encrypted = this.encrypt(value);
    localStorage.setItem(key, encrypted);
  }

  static getItem(key: string): string | null {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    try {
      return this.decrypt(encrypted);
    } catch (error) {
      return null;
    }
  }

  static removeItem(key: string): void {
    localStorage.removeItem(key);
  }
}
