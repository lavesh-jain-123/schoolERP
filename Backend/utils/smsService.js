const axios = require('axios');

/**
 * Send SMS via Twilio (Trial Account - $15 free credit)
 * Trial can only send to verified numbers. Verify numbers at:
 * https://console.twilio.com/us1/develop/phone-numbers/manage/verified
 */
async function sendViaTwilio({ mobile, message }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Twilio credentials not configured in .env');
  }

  const twilio = require('twilio')(accountSid, authToken);

  try {
    // Add country code for Indian numbers
    const toNumber = mobile.startsWith('+') ? mobile : `+91${mobile}`;

    const result = await twilio.messages.create({
      body: message,
      from: fromNumber,
      to: toNumber,
    });

    return { success: true, sid: result.sid, status: result.status };
  } catch (err) {
    throw new Error(err.message || 'Twilio SMS failed');
  }
}

/**
 * Send SMS via Fast2SMS (India-specific, free credits on signup)
 * No DLT needed for testing with 'q' route (quick transactional)
 */
async function sendViaFast2SMS({ mobile, message }) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) throw new Error('FAST2SMS_API_KEY not set in .env');

  const { data } = await axios.post(
    'https://www.fast2sms.com/dev/bulkV2',
    {
      route: process.env.FAST2SMS_ROUTE || 'q',
      message,
      language: 'english',
      flash: 0,
      numbers: mobile.replace(/\D/g, '').slice(-10), // Last 10 digits only
    },
    {
      headers: {
        authorization: apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    }
  );

  if (data?.return === true) return { success: true, raw: data };
  throw new Error(data?.message || JSON.stringify(data));
}

/**
 * Send SMS via TextBelt (Global, 1 free SMS per day per IP)
 * No signup needed - great for quick testing
 */
async function sendViaTextBelt({ mobile, message }) {
  const key = process.env.TEXTBELT_KEY || 'textbelt'; // 'textbelt' = free tier
  const phone = mobile.startsWith('+') ? mobile : `+91${mobile}`;

  const { data } = await axios.post('https://textbelt.com/text', {
    phone,
    message,
    key,
  });

  if (data?.success) return { success: true, quotaRemaining: data.quotaRemaining };
  throw new Error(data?.error || 'TextBelt failed');
}

/**
 * Main function: Send fee payment SMS to parent
 */
async function sendFeePaymentSMS({
  parentMobile,
  parentName,
  studentName,
  amount,
  receiptNo,
  month,
}) {
  const cleanMobile = String(parentMobile).replace(/\D/g, '').slice(-10);

  const message =
    `Dear ${parentName}, fee payment of Rs.${amount} received for ` +
    `${studentName}${month ? ' (' + month + ')' : ''}. ` +
    `Receipt: ${receiptNo}. Thank you. - School ERP`;

  const provider = (process.env.SMS_PROVIDER || 'twilio').toLowerCase();

  try {
    let result;
    if (provider === 'twilio') {
      result = await sendViaTwilio({ mobile: cleanMobile, message });
    } else if (provider === 'textbelt') {
      result = await sendViaTextBelt({ mobile: cleanMobile, message });
    } else if (provider === 'fast2sms') {
      result = await sendViaFast2SMS({ mobile: cleanMobile, message });
    } else {
      throw new Error(`Unknown SMS provider: ${provider}`);
    }
    return { success: true, provider, ...result };
  } catch (err) {
    return {
      success: false,
      provider,
      error: err.message || 'SMS failed',
    };
  }
}

/**
 * Send pending fee reminder SMS to parent
 */
async function sendFeePendingSMS({
  parentMobile,
  parentName,
  studentName,
  monthsPending,
  totalDue,
}) {
  const cleanMobile = String(parentMobile).replace(/\D/g, '').slice(-10);

  const message =
    `Dear ${parentName}, fee payment reminder for ${studentName}. ` +
    `Pending: ${monthsPending} month(s), Amount: Rs.${totalDue}. ` +
    `Please clear dues at earliest. - School ERP`;

  const provider = (process.env.SMS_PROVIDER || 'twilio').toLowerCase();

  try {
    let result;
    if (provider === 'twilio') {
      result = await sendViaTwilio({ mobile: cleanMobile, message });
    } else if (provider === 'textbelt') {
      result = await sendViaTextBelt({ mobile: cleanMobile, message });
    } else if (provider === 'fast2sms') {
      result = await sendViaFast2SMS({ mobile: cleanMobile, message });
    } else {
      throw new Error(`Unknown SMS provider: ${provider}`);
    }
    return { success: true, provider, ...result };
  } catch (err) {
    return {
      success: false,
      provider,
      error: err.message || 'SMS failed',
    };
  }
}

module.exports = { sendFeePaymentSMS, sendFeePendingSMS };