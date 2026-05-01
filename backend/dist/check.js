"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
    const custs = await prisma.customer.findMany();
    console.log("All customers:", custs);
}
run();
//# sourceMappingURL=check.js.map