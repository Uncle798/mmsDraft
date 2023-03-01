/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
/* eslint-disable no-plusplus */
import { PrismaClient } from '@prisma/client';
// eslint-disable-next-line import/no-extraneous-dependencies
import * as faker from '@faker-js/faker';
import lodash from 'lodash';
// eslint-disable-next-line import/extensions
import { unitData, pricingData } from './unitsData.mjs';

const lo = lodash;

const prisma = new PrismaClient();

const earliestStarting = '2018-01-01'; // for leases invoices and payments
const numExtraUsers = 300; // users with past leases or no leases
const invoicePerReq = 50; // rate limit calls to db

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
  const email = `eric.branson+${familyName}${givenName}@gmail.com`;
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
          phoneNum1: faker.faker.phone.number('##########'),
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

function monthDif(dateFrom, dateTo) {
  const DT = new Date(dateTo);
  const DF = new Date(dateFrom);
  return DT.getMonth() - DF.getMonth()
    + (12 * (DT.getFullYear() - DF.getFullYear()));
}

function addMonths(date, numMonths) {
  let returnDate = new Date(date);
  let i = 0;
  while (i < numMonths) {
    if (returnDate.getMonth() !== 11) {
      returnDate = new Date(returnDate.setMonth(returnDate.getMonth() + 1));
    } else {
      returnDate = new Date(returnDate.getFullYear() + 1, '00', returnDate.getDate());
    }
    i += 1;
  }
  return returnDate;
}

function arrayMonths(startDate, endDate) {
  let numMonths = monthDif(startDate, endDate);
  const arrayOfMonths = [];
  while (numMonths > 0) {
    arrayOfMonths.push(
      addMonths(startDate, 1),
    );
    numMonths -= 1;
  }
  return arrayOfMonths;
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
  console.log(`> Creating people ${numUsers}`);
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
  units.forEach(async (unit) => {
    const totalNumMonths = monthDif(earliestStarting, Date.now());
    let leaseStart = new Date(earliestStarting);
    const numLeases = Math.floor(Math.random() * 8) + 1; // between 1 & 8 leases per unit
    let i = 1;
    while (i <= numLeases) {
      const lengthOfLease = Math.floor(
        Math.random() * Math.floor((totalNumMonths / numLeases)),
      ) + 1;
      let leaseEnd = new Date(addMonths(leaseStart, lengthOfLease));
      if (
        leaseEnd > Date.now()
      || monthDif(leaseEnd, Date.now()) < 3
      || i === numLeases) { leaseEnd = null; }

      createLeases(unit, leaseStart, leaseEnd);
      i += 1;
      leaseStart = addMonths(leaseEnd, Math.floor(Math.random * 4) + 1);
      if (leaseEnd >= Date.now() || leaseStart >= Date.now()) { break; }
    }
  });
}

async function financials() {
  const numLeases = await prisma.lease.count();
  if (numLeases === 0) { setTimeout(financials); }
  const leases = await prisma.lease.findMany();
  console.log(`numLeases: ${numLeases}`);
  leases.forEach(async (lease) => {
    await createInvoices(lease);
  });
  const employees = await prisma.employee.findMany();
  const invoices = await prisma.invoice.findMany();
  invoices.forEach(async (invoice) => {
    await createPayments(invoice, employees[Math.floor(Math.random() * employees.length)]);
  });
}

await main();
await financials()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
