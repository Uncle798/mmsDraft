import  {PrismaClient} from "@prisma/client";
import lodash from "lodash";
const lo = lodash

const prisma = new PrismaClient

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

deleteAll().catch(err =>{
    console.error(err);
    process.exit(1);
}).finally(async () =>{
    await prisma.$disconnect();
})