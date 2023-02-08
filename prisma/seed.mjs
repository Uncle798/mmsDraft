import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { unitData, pricingData } from './unitsData.mjs';

const prisma = new PrismaClient();

const earliestStarting = '2022-01-01'; // for leases invoices and payments

async function deleteAll() {
  console.log('> Deleting previous records');
  const startTime = Date.now();
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
  const endTime = Date.now();
  console.log(`> Everything deleted in ${(endTime - startTime) / 1000} sec`);
}

async function createUnitsWithUsers() {
  const startTime = Date.now();
  console.log('> Creating units and users');

  await prisma.pricing.createMany({
    data: pricingData,
  });

  for (let i = 0; i < unitData.length; i++) {
    const sizePrice = pricingData.find(({size})=>{
        return size === unitData[i].size
    })
    const startDate = faker.date.between(new Date(earliestStarting), Date());
    const givenName = faker.name.firstName();
    const familyName = faker.name.lastName();
    const email = faker.internet.email(givenName, familyName);
    const contactState = faker.address.stateAbbr();

    const dbUnit = await prisma.unit.create({
      data: unitData[i],
    });
    const dbUnitPrice = await prisma.unitPricing.create({
      data: {
        unitNum: dbUnit.num,
        price: sizePrice.price,
        startDate,
      },
    });
    const dbUser = await prisma.user.create({
      data: {
        email,
        emailVerified: null,
        givenName,
        familyName,
        contactInfo: {
          create: {
            address1: faker.address.streetAddress(),
            address2: faker.address.streetAddress(),
            city: faker.address.cityName(),
            state: contactState,
            zip: faker.address.zipCodeByState(contactState),
            phoneNum1: faker.phone.number('##########'),
          },
        },
      },
    });
  }
  const numUsers = await prisma.user.count();
  const firstUser = await prisma.user.findFirst({
    select: {
      familyName: true,
      givenName: true,
    },
  });
  const endTime = Date.now();
  console.log(`> ${numUsers} users created in ${(endTime - startTime) / 1000} sec`);
  console.log(`> First user: ${firstUser.givenName} ${firstUser.familyName}`);
  return numUsers;
}

async function createEmployees() {
  console.log('> Creating employees');
  const startTime = Date.now;
  let contactState = faker.address.stateAbbr();
  const me = await prisma.user.create({
    data: {
      email: process.env.MY_EMAIL.toString(),
      emailVerified: new Date(Date.now()),
      givenName: 'Eric',
      familyName: 'Branson',
      contactInfo: {
        create: {
          address1: faker.address.streetAddress(),
          address2: faker.address.streetAddress(),
          city: faker.address.cityName(),
          state: contactState,
          zip: faker.address.zipCodeByState(contactState),
          phoneNum1: faker.phone.number('##########'),
        },
      },
      employee: {
        create: {
          isAdmin: true,
        },
      },
    },
  });
  contactState = faker.address.stateAbbr();
  const george = await prisma.user.create({
    data: {
      email: process.env.GEORGE_EMAIL.toString(),
      emailVerified: new Date(Date.now()),
      givenName: 'George',
      familyName: 'Branson',
      contactInfo: {
        create: {
          address1: faker.address.streetAddress(),
          address2: faker.address.streetAddress(),
          city: faker.address.cityName(),
          state: contactState,
          zip: faker.address.zipCodeByState(contactState),
          phoneNum1: faker.phone.number('##########'),
        },
      },
      employee: {
        create: {
          isAdmin: true,
        },
      },
    },
  });
  contactState = faker.address.stateAbbr();
  const fakeEmployee = await prisma.user.create({
    data: {
      email: process.env.EMPLOYEE_EMAIL.toString(),
      emailVerified: null,
      givenName: 'Walter',
      familyName: 'Schlegel',
      contactInfo: {
        create: {
          address1: faker.address.streetAddress(),
          address2: faker.address.streetAddress(),
          city: faker.address.cityName(),
          state: contactState,
          zip: faker.address.zipCodeByState(contactState),
          phoneNum1: faker.phone.number('##########'),
        },
      },
      employee: {
        create: {
          isAdmin: false,
        },
      },
    },
  });
  const numEmployees = await prisma.employee.count();
  const endTime = Date.now();
  console.log(`> ${numEmployees} emmployees created in ${(endTime - startTime) / 1000} sec`);
  return numEmployees;
}

async function createLeases() {
  console.log('> Creating Leases');
  const startTime = Date.now();
  const units = await prisma.unit.findMany({});
  const employees = await prisma.employee.findMany({});
  const employeeList = [];
  employees.forEach((employee) => {
    employeeList.push(employee.userId.toString());
  });
  const customers = await prisma.user.findMany({
    where: {
      id: {
        notIn: employeeList,
      },
    },
    include: {
      contactInfo: {
        select: {
          id: true,
        },
      },
    },
  });
  const pricing = await prisma.unitPricing.findMany({});
  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    const customer = customers[i];
    const employee = employees[Math.floor(Math.random()*employees.length)];
    const unitPrice = pricing.find(({unitNum}) =>{
        return unitNum === unit.num
    })
    const lease = await prisma.lease.create({
      data: {
        customerId: customer.id,
        employeeId: employee.userId,
        unitNum: unitPrice.unitNum,
        price: unitPrice.price,
        leaseEffectiveDate: unitPrice.startDate,
        contactInfoId: customer.contactInfo[0].id,
        unitNum: unitPrice.unitNum,
        price: unitPrice.price,
      },
    });
  }
  const numLeases = await prisma.lease.count();
  const endTime = Date.now();
  console.log(`> ${numLeases} leases created in ${(endTime - startTime) / 1000} sec`);
  return numLeases;
}

function monthDif(date) {
  const currentDate = new Date(Date.now());
  const dateFrom = new Date(date);
  return currentDate.getMonth() - dateFrom.getMonth()
    + (12 * (currentDate.getFullYear() - dateFrom.getFullYear()));
}

async function createInvoices() {
  console.log('> Creating invoices');
  const startTime = Date.now();
  const leases = await prisma.lease.findMany();
  for (let i = 0; i < leases.length; i++) {
    const startDate = leases[i].leaseEffectiveDate;
    if (startDate.getDate() > 27) { startDate.setDate(27); } // gets rid of Feb problems
    const numMonths = monthDif(startDate);
    let invoiceDate = new Date();
    if (startDate.getMonth() == 11) {
      invoiceDate = new Date(startDate.getFullYear() + 1, '00', startDate.getDate());
    } else {
      invoiceDate = new Date(startDate.setMonth(startDate.getMonth() + 1));
    }
    for (let y = 0; y < numMonths; y++) {
      await prisma.invoice.create({
        data: {
          customerId: leases[i].customerId,
          leaseId: leases[i].id,
          amount: leases[i].price,
          invoiceCreated: invoiceDate,
          unitNum: leases[i].unitNum,
          price: leases[i].price,
        },
      });
      if (invoiceDate.getMonth() == 11) {
        invoiceDate = new Date((invoiceDate.getFullYear() + 1).toString(), '00', invoiceDate.getDate().toString());
      } else {
        invoiceDate = new Date(invoiceDate.setMonth(invoiceDate.getMonth() + 1));
      }
    }
  }
  const numInvoice = await prisma.invoice.count();
  const endTime = Date.now();
  console.log(`> ${numInvoice} invoices created in ${(endTime - startTime) / 1000} sec`);
  return numInvoice;
}

async function createPayments() {
  console.log('> Creating Payments');
  const startTime = Date.now();
  const invoices = await prisma.invoice.findMany();
  const paymentType = ['STRIPE', 'CASH', 'CHECK'];
  const employees = await prisma.employee.findMany();

  for (let i = 0; i < invoices.length; i++) {
    const invoiceDate = invoices[i].invoiceCreated;
    let paymentDate = new Date();
    const paymentSelector = paymentType[Math.floor(Math.random()*paymentType.length)];
    const employeeSelector = employees[Math.floor(Math.random()*employees.length)];
    if (invoiceDate.getMonth() == 11) {
      paymentDate = new Date(paymentDate.getFullYear() + 1, '00', paymentDate.getDate());
    } else {
      paymentDate = new Date(paymentDate.setMonth(paymentDate.getMonth() + 1));
    }
    await prisma.paymentRecord.create({
      data: {
        amount: invoices[i].amount,
        type: paymentSelector,
        paymentCompleted: paymentDate,
        recordNum: faker.datatype.uuid(),
        reciever: { connect: { userId: employeeSelector.userId } },
        customer: { connect: { id: invoices[i].customerId } },
      },
    });
  }
  const numPayments = await prisma.paymentRecord.count();
  const endTime = Date.now();
  console.log(`> ${numPayments} payments created in ${(endTime - startTime) / 1000} sec`);
  return numPayments;
}

async function main() {
  console.log('> Seeding db .....');
  const startTime = Date.now();
  await deleteAll();
  let numRecords = await createUnitsWithUsers();
  numRecords += await createEmployees();
  numRecords += await createLeases();
  numRecords += await createInvoices();
  numRecords += await createPayments();
  const endTime = Date.now();
  console.log(`> ${numRecords} records created in ${(endTime - startTime) / 1000} sec`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
