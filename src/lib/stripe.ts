import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
})

export const PLANS = {
  monthly: {
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID!,
    amount: 1990, // 19,90€ in Cents
    currency: 'eur',
    interval: 'month',
    trialDays: 7,
  },
} as const

// Checkout Session erstellen
export async function createCheckoutSession(userId: string, email: string) {
  return stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card', 'sepa_debit'],
    customer_email: email,
    line_items: [
      {
        price: PLANS.monthly.priceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: PLANS.monthly.trialDays,
      metadata: { userId },
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/de/account?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/de?canceled=true`,
    metadata: { userId },
  })
}
