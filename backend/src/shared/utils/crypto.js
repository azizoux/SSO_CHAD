import crypto from "crypto";

export const generateRandomToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString("hex");
};

export const sha256 = (value) => {
  return crypto.createHash("sha256").update(value).digest("hex");
};

export const sha256Base64Url = (value) => {
  return crypto.createHash("sha256").update(value).digest("base64url");
};
