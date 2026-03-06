/**
 * ai-simulator.js — Simulates an LLM-powered employee insights API.
 *
 * Behaviors that mirror real AI services:
 *   - Variable latency (200ms – 5s) simulating model inference time
 *   - Confidence scores (most high, ~10% low)
 *   - Occasional PII contamination in generated text
 *   - Rate limiting (separate from GraphQL)
 *   - Requires a consent token obtained via POST /api/ai/consent
 *   - Occasional timeouts (>10s)
 */

import { Router } from 'express';
import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const employees = JSON.parse(
  readFileSync(join(__dirname, 'data', 'employees.json'), 'utf-8')
);

const router = Router();

// ---- State ----
const consentTokens = new Map(); // token → { userId, scope, createdAt, expiresAt }
const aiRequestCounts = new Map(); // ip → { count, resetAt }

// ---- Configuration (read once at startup) ----
const AI_MIN_LATENCY = parseInt(process.env.AI_MIN_LATENCY_MS || '200', 10);
const AI_MAX_LATENCY = parseInt(process.env.AI_MAX_LATENCY_MS || '5000', 10);
const AI_TIMEOUT_RATE = parseFloat(process.env.AI_TIMEOUT_RATE || '0.05');
const AI_PII_RATE = parseFloat(process.env.AI_PII_RATE || '0.15');
const AI_LOW_CONFIDENCE_RATE = parseFloat(process.env.AI_LOW_CONFIDENCE_RATE || '0.10');
const AI_RATE_LIMIT = parseInt(process.env.AI_RATE_LIMIT || '10', 10);

// ============================================================
// POST /api/ai/consent — Obtain a consent token
// ============================================================
router.post('/consent', (req, res) => {
  const { userId, scope } = req.body || {};

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      error: 'Bad request',
      message: 'Field "userId" (string) is required.',
    });
  }
  if (!scope || typeof scope !== 'string') {
    return res.status(400).json({
      error: 'Bad request',
      message: 'Field "scope" (string) is required. Use "insights" for AI employee insights.',
    });
  }

  const token = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour

  consentTokens.set(token, {
    userId,
    scope,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  });

  res.json({
    consentToken: token,
    expiresAt: expiresAt.toISOString(),
    scope,
  });
});

// ============================================================
// GET /api/ai/insights/:employeeId — AI-generated insights
// ============================================================
router.get('/insights/:employeeId', (req, res) => {
  // ---- Consent check ----
  const consentToken = req.headers['x-consent-token'];
  if (!consentToken) {
    return res.status(401).json({
      error: 'Consent required',
      message:
        'AI features require explicit user consent. Obtain a token via POST /api/ai/consent with { "userId": "<id>", "scope": "insights" } and pass it as the X-Consent-Token header.',
    });
  }

  const consent = consentTokens.get(consentToken);
  if (!consent) {
    return res.status(403).json({
      error: 'Invalid consent token',
      message: 'The provided consent token is not recognized.',
    });
  }
  if (new Date(consent.expiresAt) < new Date()) {
    consentTokens.delete(consentToken);
    return res.status(403).json({
      error: 'Consent expired',
      message: 'Your consent token has expired. Please obtain a new one.',
    });
  }

  // ---- AI-specific rate limiting ----
  const ip = req.ip || 'unknown';
  const now = Date.now();
  let record = aiRequestCounts.get(ip);
  if (!record || now > record.resetAt) {
    record = { count: 0, resetAt: now + 60_000 };
  }
  record.count++;
  aiRequestCounts.set(ip, record);

  if (record.count > AI_RATE_LIMIT) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({
      error: 'AI rate limit exceeded',
      retryAfter,
      message: `AI insights are limited to ${AI_RATE_LIMIT} requests per minute. Retry in ${retryAfter}s.`,
    });
  }

  // ---- Find employee ----
  const { employeeId } = req.params;
  const employee = employees.find(
    (e) => e.id === employeeId || e.uid === employeeId
  );
  if (!employee) {
    return res.status(404).json({
      error: 'Employee not found',
      message: `No employee with id or uid "${employeeId}".`,
    });
  }

  // ---- Simulate timeout ----
  if (Math.random() < AI_TIMEOUT_RATE) {
    const delay = 10_000 + Math.random() * 10_000; // 10-20s
    setTimeout(() => {
      if (!res.headersSent) {
        res.status(504).json({
          error: 'AI model timeout',
          message: 'The model took too long to generate a response.',
        });
      }
    }, delay);
    return;
  }

  // ---- Simulate normal latency ----
  const latency = AI_MIN_LATENCY + Math.random() * (AI_MAX_LATENCY - AI_MIN_LATENCY);

  setTimeout(() => {
    const confidence = generateConfidence();
    let summary = generateSummary(employee);

    // Occasional PII contamination
    if (Math.random() < AI_PII_RATE) {
      summary = injectPII(summary, employee);
    }

    res.json({
      employeeId: employee.id,
      employeeUid: employee.uid,
      summary,
      confidence: Math.round(confidence * 100) / 100,
      generatedAt: new Date().toISOString(),
      model: 'faros-insights-v1',
      processingTimeMs: Math.round(latency),
    });
  }, Math.round(latency));
});

// ============================================================
// Helpers
// ============================================================

function generateConfidence() {
  if (Math.random() < AI_LOW_CONFIDENCE_RATE) {
    return Math.random() * 0.3; // 0.00 – 0.30
  }
  return 0.70 + Math.random() * 0.30; // 0.70 – 1.00
}

function generateSummary(employee) {
  const name = employee.name || employee.uid;
  const teamNames =
    employee.teams.length > 0
      ? employee.teams.map((t) => t.name).join(' and ')
      : 'unassigned areas';
  const accountCount = employee.accounts.length;
  const activity = employee.activity || {};

  const templates = [
    `${name} has been actively contributing across ${teamNames}. Over the past month, they authored ${activity.prsLastMonth ?? 'several'} pull requests and participated in ${activity.reviewsLastMonth ?? 'multiple'} code reviews. Collaboration patterns indicate consistent engagement with cross-functional team members.`,

    `Analysis of ${name}'s recent work shows strong delivery velocity within ${teamNames}. Key focus areas include feature development and technical debt reduction. They are connected via ${accountCount} platform(s) with regular activity in version control and task management.`,

    `${name}'s activity over the past quarter reflects a focus on ${teamNames} priorities. They have contributed ${activity.commitsLastMonth ?? 'numerous'} commits and attended ${activity.meetingsLastWeek ?? 'several'} meetings in the past week, suggesting active involvement in team planning and execution.`,

    `Recent data shows ${name} maintaining a steady contribution rhythm in ${teamNames}. Incident response participation includes ${activity.incidentsLastMonth ?? 0} incident(s) last month. Overall engagement across ${accountCount} connected account(s) is consistent with expectations for the role.`,

    `${name} demonstrates effective collaboration patterns across ${teamNames}. Pull request throughput of ${activity.prsLastMonth ?? 'N/A'} PRs/month is above team median. Review turnaround and meeting attendance suggest a well-integrated team member.`,
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

function injectPII(summary, employee) {
  const name = employee.name || employee.uid;
  const firstName = name.split(' ')[0].toLowerCase();

  const piiSnippets = [
    ` Their personal phone is ${randomPhone()}.`,
    ` Note: SSN on file is ${randomSSN()}.`,
    ` Personal email: ${firstName}.personal${Math.floor(Math.random() * 99)}@gmail.com was found in recent communications.`,
    ` Home address: ${randomAddress()}.`,
    ` Date of birth: ${randomDOB()}.`,
  ];

  // Insert 1-2 PII snippets at natural-looking positions
  const snippet = piiSnippets[Math.floor(Math.random() * piiSnippets.length)];
  const sentences = summary.split('. ');
  const insertAt = Math.min(
    Math.floor(Math.random() * sentences.length) + 1,
    sentences.length
  );
  sentences.splice(insertAt, 0, snippet.trim());
  return sentences.join('. ');
}

function randomPhone() {
  const area = Math.floor(Math.random() * 900) + 100;
  const mid = Math.floor(Math.random() * 900) + 100;
  const last = Math.floor(Math.random() * 9000) + 1000;
  return `(${area}) ${mid}-${last}`;
}

function randomSSN() {
  const a = Math.floor(Math.random() * 900) + 100;
  const b = Math.floor(Math.random() * 90) + 10;
  const c = Math.floor(Math.random() * 9000) + 1000;
  return `${a}-${b}-${c}`;
}

function randomAddress() {
  const streets = ['Oak', 'Elm', 'Maple', 'Cedar', 'Pine', 'Birch'];
  const types = ['Street', 'Avenue', 'Lane', 'Drive', 'Court'];
  const cities = ['Springfield', 'Portland', 'Fairview', 'Madison', 'Clinton'];
  const states = ['IL', 'OR', 'CA', 'WI', 'NY'];
  const num = Math.floor(Math.random() * 9999) + 1;
  const street = streets[Math.floor(Math.random() * streets.length)];
  const type = types[Math.floor(Math.random() * types.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const state = states[Math.floor(Math.random() * states.length)];
  const zip = Math.floor(Math.random() * 90000) + 10000;
  return `${num} ${street} ${type}, ${city}, ${state} ${zip}`;
}

function randomDOB() {
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  const year = Math.floor(Math.random() * 30) + 1970;
  return `${month}/${day}/${year}`;
}

export { router as aiInsightsRouter };
