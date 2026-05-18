const twilio = require('twilio');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      contactPhone,
      contactName,
      driverName,
      facilityName,
      arrivedAt,
      timerMinutes
    } = req.body;

    if (!contactPhone) {
      return res.status(400).json({ error: 'Missing contact phone number' });
    }

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const arrivedTime = arrivedAt ? new Date(arrivedAt).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) : 'unknown time';

    const message = `⚠️ DOCKWARRIOR SAFETY ALERT

${driverName || 'A driver'} set a ${timerMinutes}-minute safety check-in timer at ${facilityName || 'a facility'} and did not check back in.

They arrived at ${arrivedTime} and have not confirmed they are safe.

Please try to contact them immediately.

This alert was sent automatically by DockWarrior — dockwarrior.com`;

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: contactPhone
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Twilio error:', error);
    return res.status(500).json({ error: error.message });
  }
};
