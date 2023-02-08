import { PrismaClient } from "@prisma/client";
import lodash from "lodash"
const lo=lodash
const prisma = new PrismaClient

export async function findCustomers(){
    const today = new Date(lo.now())
    const employees = await prisma.employee.findMany({
        select:{
            userId:true,
        },
    });
    const employeeList =[]
    employees.forEach(employee =>{
        employeeList.push(employee.userId.toString())
    })
    const currentLeases = await prisma.lease.findMany({
        where:{
            leaseEnded:null,
        },
        include:{
            invoices:{
                where:{
                    invoiceCreated:{
                        gte: new Date(today.setFullYear(today.getFullYear()-1,today.getMonth(),today.getDate()))
                    }
                }
            }
        }
    })
    console.log(currentLeases[0])
    const currentLeasesList =[]
    currentLeases.forEach(lease =>{
        currentLeasesList.push(lease.customerId.toString())
    })
    let customers = await prisma.user.findMany({
        where:{
            AND:[
                {id:{notIn:employeeList}},
                {id:{in: currentLeasesList}}
            ]
        },
        select:{
            email:true,
            givenName:true,
            familyName:true,
            customerLeases:true,
            customerInvoices:{
                where:{
                    invoiceCreated:{
                        gte: new Date(today.setFullYear(today.getFullYear()-1,today.getMonth(),today.getDate()))
                    }
                },
            },
            paymentMade:{
                where:{
                    paymentCreated:{
                        gte: new Date(today.setFullYear(today.getFullYear()-1,today.getMonth(),today.getDate()))
                    }
                }
            },
        },
    })
    console.log(customers)
    return customers
}

async function upsertTest(){
    const user = await prisma.user.upsert({
        where:{
            email:'eric.branson@gmail.com'
        },
        update:{
            email:'eric.branson@gmail.com'
        },
        create:{
            email: 'eric.branson@gmail.com'
        },
        select:{
            id:true,
            email:true,
            givenName:true,
            familyName:true,
            employee:{
                select:{
                    userId:true,
                    isAdmin:true,
                }
            }
        }
    })
    console.log(user)
    return user
}

upsertTest().catch(err =>{
    console.error(err);
    process.exit(1);
}).finally(async () =>{
    await prisma.$disconnect();
})