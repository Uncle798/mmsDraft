import Stripe from 'stripe';

const stripe = Stripe(String(process.env.STRIPE_TEST_SECRET_KEY));

export default stripe;
