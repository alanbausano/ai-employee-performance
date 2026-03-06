/**
 * Faros Employee Insights — Mock API Server
 *
 * This server provides:
 *   1. A GraphQL API for employee data (with realistic chaos: latency, errors, rate limits)
 *   2. An AI insights REST API simulating LLM behavior (consent, PII, confidence, timeouts)
 *   3. A telemetry ingestion endpoint
 *   4. A health check
 *
 * Configuration: see .env.example for all tunable parameters.
 *
 * Usage:
 *   npm install
 *   cp .env.example .env
 *   npm start
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';

import { typeDefs, resolvers } from './resolvers.js';
import { chaosMiddleware } from './chaos.js';
import { aiInsightsRouter } from './ai-simulator.js';

const PORT = parseInt(process.env.PORT || '4000', 10);
const app = express();

// ---- Global middleware ----
app.use(cors());
app.use(express.json());

// ---- Health check (no chaos) ----
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---- Telemetry ingestion ----
const telemetryEvents = [];

app.post('/api/telemetry', (req, res) => {
  const event = req.body;
  if (!event || typeof event !== 'object') {
    return res.status(400).json({ error: 'Request body must be a JSON object.' });
  }

  const enriched = {
    ...event,
    receivedAt: new Date().toISOString(),
    clientIp: req.ip,
  };
  telemetryEvents.push(enriched);

  if (process.env.TELEMETRY_LOG_LEVEL === 'verbose') {
    console.log('[telemetry]', JSON.stringify(enriched));
  }

  res.status(202).json({ accepted: true });
});

// Evaluator-only: view collected telemetry (not documented to candidates)
app.get('/api/telemetry', (_req, res) => {
  res.json({ count: telemetryEvents.length, events: telemetryEvents.slice(-100) });
});

// ---- AI Insights REST API ----
app.use('/api/ai', aiInsightsRouter);

// ---- GraphQL with chaos middleware ----
const apollo = new ApolloServer({ typeDefs, resolvers });
await apollo.start();

app.use(
  '/graphql',
  chaosMiddleware({
    errorRate: parseFloat(process.env.GRAPHQL_ERROR_RATE || '0.05'),
    minLatency: parseInt(process.env.GRAPHQL_MIN_LATENCY_MS || '50', 10),
    maxLatency: parseInt(process.env.GRAPHQL_MAX_LATENCY_MS || '800', 10),
    rateLimit: parseInt(process.env.GRAPHQL_RATE_LIMIT || '60', 10),
  }),
  expressMiddleware(apollo)
);

// ---- Start ----
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   Faros Employee Insights — Mock API Server         ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  GraphQL          http://localhost:${PORT}/graphql       ║`);
  console.log(`║  AI Insights      http://localhost:${PORT}/api/ai/...    ║`);
  console.log(`║  Telemetry        http://localhost:${PORT}/api/telemetry  ║`);
  console.log(`║  Health           http://localhost:${PORT}/health         ║`);
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║  Open /graphql in a browser for Apollo Sandbox      ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
});
