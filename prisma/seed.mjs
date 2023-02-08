import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
import { unitData, pricingData } from "./unitsData.mjs";
import bcrypt from "bcrypt";
import lodash from "lodash";
const lo = lodash
const prisma = new PrismaClient

let earliestStarting ='2022-01-01'

async function deleteAll(){
    console.log('> Deleting previous records')
    let startTime = lo.now()
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
    let endTime = lo.now()
    console.log(`> Everything deleted in ${(endTime-startTime)/1000} sec`)
}

async function createUnitsWithUsers (){
    let startTime = lo.now()
    console.log('> Creating units and users')
    
    await prisma.pricing.createMany({
        data:pricingData
    })

    for (let i=0; i< unitData.length; i++){
        let unitSize = unitData[i].size
        let sizePrice = pricingData[(lo.findIndex(pricingData,{'size':unitSize.toString()}))].price;
        let startDate = faker.date.between(new Date(earliestStarting),Date())
        
        let givenName = faker.name.firstName();
        let familyName = faker.name.lastName();
        let email = faker.internet.email(givenName,familyName);
        let contactState = faker.address.stateAbbr();

        let dbUnit = await prisma.unit.create({
            data:unitData[i]
        })
        const dbUnitPrice = await prisma.unitPricing.create({
            data:{
                unitNum: dbUnit.num,
                price: sizePrice,
                startDate: startDate,
            }
        })
        const dbUser = await prisma.user.create({
            data:{
                email: email,
                emailVerified: null,
                givenName: givenName,
                familyName: familyName,
                contactInfo:{
                    create:{
                        address1: faker.address.streetAddress(),
                        address2: faker.address.streetAddress(),
                        city: faker.address.cityName(),
                        state: contactState,
                        zip: faker.address.zipCodeByState(contactState),
                        phoneNum1: faker.phone.number("##########")            
                    }
                },
            },
        });
    }
    let numUsers = await prisma.user.count()
    const firstUser = await prisma.user.findFirst({
        select:{
            familyName:true,
            givenName:true
        }
    })
    let endTime = lo.now()
    console.log(`> ${numUsers} users created in ${(endTime-startTime)/1000} sec`)
    console.log(`> First user: ${firstUser.givenName} ${firstUser.familyName}`)
    return numUsers
}

async function createEmployees(){
    console.log('> Creating employees')
    let startTime = lo.now()
    let contactState = faker.address.stateAbbr();
    const me = await prisma.user.create({
        data:{
            email:process.env.MY_EMAIL.toString(),
            emailVerified:new Date(lo.now()),
            givenName:"Eric",
            familyName:"Branson",
            contactInfo:{
                create:{
                    address1: faker.address.streetAddress(),
                    address2: faker.address.streetAddress(),
                    city: faker.address.cityName(),
                    state: contactState,
                    zip: faker.address.zipCodeByState(contactState),
                    phoneNum1: faker.phone.number("##########")  
                },
            },
            employee:{
                create:{
                    isAdmin:true
                }
            }
        }
    })
    contactState = faker.address.stateAbbr();
    const george = await prisma.user.create({
        data:{
            email:process.env.GEORGE_EMAIL.toString(),
            emailVerified:new Date(lo.now()),
            givenName:"George",
            familyName:"Branson",
            contactInfo:{
                create:{
                    address1: faker.address.streetAddress(),
                    address2: faker.address.streetAddress(),
                    city: faker.address.cityName(),
                    state: contactState,
                    zip: faker.address.zipCodeByState(contactState),
                    phoneNum1: faker.phone.number("##########")  
                },
            },
            employee:{
                create:{
                    isAdmin:true
                }
            }
        }
    })
    contactState = faker.address.stateAbbr();
    const fakeEmployee = await prisma.user.create({
        data:{
            email: process.env.EMPLOYEE_EMAIL.toString(),
            emailVerified: null,
            givenName:"Walter",
            familyName:"Schlegel",
            contactInfo:{
                create:{
                    address1: faker.address.streetAddress(),
                    address2: faker.address.streetAddress(),
                    city: faker.address.cityName(),
                    state: contactState,
                    zip: faker.address.zipCodeByState(contactState),
                    phoneNum1: faker.phone.number("##########")  
                },
            },
            employee:{
                create:{
                    isAdmin:false
                }
            }
        }
    })
    const numEmployees = await prisma.employee.count();
    let endTime = lo.now()
    console.log(`> ${numEmployees} emmployees created in ${(endTime-startTime)/1000} sec`)
    return numEmployees
}

async function createLeases(){
    console.log('> Creating Leases')
    let startTime = lo.now()
    const units = await prisma.unit.findMany({})
    const employees = await prisma.employee.findMany({})
    let employeeList=[]
    employees.forEach(employee => {
        employeeList.push(employee.userId.toString())
    });
    let customers = await prisma.user.findMany({
        where:{
            id:{
                notIn:employeeList
            }
        },
        include:{
            contactInfo:{
                select:{
                    id:true,
                },
            },
        }
    })
    console.log(`> sizeOf customers ${lo.size(customers)}`)
    let pricing = await prisma.unitPricing.findMany({})
    for(let i=0; i<lo.size(units); i++){
        let unit = units[i]
        let customer = customers[i]
        let employee = employees[lo.random(0,2,false)]
        let unitPrice = lo.find(pricing,{unitNum:unit.num})
        const lease = await prisma.lease.create({
            data:{
                customerId:customer.id,
                employeeId: employee.userId,
                unitNum: unitPrice.unitNum,
                price:unitPrice.price,
                leaseEffectiveDate: unitPrice.startDate,
                contactInfoId: customer.contactInfo[0].id,
                unitNum:unitPrice.unitNum,
                price:unitPrice.price
            }
        })
    }
    let numLeases = await prisma.lease.count();
    let endTime = lo.now()
    console.log(`> ${numLeases} leases created in ${(endTime-startTime)/1000} sec`)
    return numLeases
}

function monthDif (date){
    const currentDate = new Date(lo.now())
    const dateFrom = new Date(date)
    return  currentDate.getMonth() - dateFrom.getMonth()+
    (12* (currentDate.getFullYear()-dateFrom.getFullYear()))

}

async function createInvoices(){
    console.log(`> Creating invoices`)
    let startTime = lo.now()
    const leases = await prisma.lease.findMany()
    for(let i=0; i<lo.size(leases); i++){
        const startDate = leases[i].leaseEffectiveDate
        if(startDate.getDate()>27){startDate.setDate(27)} // gets rid of Feb problems
        const numMonths = monthDif(startDate)
        let invoiceDate = new Date()
        if(startDate.getMonth()==11){
            invoiceDate = new Date(startDate.getFullYear()+1,"00",startDate.getDate())
        }else{
            invoiceDate = new Date(startDate.setMonth(startDate.getMonth()+1))
        }
        for(let y=0; y<numMonths; y++){
            await prisma.invoice.create({
                data:{
                    customerId: leases[i].customerId,
                    leaseId:leases[i].id,
                    amount: leases[i].price,
                    invoiceCreated:invoiceDate,
                    unitNum:leases[i].unitNum,
                    price:leases[i].price
                }
            })
            if(invoiceDate.getMonth()==11){
                invoiceDate = new Date((invoiceDate.getFullYear()+1).toString(),"00",invoiceDate.getDate().toString())
            }else{
                invoiceDate = new Date(invoiceDate.setMonth(invoiceDate.getMonth()+1))
            }

        }
   }
   let numInvoice = await prisma.invoice.count();
   let endTime = lo.now()
   console.log(`> ${numInvoice} invoices created in ${(endTime-startTime)/1000} sec`)
   return numInvoice
}

async function createPayments(){
    console.log("> Creating Payments")
    let startTime = lo.now()
    const invoices = await prisma.invoice.findMany()
    const paymentType = ["STRIPE", "CASH", "CHECK"]
    const employees = await prisma.employee.findMany()

    for(let i=0; i<lo.size(invoices); i++){
        let invoiceDate = invoices[i].invoiceCreated
        let paymentDate = new Date()
        let paymentSelector = paymentType[lo.random(0,lo.size(paymentType)-1,false)]
        let employeeSelector = employees[lo.random(0,lo.size(employees)-1,false)]
        if(invoiceDate.getMonth()==11){
            paymentDate = new Date(paymentDate.getFullYear()+1,"00",paymentDate.getDate())
        }else{
            paymentDate = new Date(paymentDate.setMonth(paymentDate.getMonth()+1))
        }
        await prisma.paymentRecord.create({
            data:{
                amount:invoices[i].amount,
                type:paymentSelector,
                paymentCompleted: paymentDate,
                recordNum:faker.datatype.uuid(),
                reciever:{ connect:{userId:employeeSelector.userId} },
                customer:{ connect:{id:invoices[i].customerId} },
            }
        })
    }
    const numPayments = await prisma.paymentRecord.count();
    let endTime = lo.now()
    console.log(`> ${numPayments} payments created in ${(endTime-startTime)/1000} sec`)
    return numPayments
}

async function main(){
    console.log("> Seeding db .....")
    let startTime = lo.now()
    await deleteAll();
    // let numRecords = await createUnitsWithUsers();
    // numRecords += await createEmployees(); 
    // numRecords += await createLeases();
    // numRecords += await createInvoices();
    // numRecords += await createPayments();
    let endTime = lo.now()
    console.log(`> ${numRecords} records created in ${(endTime-startTime)/1000} sec`)
}

main().catch(err =>{
    console.error(err);
    process.exit(1);
}).finally(async () =>{
    await prisma.$disconnect();
})