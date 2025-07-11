import CryptoJS from "crypto-js";

const SECRET_KEY = import.meta.env.VITE_JWT_SECRET || "default_secret";

export function encrypt(value: string) {
  return CryptoJS.AES.encrypt(String(value), String(SECRET_KEY)).toString();
}

export function decrypt(value: string) {
  const bytes = CryptoJS.AES.decrypt(String(value), String(SECRET_KEY));
  return bytes.toString(CryptoJS.enc.Utf8);
}
