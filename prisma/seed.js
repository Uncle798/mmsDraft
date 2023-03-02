/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
/* eslint-disable no-plusplus */

// eslint-disable-next-line import/no-extraneous-dependencies
const faker = require('@faker-js/faker');
const prisma = require('../lib/db');
const { addMonths, arrayMonths, monthDif } = require('../lib/dateHelpers');
const { unitData, pricingData } = require('./unitsData');

// actual vars:
const earliestStarting = '2018-01-01'; // for leases invoices and payments
const numExtraUsers = 300; // users with past leases or no leases

async function deleteAll() {
  await prisma.paymentRecord.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.lease.deleteMany();
  await prisma.paymentRecord.deleteMany();
  await prisma.unitPricing.deleteMany();
  await prisma.pricing.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.contactInfo.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();
}

async function createUnits() {
  const pricing = await prisma.pricing.createMany({
    data: pricingData,
  });
  const units = await prisma.unit.createMany({
    data: unitData,
  });
}

async function priceUnit() {
  const units = await prisma.unit.findMany();
  const pricing = await prisma.pricing.findMany();
  units.forEach(async (unit) => {
    const price = pricing.find((p) => p.size === unit.size);
    const priced = await prisma.unitPricing.create({
      data: {
        unitNum: unit.num,
        price: price.price,
        startDate: new Date(earliestStarting),
      },
    });
  });
}

async function createUser() {
  const givenName = faker.faker.name.firstName();
  const familyName = faker.faker.name.lastName();
  const phoneNum1 = faker.faker.phone.number('##########');
  const email = `bransonschlegelmove+${phoneNum1}@gmail.com`;
  const contactState = faker.faker.address.stateAbbr();
  const dbUser = await prisma.user.create({
    data: {
      email,
      emailVerified: null,
      givenName,
      familyName,
      contactInfo: {
        create: {
          address1: faker.faker.address.streetAddress(),
          address2: faker.faker.address.streetAddress(),
          city: faker.faker.address.cityName(),
          state: contactState,
          zip: faker.faker.address.zipCodeByState(contactState),
          phoneNum1,
        },
      },
    },
  });
  return dbUser;
}

async function createEmployees() {
  let contactState = faker.faker.address.stateAbbr();
  const me = await prisma.user.create({
    data: {
      email: String(process.env.MY_EMAIL),
      emailVerified: new Date(Date.now()),
      givenName: 'Eric',
      familyName: 'Branson',
      contactInfo: {
        create: {
          address1: faker.faker.address.streetAddress(),
          address2: faker.faker.address.streetAddress(),
          city: faker.faker.address.cityName(),
          state: contactState,
          zip: faker.faker.address.zipCodeByState(contactState),
          phoneNum1: faker.faker.phone.number('##########'),
        },
      },
      employee: {
        create: {
          isAdmin: true,
        },
      },
    },
  });
  contactState = faker.faker.address.stateAbbr();
  const george = await prisma.user.create({
    data: {
      email: String(process.env.GEORGE_EMAIL),
      emailVerified: new Date(Date.now()),
      givenName: 'George',
      familyName: 'Branson',
      contactInfo: {
        create: {
          address1: faker.faker.address.streetAddress(),
          address2: faker.faker.address.streetAddress(),
          city: faker.faker.address.cityName(),
          state: contactState,
          zip: faker.faker.address.zipCodeByState(contactState),
          phoneNum1: faker.faker.phone.number('##########'),
        },
      },
      employee: {
        create: {
          isAdmin: true,
        },
      },
    },
  });
  contactState = faker.faker.address.stateAbbr();
  const fakeEmployee = await prisma.user.create({
    data: {
      email: String(process.env.EMPLOYEE_EMAIL),
      emailVerified: null,
      givenName: 'Walter',
      familyName: 'Schlegel',
      contactInfo: {
        create: {
          address1: faker.faker.address.streetAddress(),
          address2: faker.faker.address.streetAddress(),
          city: faker.faker.address.cityName(),
          state: contactState,
          zip: faker.faker.address.zipCodeByState(contactState),
          phoneNum1: faker.faker.phone.number('##########'),
        },
      },
      employee: {
        create: {
          isAdmin: false,
        },
      },
    },
  });
  return Promise.all([me, george, fakeEmployee]);
}

async function createLeases(unit, leaseStart, leaseEnd) {
  const employees = await prisma.employee.findMany({
    select: { userId: true },
  });
  const employeelist = [];
  employees.forEach((employee) => { employeelist.push(employee.userId); });
  const employee = employees[Math.floor(Math.random() * employees.length)];
  const customer = await prisma.user.findFirst({
    where: {
      AND: {
        id: { notIn: employeelist },
        customerLeases: { none: {} },
      },
    },
    select: {
      id: true,
      contactInfo: true,
    },
  });
  let leaseEnded = null;
  if (leaseEnd !== null) { leaseEnded = new Date(leaseEnd); }
  const lease = await prisma.lease.create({
    data: {
      customerId: customer.id,
      employeeId: employee.userId,
      contactInfoId: customer.contactInfo[0].id,
      unitNum: unit.unitNum,
      price: unit.price,
      leaseEffectiveDate: new Date(leaseStart),
      leaseEnded,
    },
  });
  return lease;
}

async function createInvoices(lease) {
  const leaseEndDate = lease.leaseEnded ?? Date.now();
  const months = arrayMonths(lease.leaseEffectiveDate, leaseEndDate);
  months.forEach(async (month) => {
    await prisma.invoice.create({
      data: {
        customerId: lease.customerId,
        leaseId: lease.id,
        amount: lease.price,
        invoiceCreated: month,
        unitNum: lease.unitNum,
        price: lease.price,
      },
    });
  });
}

async function createPayments(invoice, employee) {
  const paymentType = ['STRIPE', 'CASH', 'CHECK'];
  const paymentDate = addMonths(invoice.invoiceCreated, 1);
  const record = await prisma.paymentRecord.create({
    data: {
      customerId: invoice.customerId,
      recieverId: employee.userId,
      amount: invoice.price,
      paymentCompleted: paymentDate,
      paymentCreated: paymentDate,
      type: paymentType[Math.floor(Math.random() * paymentType.length)],
      recordNum: faker.faker.datatype.uuid(),
      invoiceNum: invoice.id,
      unitNum: invoice.unitNum,
      unitPrice: invoice.price,
    },
  });
  return record;
}

async function createPeople() {
  let numUsers = unitData.length + numExtraUsers;
  console.log(`> Creating ${numUsers} people`);
  while (numUsers > 0) {
    createUser();
    numUsers -= 1;
  }
  await createEmployees();
}

async function main() {
  await deleteAll();
  await createUnits();
  await priceUnit();
  await createPeople();
  const units = await prisma.unitPricing.findMany();
  // create leases
  units.forEach(async (unit) => {
    let leaseStart = new Date(earliestStarting);
    const numLeases = Math.floor(Math.random() * 6) + 1; // between 1 & 8 leases per unit
    let i = 1;
    let numMonthsLeft = monthDif(earliestStarting, Date.now());

    while (i <= numLeases) {
      const lengthOfLease = Math.floor(Math.random() * numMonthsLeft) + 1;
      console.log(`> Unit Num: ${unit.unitNum} numMonthsLeft: ${numMonthsLeft} lengthOfLease: ${lengthOfLease}`);
      let leaseEnd = new Date(addMonths(leaseStart, lengthOfLease));
      if (
        leaseEnd > Date.now()
        || monthDif(leaseEnd, Date.now()) < 3
        || i === numLeases
      ) {
        leaseEnd = null;
      }
      if ((leaseEnd && leaseEnd < Date.now()) || leaseStart < earliestStarting) {
        break;
      }
      createLeases(unit, leaseStart, leaseEnd);
      i += 1;
      numMonthsLeft = monthDif(leaseEnd, Date.now());
      leaseStart = addMonths(leaseEnd, Math.floor(Math.random * 4) + 1);
      if (leaseEnd >= Date.now() || leaseStart >= Date.now() || leaseStart < earliestStarting) {
        break;
      }
    }
  });
}
async function invoiceMaker() {
  const numLeases = await prisma.lease.count({ where: { invoices: { none: {} } } });
  console.log(`numLeases: ${numLeases}`);
  if (numLeases < 400) { setTimeout(invoiceMaker, 1000); }
  const leases = await prisma.lease.findMany({
    where: { invoices: { none: {} } },
  });
  leases.forEach(async (lease) => {
    await createInvoices(lease);
  });
}

async function payments() {
  const numInvoices = await prisma.invoice.count({ where: { paymentRecord: { isNot: null } } });
  console.log(`numInvoices: ${numInvoices}`);
  if (numInvoices < 800) { setTimeout(payments, 1000); }
  const employees = await prisma.employee.findMany();
  const invoices = await prisma.invoice.findMany();
  invoices.forEach(async (invoice) => {
    await createPayments(invoice, employees[Math.floor(Math.random() * employees.length)]);
  });
}

main()
  .then(invoiceMaker())
  .then(payments())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
