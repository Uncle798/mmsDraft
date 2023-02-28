const express = require('express');

const router = express.Router();
const {prisma} = require('../lib/db');
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

module.exports = router;
