
import { PrismaClient } from '@prisma/client';
import { predictRisk } from '../ml/predictor';

const prisma = new PrismaClient();

async function main() {
    console.log('Fetching cases...');
    const cases = await prisma.case.findMany({
        take: 2000 // Limit increased
    });

    console.log(`Found ${cases.length} cases. Applying ML model classification...`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const c of cases) {
        if (!c.alert_payload) {
            skippedCount++;
            continue;
        }

        // Call ML model
        const prediction = await predictRisk(c.alert_payload);

        if (prediction) {
            await prisma.case.update({
                where: { id: c.id },
                data: {
                    risk_score: prediction.risk_score,
                    risk_level: prediction.risk_level,
                    confidence_score: prediction.confidence
                }
            });
            updatedCount++;
            process.stdout.write(`\rUpdated: ${updatedCount} | Skipped: ${skippedCount}`);
        } else {
            skippedCount++;
        }
    }

    console.log(`\n\nDone! Successfully re-classified ${updatedCount} cases using the ML model.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
