const express = require('express');

const router = express.Router();
const prisma = require('../lib/db');
const { objHelpers } = require('../lib/objectHelpers');

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

router.get(
  '/emptyunits',
  async (req, res) => {
    const units = await prisma.unitPricing.findMany({
      where: {
        endDate: {
          lte: Date.now(),
        },
        leases: {
          isNot: {
            leaseEnded: {
              lte: Date.now(),
            },
          },
        },
      },
    });
    res.json(units);
  },
);

router.post(
  '/pricing',
  async (req, res) => {
    const dbPricing = await prisma.pricing.create({
      data: {
        unitNum: res.body.unitNum,
        price: res.body.price,
        endDate: res.body.endDate,
        stripeProductId: res.body.stripeProductId,
      },
    });
    res.json(dbPricing);
  },
);

router.get(
  '/pricing',
  async (req, res) => {
    const pricing = await prisma.pricing.findMany({
      where: {
        endDate: null,
      },
    });
    res.json(pricing);
  },
);

router.put(
  '/pricing',
  async (req, res) => {
    const pricing = await prisma.pricing.update({
      where: {
        id: res.body.id,
      },
      data: {
        unitNum: res.body.unitNum,
        price: res.body.price,
        endDate: res.body.endDate,
        stripeProductId: res.body.stripeProductId,
      },
    });
    res.json(pricing);
  },
);

router.post(
  '/priceunit',
  async (req, res) => {
    const pricing = await prisma.unitPricing.create({
      data: {
        unitNum: res.body.unitNum,
        price: res.body.price,
        startDate: new Date(Date.now()),
      },
    });
    res.json(pricing);
  },
);

module.exports = router;
