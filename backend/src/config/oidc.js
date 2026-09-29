import fs from "fs";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const resolvePath = (filePath) => {
  return path.resolve(process.cwd(), filePath);
};

const privateKeyPath = process.env.OIDC_PRIVATE_KEY_PATH;
const publicKeyPath = process.env.OIDC_PUBLIC_KEY_PATH;

if (!process.env.OIDC_ISSUER) {
  throw new Error("OIDC_ISSUER doit être configuré");
}

if (!privateKeyPath || !publicKeyPath) {
  throw new Error("Les clés OIDC doivent être configurées");
}

export const oidcConfig = {
  issuer: process.env.OIDC_ISSUER,
  keyId: process.env.OIDC_KEY_ID || "chad-sso-key-1",
  privateKey: fs.readFileSync(resolvePath(privateKeyPath), "utf8"),
  publicKey: fs.readFileSync(resolvePath(publicKeyPath), "utf8"),
};
