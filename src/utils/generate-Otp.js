import crypto from 'crypto';

 export const generateOtp = (length = 6) => {
  const otp = crypto.randomInt(
    10 ** (length - 1),
    10 ** length
  ).toString();

  const hash = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  return { otp, hash };
};

export const verifyOtpCode = async (plainOtp, storedHash) => {
  const hash = crypto
    .createHash("sha256")
    .update(plainOtp)
    .digest("hex");

  return hash === storedHash;
};