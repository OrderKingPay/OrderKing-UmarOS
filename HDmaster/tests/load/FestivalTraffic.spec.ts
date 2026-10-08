import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// Custom metrics to track specific controller latencies
const edgeCacheLatency = new Trend('edge_cache_latency');
const discoveryEngineLatency = new Trend('discovery_engine_latency');
const errorRate = new Rate('error_rate');

export const options = {
    scenarios: {
        festival_traffic_burst: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 10000 }, // Aggressive ramp up to 10k concurrent users
                { duration: '3m', target: 10000 },  // Sustain peak festival traffic
                { duration: '30s', target: 0 },     // Ramp down
            ],
            gracefulRampDown: '30s',
        },
    },
    thresholds: {
        // STRICT ASSERTIONS: Prove infrastructure scale with <50ms latency
        'http_req_duration': ['p(95)<50', 'p(99)<75', 'max<100'],
        'http_req_failed': ['rate==0'], // ZERO errors permitted under extreme load
        'edge_cache_latency': ['p(95)<50'],
        'discovery_engine_latency': ['p(95)<50'],
    },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';

export default function () {
    // 1. Blast EdgeCacheController
    const edgeRes = http.get(`${BASE_URL}/api/v1/edge/search?q=Pizza`, {
        tags: { name: 'EdgeCacheSearch' }
    });
    
    edgeCacheLatency.add(edgeRes.timings.duration);
    errorRate.add(edgeRes.status !== 200);
    
    check(edgeRes, {
        'EdgeCache response is 200': (r) => r.status === 200,
        'EdgeCache response time < 50ms': (r) => r.timings.duration < 50,
        'EdgeCache body contains results': (r) => r.body.length > 0,
    });

    // 2. Blast InvertedIndexDiscoveryEngine
    const discoveryRes = http.get(`${BASE_URL}/api/v1/discovery/search?term=Pizza&strategy=inverted_index`, {
        tags: { name: 'DiscoveryEngineSearch' }
    });
    
    discoveryEngineLatency.add(discoveryRes.timings.duration);
    errorRate.add(discoveryRes.status !== 200);

    check(discoveryRes, {
        'DiscoveryEngine response is 200': (r) => r.status === 200,
        'DiscoveryEngine response time < 50ms': (r) => r.timings.duration < 50,
        'DiscoveryEngine body contains results': (r) => r.body.length > 0,
    });

    // Minimal sleep to simulate active slamming without completely breaking the local event loop
    sleep(Math.random() * 0.5 + 0.1); 
}
