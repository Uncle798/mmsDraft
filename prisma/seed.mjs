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

function randomDate(startDate, endDate) {
  const returnDate = new Date(new Date(startDate).getTime() + Math.random()
    * (new Date(endDate).getTime() - new Date(startDate).getTime()));
  if (returnDate.getDate() > 27) { returnDate.setDate(27); } // gets rid of Feb problems
  return returnDate;
}

function subtractMonths(date, numMonths) {
  let returnDate = new Date();
  let i = 0;
  while (i < numMonths) {
    if (new Date(date).getMonth() === 0) {
      returnDate = new Date(new Date(date).getFullYear() - 1, '11', new Date(date).getDate());
    } else {
      returnDate = new Date(new Date(date).setMonth(new Date(date).getMonth() - 1));
    }
    i += 1;
  }
  return returnDate;
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

async function createLease(customer, employee, contactInfo, unit, leaseEffectiveDate, leaseEnded) {
  const lease = await prisma.lease.create({
    data: {
      customerId: customer.id,
      employeeId: employee.userId,
      contactInfoId: contactInfo[0].id,
      unitNum: unit.unitNum,
      price: unit.price,
      leaseEffectiveDate: new Date(leaseEffectiveDate),
      leaseEnded,
    },
  });
  return lease;
}

async function createLeases() {
  const leases = [];
  const units = await prisma.unitPricing.findMany();
  const employees = await prisma.employee.findMany();
  const employeeList = [];
  employees.forEach((employee) => {
    employeeList.push(employee.userId.toString());
  });
  const numUsers = await prisma.user.count({ where: { id: { notIn: employeeList } } });
  const customers = await prisma.user.findMany({
    where: {
      id: {
        notIn: employeeList,
      },
    },
    take: Math.floor(numUsers * 0.97),
    include: {
      contactInfo: {
        select: {
          id: true,
        },
      },
    },
  });
  units.forEach(async (unit) => {
    let totalNumMonths = monthDif(earliestStarting, Date.now());
    let leaseStart = new Date(earliestStarting);
    let numLeases = Math.floor(Math.random() * 6) + 1; // between 1 & 6 leases per unit
    const customer = customers.pop();
    const { contactInfo } = customer;
    while (numLeases > 0) {
      let lengthOfLease = 0;
      if (numLeases === 1) {
        lengthOfLease = totalNumMonths;
      } else {
        lengthOfLease = Math.floor(Math.random() * (totalNumMonths / numLeases) - 2 + 1) + 2;
      }
      let leaseEndDate = null;
      if (monthDif(leaseStart, Date.now()) >= 6) {
        leaseEndDate = new Date(addMonths(leaseStart, lengthOfLease));
      } else {
        leaseEndDate = null;
        numLeases = 0;
      }
      const employee = employees[Math.floor(Math.random() * employees.length)];
      leases.push(createLease(customer, employee, contactInfo, unit, leaseStart, leaseEndDate));
      totalNumMonths -= lengthOfLease;
      // random number of months unit sits empty
      leaseStart = new Date(addMonths(leaseStart, (lengthOfLease + Math.floor(Math.random * 4))));
      numLeases -= 1;
    }
  });
  return leases;
}

async function createInvoices() {
  const leases = await prisma.lease.findMany();
  leases.forEach(async (lease) => {
    const startDate = lease.leaseEffectiveDate;
    const leaseEndDate = lease.leaseEnded ?? Date.now();
    const invoiceDate = addMonths(startDate, 1);
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

async function updateLeases() {
  const leases = await prisma.lease.updateMany({
    where: {
      leaseEnded: {
        gte: new Date(Date.now()),
      },
    },
    data: {
      leaseEnded: null,
    },
  });
}

let startTime = Date();
async function createInfrustructure() {
  console.log('> Seeding db .....');
  startTime = Date.now();
  let deleteTime = Date();
  await deleteAll().then(() => {
    deleteTime = Date.now();
    console.log(`> Everything deleted in ${deleteTime - startTime} ms`);
  }).catch((err) => { console.log(`>>>>> seed.mjs Error: ${err}`); });
  let unitTime = Date();
  await createUnits();
  await priceUnit().then(() => {
    unitTime = Date.now();
    console.log(`> Units created in ${unitTime - deleteTime} ms`);
  });
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

async function createFinacials() {
  console.log('finacials');
  await createLeases();
  await updateLeases();
  await createInvoices();

  const employees = await prisma.employee.findMany();
  const invoices = await prisma.invoice.findMany();

  invoices.forEach(async (invoice) => {
    await createPayments(invoice, employees[Math.floor(Math.random() * employees.length)]);
  });
}

await createInfrustructure();
await createPeople().then(async () => {
  await createFinacials();
}).then(await updateLeases())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
