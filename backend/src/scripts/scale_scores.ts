
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Scaling risk scores (x10) for existing cases...');

    // 1. Fetch all cases with score <= 10 (likely unscaled)
    const cases = await prisma.case.findMany({
        where: {
            risk_score: { lte: 10 }
        }
    });

    console.log(`Found ${cases.length} cases to update.`);

    let updated = 0;
    for (const c of cases) {
        await prisma.case.update({
            where: { id: c.id },
            data: {
                risk_score: c.risk_score * 10
            }
        });
        updated++;
        if (updated % 50 === 0) process.stdout.write(`Updated ${updated}...\r`);
    }

    console.log(`\nSuccessfully updated ${updated} cases.`);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
