/**
 * Phase 6: K6 Load Test for Leaderboard API
 * Tests leaderboard endpoint performance under concurrent load
 * 
 * Usage:
 *   k6 run scripts/load/leaderboard-k6.js
 *   k6 run --vus 50 --duration 30s scripts/load/leaderboard-k6.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const leaderboardDuration = new Trend('leaderboard_duration');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 100 }, // Spike to 100 users
    { duration: '1m', target: 50 },   // Scale back
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    errors: ['rate<0.1'],              // Error rate must be below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test 1: Get global leaderboard
  const globalRes = http.get(`${BASE_URL}/api/gamification/leaderboard?scope=global&limit=50`, {
    headers: {
      'x-user-id': `load-test-user-${__VU}`, // Virtual User ID
    },
  });

  check(globalRes, {
    'global leaderboard status is 200': (r) => r.status === 200,
    'global leaderboard has entries': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.entries && body.entries.length > 0;
      } catch {
        return false;
      }
    },
  }) || errorRate.add(1);

  leaderboardDuration.add(globalRes.timings.duration);

  sleep(1);

  // Test 2: Get tribe-specific leaderboard
  const tribes = ['Navajo', 'Cherokee', 'Sioux', 'Apache', 'Pueblo'];
  const randomTribe = tribes[Math.floor(Math.random() * tribes.length)];

  const tribeRes = http.get(
    `${BASE_URL}/api/gamification/leaderboard?scope=tribe&tribe=${randomTribe}&limit=20`,
    {
      headers: {
        'x-user-id': `load-test-user-${__VU}`,
      },
    }
  );

  check(tribeRes, {
    'tribe leaderboard status is 200': (r) => r.status === 200,
    'tribe leaderboard response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(2);

  // Test 3: Get user position
  const positionRes = http.get(
    `${BASE_URL}/api/gamification/leaderboard?scope=global&limit=1`,
    {
      headers: {
        'x-user-id': `load-test-user-${__VU}`,
      },
    }
  );

  check(positionRes, {
    'position lookup status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'load-test-results.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const indent = options?.indent || '';
  const enableColors = options?.enableColors || false;

  let summary = `
${indent}================================================================================
${indent}K6 Load Test Summary - Leaderboard API
${indent}================================================================================

${indent}Test Duration: ${data.state.testRunDurationMs / 1000}s
${indent}Total Requests: ${data.metrics.http_reqs?.values?.count || 0}
${indent}Failed Requests: ${data.metrics.http_req_failed?.values?.passes || 0}

${indent}Response Times:
${indent}  avg: ${data.metrics.http_req_duration?.values?.avg?.toFixed(2)}ms
${indent}  min: ${data.metrics.http_req_duration?.values?.min?.toFixed(2)}ms
${indent}  max: ${data.metrics.http_req_duration?.values?.max?.toFixed(2)}ms
${indent}  p(95): ${data.metrics.http_req_duration?.values['p(95)']?.toFixed(2)}ms
${indent}  p(99): ${data.metrics.http_req_duration?.values['p(99)']?.toFixed(2)}ms

${indent}Error Rate: ${((data.metrics.errors?.values?.rate || 0) * 100).toFixed(2)}%

${indent}Leaderboard-Specific Metrics:
${indent}  avg duration: ${data.metrics.leaderboard_duration?.values?.avg?.toFixed(2)}ms
${indent}  p(95): ${data.metrics.leaderboard_duration?.values['p(95)']?.toFixed(2)}ms

${indent}Virtual Users:
${indent}  max: ${data.metrics.vus_max?.values?.max || 0}

${indent}Data Transferred:
${indent}  received: ${((data.metrics.data_received?.values?.count || 0) / 1024 / 1024).toFixed(2)} MB
${indent}  sent: ${((data.metrics.data_sent?.values?.count || 0) / 1024).toFixed(2)} KB

${indent}================================================================================
`;

  return summary;
}
