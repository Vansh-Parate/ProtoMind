
import { spawn } from 'child_process';
import path from 'path';

export interface MLPrediction {
    risk_score: number;
    risk_level: 'HIGH' | 'MEDIUM' | 'LOW';
    confidence: number;
}

export function predictRisk(payload: any): Promise<MLPrediction | null> {
    return new Promise((resolve) => {
        // Model wrapper script
        const pythonScript = path.join(__dirname, 'predict_cli.py');
        const process = spawn('python', [pythonScript, JSON.stringify(payload)]);

        let result = '';
        let error = '';

        process.stdout.on('data', (data) => {
            result += data.toString();
        });

        process.stderr.on('data', (data) => {
            error += data.toString();
        });

        process.on('close', (code) => {
            if (code !== 0) {
                console.error('ML Prediction Error:', error.trim());
                resolve(null);
                return;
            }
            try {
                const prediction = JSON.parse(result);
                if (prediction.error) {
                    console.error('ML Model Error:', prediction.error);
                    resolve(null);
                    return;
                }
                resolve({
                    risk_score: prediction.risk_score,
                    risk_level: prediction.risk_level,
                    confidence: prediction.confidence
                });
            } catch (e) {
                console.error('Failed to parse ML output:', result);
                resolve(null);
            }
        });
    });
}
