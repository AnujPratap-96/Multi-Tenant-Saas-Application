import crypto from 'crypto';

export const generateOtp = (length = 6, requestId) => {
  // Generate OTP

  const otp = crypto.randomInt(
    10 ** (length - 1),
    10 ** length
  ).toString();

  // Create a combined hash of OTP + token for secure verification
  const combinedHash = crypto
    .createHash('sha256')
    .update(otp + requestId)
    .digest('hex');
  return {
    otp,           // Send this via email
    combinedHash   // Store this in database
  };
};



// Verification function
export const verifyOtp = (inputOtp, requestId, purpose, otpData) => {
  const inputHash = crypto
    .createHash('sha256')
    .update(inputOtp + requestId)
    .digest('hex');
console.log(purpose, otpData.purpose);
  if (purpose && otpData.purpose !== purpose) {
    return false; // Purpose mismatch
  }

  return inputHash === otpData.codeHash;
};