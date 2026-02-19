import { prisma } from '../core/prisma';

async function main() {
    console.log('Clearing audit logs...');
    const { count } = await prisma.auditLog.deleteMany({});
    console.log(`Cleared ${count} audit logs.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
