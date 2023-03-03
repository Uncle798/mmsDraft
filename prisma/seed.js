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
const numExtraUsers = 300; // users above number of units
const maxLeases = 8;

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
  return true;
}

async function createUnits() {
  const pricing = await prisma.pricing.createMany({
    data: pricingData,
  });
  const units = await prisma.unit.createMany({
    data: unitData,
  });
  return units;
}

async function priceUnit() {
  const units = await prisma.unit.findMany();
  const pricing = await prisma.pricing.findMany();
  const unitPricing = [];
  units.forEach(async (unit) => {
    const price = pricing.find((p) => p.size === unit.size);
    unitPricing.push(await prisma.unitPricing.create({
      data: {
        unitNum: unit.num,
        price: price.price,
        startDate: new Date(earliestStarting),
      },
    }));
  });
  return unitPricing;
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
  const employees = [];
  employees.push(await prisma.user.create({
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
  }));
  contactState = faker.faker.address.stateAbbr();
  employees.push(await prisma.user.create({
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
  }));
  contactState = faker.faker.address.stateAbbr();
  employees.push(await prisma.user.create({
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
  }));
  return employees;
}

async function createLease(unit, leaseStart, leaseEnd) {
  const employees = await prisma.employee.findMany({
    select: { userId: true },
  });
  const employeelist = [];
  employees.forEach((employee) => { employeelist.push(employee.userId); });
  const employee = employees[Math.floor(Math.random() * employees.length)];
  const customer = await prisma.user.findFirst({
    where: {
      AND: [
        { id: { notIn: employeelist } },
        { customerLeases: { none: {} } },
      ],
    },
    select: {
      id: true,
      contactInfo: true,
    },
  });
  let leaseEnded = null;
  if (leaseEnd) { leaseEnded = new Date(leaseEnd); }
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
  const invoices = [];
  months.forEach(async (month) => {
    invoices.push(await prisma.invoice.create({
      data: {
        customerId: lease.customerId,
        leaseId: lease.id,
        amount: lease.price,
        invoiceCreated: month,
        unitNum: lease.unitNum,
        price: lease.price,
      },
    }));
  });
  return invoices;
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

let startTime = Date.now();
async function main() {
  startTime = Date.now();
  const del = await deleteAll();
  let deleteTime = Date.now();
  if (del) {
    deleteTime = Date.now();
    console.log(`>> Everything deleted in ${deleteTime - startTime} ms`);
  }
  let units = await createUnits();
  const pricedUnit = await priceUnit();
  const unitsTime = Date.now();
  console.log(`>> ${pricedUnit.length} units created in ${unitsTime - deleteTime} ms`);
  let numUsers = unitData.length + numExtraUsers;
  while (numUsers > 0) {
    createUser();
    numUsers -= 1;
  }
  const employees = await createEmployees();
  const peopleTime = Date.now();
  console.log(`>> ${unitData.length + numExtraUsers + employees.length} users in ${peopleTime - unitsTime} ms`);
  const leases = [];
  units = await prisma.unitPricing.findMany();
  units.forEach(async (unit) => {
    const unitLeases = Array.from({ length: Math.floor(Math.random() * maxLeases) + 1 });
    let leaseStart = new Date(earliestStarting);
    let numMonthsLeft = monthDif(leaseStart, Date.now());
    unitLeases.forEach(async (lease) => {
      const lengthOfLease = Math.floor(Math.random() * numMonthsLeft) + 1;
      let leaseEnd = new Date(addMonths(leaseStart, lengthOfLease));
      if (leaseEnd > Date.now() || monthDif(leaseEnd, Date.now()) < 3) { leaseEnd = null; }
      leases.push(await createLease(unit, leaseStart, leaseEnd));
      leaseStart = addMonths(leaseEnd, 1);
      numMonthsLeft = monthDif(leaseStart, Date.now());
    });
  });
  const leaseTime = Date.now();
  console.log(`>> ${leases.length} leases in ${leaseTime - peopleTime} ms`);
  const invoices = [];
  leases.forEach(async (lease) => {
    invoices.push(await createInvoices(lease));
  });
  const invoiceTime = Date.now();
  console.log(`>> ${invoices.length} leases in ${invoiceTime - leaseTime} ms`);
  const payments = [];
  invoices.forEach(async (invoice) => {
    payments.push(
      await createPayments(invoice, employees[Math.floor(Math.random() * employees.length)]),
    );
  });
  const paymentTime = Date.now();
  console.log(`>> ${payments.length} leases in ${paymentTime - invoiceTime} ms`);
}

main().catch((err) => { console.log(`>>>>> err: ${err}`); }).then(() => {
  const endTime = Date.now();
  console.log(`>> Everything completed in ${(endTime - startTime) / 1000} seconds`);
});
