const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, email } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ error: 'Missing userId or email' });
    }

    const appUrl = process.env.REACT_APP_URL || 'https://app.dockwarrior.com';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'DockWarrior Pro',
              description: 'Unlimited reviews, PDF detention invoices, route alerts, safety SMS, and more.',
              images: ['https://dockwarrior.com/wp-content/uploads/2026/05/Firefly_Gemini-Flash_Spell-Empowers-correctly.-Spelled-wrong-on-this.-74789-1.png'],
            },
            unit_amount: 900,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId,
      },
      success_url: `${appUrl}/profile?upgraded=true`,
      cancel_url: `${appUrl}/pricing?cancelled=true`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    return res.status(500).json({ error: error.message });
  }
};
