const express = require('express');
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
const needle = require('needle')

const router = express.Router();
import { response } from 'express';
import Stripe from 'stripe';
const stripe = new Stripe((String(process.env.STRIPE_TEST_SECRET_KEY)));

router.post(
  '/createCheckout',
  ensureLoggedIn(),
  async (req, res) => {
    const session = await stripe.checkout.sessions.create({
        line_items:[
            {
                price: ,
                quantity: ,
            }
        ],
        mode: 'subscription', // or Payment for one time
        success_url: '/thankyou',
        cancel_url: '/cancel'
    })
  },
);

router.post(
    '/createcustomer',
    ensureLoggedIn(),
    async (req, res, next) =>{
        const { body } = req
        const stripeCustomer = await stripe.customers.create({
            email: body.email,
            name: body.name,
        })
        needle.put(
            '/api/users/stripeid',
            stripeCustomer, 
            async (err, response) =>{
                res.json(response)
                next();
            }
        )
    }
)

module.exports = router;
