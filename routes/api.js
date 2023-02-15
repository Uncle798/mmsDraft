const express = require('express');
const { ensureLoggedIn } = require('connect-ensure-login');

const router = express.Router();
const prisma = require('../lib/db');

router.get(
  '/user/contactInfo',
  ensureLoggedIn(),
  async (req, res, next) => {
    const user = await prisma.user.findUnique({
      where: { email: req.body },
      include: { contactInfo: true },
    });
    res.body = user;
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
    res.body = customer;
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
    res.body = customers;
    next();
  },
);

module.exports = router;
