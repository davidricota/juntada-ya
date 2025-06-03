import CryptoJS from "crypto-js";

const SECRET_KEY = import.meta.env.VITE_JWT_SECRET || "default_secret";

export class EncryptionService {
  static encrypt(phoneNumber: string): string {
    if (!phoneNumber) {
      throw new Error("Phone number is required");
    }
    try {
      return CryptoJS.AES.encrypt(phoneNumber, SECRET_KEY).toString();
    } catch (error) {
      console.error("Error encrypting phone number:", error);
      throw new Error("Failed to encrypt phone number");
    }
  }

  static decrypt(encrypted: string): string {
    if (!encrypted) {
      throw new Error("Encrypted value is required");
    }

    try {
      // Primero intentamos desencriptar con CryptoJS
      const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);

      // Si la desencriptación fue exitosa y el resultado es válido, lo retornamos
      if (decrypted && decrypted.length > 0) {
        return decrypted;
      }

      // Si llegamos aquí, el valor no está encriptado con CryptoJS
      // Asumimos que es un número de teléfono sin encriptar y lo retornamos
      if (encrypted.match(/^\+?[0-9]+$/)) {
        return encrypted;
      }

      throw new Error("Invalid encrypted value");
    } catch (error) {
      console.error("Error decrypting phone number:", error);
      // Si falla la desencriptación, asumimos que es un número sin encriptar
      if (encrypted.match(/^\+?[0-9]+$/)) {
        return encrypted;
      }
      throw new Error("Failed to decrypt phone number");
    }
  }
}
