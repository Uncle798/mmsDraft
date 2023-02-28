const express = require('express');
const { ensureLoggedIn } = require('connect-ensure-login');

const router = express.Router();
const prisma = require('../lib/db');
const { subtractMonths } = require('../lib/dateHelpers');
const { objHelpers, prettyKeys } = require('../lib/objectHelpers');

router.get('/', (req, res) => { res.render('index'); });

router.get(
  '/user/currentinfo',
  // ensureLoggedIn(),
  async (req, res) => {
    const dbUser = await prisma.user.findUnique({
      where: { id: req.query.data },
      include: {
        customerLeases: {
          include: {
            invoices: {
              where: { invoiceCreated: { lte: new Date(subtractMonths(Date.now(), 12)) } },
              include: { paymentRecord: true },
            },
          },
        },
        contactInfo: {
          where: { softDelete: false },
        },
      },
    });
    const returnObj = prettyKeys(dbUser);
    res.json(returnObj);
  },
);

/** Contact Info  */
router.post(
  '/user/contactInfo',
  ensureLoggedIn(),
  async (req, res) => {
    const data = req.body;
    const contactInfo = await prisma.contactInfo.create({
      data,
    });
    const returnObj = objHelpers(contactInfo);
    res.json(returnObj);
  },
);

router.get(
  '/:userId/:contactInfo',
  ensureLoggedIn(),
  async (req, res) => {
    const dbUser = await prisma.user.findUnique({
      where: { id: req.params.userId },
      include: {
        contactInfo: {
          where: { id: req.params.contactInfo },
        },
      },
    });
    const returnObj = objHelpers(dbUser);
    res.json(returnObj);
  },
);
/** /contactInfo */

/* Leases */
router.get(
  '/:user/leases',
  ensureLoggedIn(),
  async (req, res) => {
    const customer = await prisma.user.findUnique({
      where: { email: req.params.user },
      include: { customerLeases: true },
    });
    const returnObj = objHelpers(customer);
    res.json(returnObj);
  },
);

router.post(
  '/newlease',
  async (req, res) => {
    const {
      leaseEffectiveDate,
      employeeId,
      customerId,
      contactInfoId,
    } = req.body;
    const dbLease = await prisma.lease.create({
      data: {
        leaseEffectiveDate, employeeId, customerId, contactInfoId,
      },
    });
  },
);

/** Admin apis */

router.get(
  '/currentcustomers',
  async (req, res) => {
    const leases = await prisma.lease.findMany({
      // where: {
      //   leaseEnded: { equals: null },
      // },
      select: {
        unitNum: true,
        price: true,
        leaseEffectiveDate: true,
        customer: true,
      },
      orderBy: { unitNum: 'asc' },
    });
    let returnObj = {};
    leases.forEach((lease) => {
      returnObj += objHelpers(lease);
    });
    res.json(returnObj);
  },
);

router.put(
  '/users/stripeid',
  ensureLoggedIn(),
  async (req, res) => {
    const { body } = req;
    const dbUser = await prisma.user.update({
      where: { email: body.email },
      data: { stripeId: body.stripeId },
      select: {
        email: true,
        familyName: true,
        givenName: true,
        id: true,
      },
      include: { employee: true },
    });
    const returnObj = objHelpers(dbUser);
    res.json(returnObj);
  },
);

module.exports = router;
