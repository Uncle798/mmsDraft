const express = require('express');
const { ensureLoggedIn } = require('connect-ensure-login');

const router = express.Router();
const prisma = require('../lib/db');
const { contactInfo } = require('../lib/db');

router.put(
  '/users/stripeid',
  ensureLoggedIn(),
  async (req, res, next) => {
    const { user, body } = req;
    const dbUser = await prisma.user.update({
      where: { email: user.email },
      data: { stripeId: body.stripeId },
      select: {
        email: true,
        familyName: true,
        givenName: true,
        id: true,
      },
      include: { employee: true },
    });
    res.json(dbUser);
    next();
  },
);

router.post(
  '/user/contactInfo',
  ensureLoggedIn(),
  async (req, res, next) => {
    const data = req.body;
    const contactInfo = await prisma.contactInfo.create({
      data,
    });
    res.json(contactInfo);
    next();
  },
);

router.get(
  '/:userId/:contactInfo',
  ensureLoggedIn(),
  async (req, res, next) => {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      include: { contactInfo: {
        where: { id: contactInfo}
      } },
    });
    res.json(user);
    next();
  },
);

router.get(
  '/user/leases',
  ensureLoggedIn(),
  async (req, res, next) => {
    const customer = await prisma.user.findUnique({
      where: { email: req.body },
      include: { customerLeases: true },
    });
    res.json(customer);
    next();
  },
);

router.get(
  '/currentcustomers',
  ensureLoggedIn(),
  async (req, res, next) => {
    const customers = await prisma.lease.findMany({
      where: {
        leaseEnded: null,
      },
      include: {
        customer: true,
        unitPrice: true,
      },
    });
    res.json(customers);
    next();
  },
);

module.exports = router;
