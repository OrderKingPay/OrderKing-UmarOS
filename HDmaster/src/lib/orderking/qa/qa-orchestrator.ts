import * as http from 'http';
import * as https from 'https';
import { performance } from 'perf_hooks';

// @ts-ignore
import { getSql } from '../../db'; // Adjust this import based on your actual db location

export async function runLoadTest(targetUrl: string, durationSeconds: number, concurrency: number): Promise<any> {
    const isHttps = targetUrl.startsWith('https');
    const client = isHttps ? https : http;
    const url = new URL(targetUrl);

    const latencies: number[] = [];
    let activeConnections = 0;
    let completedRequests = 0;
    let errors = 0;

    const endTime = performance.now() + (durationSeconds * 1000);

    return new Promise((resolve) => {
        let finished = false;
        
        const finishTest = async () => {
            if (finished) return;
            finished = true;
            
            latencies.sort((a, b) => a - b);
            
            const getPercentile = (p: number) => {
                if (latencies.length === 0) return 0;
                const index = Math.min(Math.floor((p / 100) * latencies.length), latencies.length - 1);
                return latencies[index];
            };

            const p50 = getPercentile(50);
            const p90 = getPercentile(90);
            const p99 = getPercentile(99);

            const results = {
                totalRequests: completedRequests,
                errors,
                p50,
                p90,
                p99,
                durationSeconds
            };

            try {
                const sql = await getSql();
                await sql`
                    INSERT INTO performance_benchmarks (
                        target_url, duration_seconds, concurrency, total_requests, errors, p50_latency, p90_latency, p99_latency, created_at
                    )
                    VALUES (
                        ${targetUrl}, ${durationSeconds}, ${concurrency}, ${completedRequests}, ${errors}, ${p50}, ${p90}, ${p99}, NOW()
                    )
                `;
            } catch (err) {
                console.error("Failed to log benchmark to database:", err);
            }

            resolve(results);
        };

        const makeRequest = () => {
            if (performance.now() >= endTime) {
                if (activeConnections === 0) {
                    finishTest();
                }
                return;
            }

            activeConnections++;
            const start = performance.now();

            const req = client.request(url, (res) => {
                res.on('data', () => {}); // consume data
                res.on('end', () => {
                    const latency = performance.now() - start;
                    latencies.push(latency);
                    completedRequests++;
                    activeConnections--;
                    
                    if (performance.now() < endTime) {
                        makeRequest();
                    } else if (activeConnections === 0) {
                        finishTest();
                    }
                });
            });

            req.on('error', (err) => {
                errors++;
                activeConnections--;
                
                if (performance.now() < endTime) {
                    makeRequest();
                } else if (activeConnections === 0) {
                    finishTest();
                }
            });

            req.end();
        };

        for (let i = 0; i < concurrency; i++) {
            makeRequest();
        }

        if (concurrency === 0) {
            finishTest();
        }
    });
}
