const express = require('express');
const { ensureLoggedIn } = require('connect-ensure-login');

const router = express.Router();
const prisma = require('../lib/db');
const { addMonths, subtractMonths } = require('../lib/dateHelpers');
const { values } = require('lodash');

router.get('/', (req, res, next) => { res.render('index'); });

router.get(
  '/user/currentinfo',
  // ensureLoggedIn(),
  async (req, res, next) => {
    const user = await prisma.user.findUnique({
      where: { id: req.query.data },
      include: {
        customerLeases: {
          include: {
            invoices: {
              where: { invoiceCreated: { lte: new Date(subtractMonths(Date.now(), 12)) } },
              include: { paymentRecord: true, }
            },
          }
        },
        contactInfo: {
          where: { softDelete: false }
        }
      }
    });
    res.json(user);
    res.send();
  }
)


/** Contact Info  */
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
      include: {
        contactInfo: {
          where: { id: req.params.contactInfo },
        },
      },
    });
    res.json(user);
    next();
  },
);
/** /contactInfo */



router.get(
  '/:user/leases',
  ensureLoggedIn(),
  async (req, res, next) => {
    const customer = await prisma.user.findUnique({
      where: { email: req.params.user },
      include: { customerLeases: true },
    });
    res.json(customer);
    next();
  },
);

/** Admin apis */

router.get(
  '/currentcustomers',
  async (req, res, next) => {
    const customers = await prisma.lease.findMany({
      // where: {
      //   leaseEnded: { equals: null },
      // },
      select: {
        unitNum: true,
        price: true,
        leaseEffectiveDate: true,
        customer: {
          include: {
            contactInfo: true,
          },
        },
      },
      orderBy: { unitNum: 'asc' },
    });
    await res.json(customers);
  },
);

router.put(
  '/users/stripeid',
  ensureLoggedIn(),
  async (req, res, next) => {
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
    res.json(dbUser);
    next();
  },
);

module.exports = router;
