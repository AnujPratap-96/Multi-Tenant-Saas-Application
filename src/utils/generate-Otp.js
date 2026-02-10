import crypto from 'crypto';

export const generateOtp = (length = 6, tokenLength = 32) => {
  // Generate OTP
  const otp = crypto.randomInt(
    10 ** (length - 1),
    10 ** length
  ).toString();

  // Generate secure random token for the link
  const token = crypto.randomBytes(tokenLength).toString('hex');

  // Create a combined hash of OTP + token for secure verification
  const combinedHash = crypto
    .createHash('sha256')
    .update(otp + token)
    .digest('hex');

  return { 
    otp,           // Send this via email
    token,         // Include this in the verification link
    combinedHash   // Store this in database
  };
};



// Verification function
export const verifyOtpWithToken = (inputOtp, inputToken, storedHash) => {
  const inputHash = crypto
    .createHash('sha256')
    .update(inputOtp + inputToken)
    .digest('hex');
  
  return inputHash === storedHash;
};