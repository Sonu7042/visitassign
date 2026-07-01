const crypto = require('crypto');
const QRCode = require('qrcode');

// Signs a passId so the check-in scanner can verify the QR payload hasn't
// been tampered with before doing any database lookup.
const signPassId = (passId) =>
  crypto
    .createHmac('sha256', process.env.QR_SECRET || 'change_me')
    .update(passId.toString())
    .digest('hex');

const generateQrPayload = (passId) =>
  JSON.stringify({ passId: passId.toString(), sig: signPassId(passId) });

// Returns the passId if the signature is valid, otherwise null.
const verifyQrPayload = (payloadStr) => {
  let payload;
  try {
    payload = JSON.parse(payloadStr);
  } catch (err) {
    return null;
  }

  if (!payload || !payload.passId || !payload.sig) return null;
  if (signPassId(payload.passId) !== payload.sig) return null;

  return payload.passId;
};

const generateQrDataUrl = (passId) => QRCode.toDataURL(generateQrPayload(passId), { width: 300, margin: 1 });

const generateQrBuffer = (passId) => QRCode.toBuffer(generateQrPayload(passId), { width: 300, margin: 1 });

module.exports = { generateQrPayload, verifyQrPayload, generateQrDataUrl, generateQrBuffer };
