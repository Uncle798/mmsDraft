const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'info', 'warn'],
});

module.exports = prisma;
