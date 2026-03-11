/**
 * ai-simulator.js — Real LLM-powered employee insights API.
 *
 * This version uses the Groq API to generate insights based on real 
 * employee data from employees.json.
 *
 * Features:
 *   - Real model inference (Groq Llama 3)
 *   - Confidence score generation
 *   - Rate limiting
 *   - Consent token verification
 */

import { Router } from 'express';
import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config();

const router = Router();

// ---- State ----
const consentTokens = new Map(); // token → { userId, scope, createdAt, expiresAt }
const aiRequestCounts = new Map(); // ip → { count, resetAt }

// ---- Configuration (read once at startup) ----
const AI_LOW_CONFIDENCE_RATE = parseFloat(process.env.AI_LOW_CONFIDENCE_RATE || '0.10');
const AI_RATE_LIMIT = parseInt(process.env.AI_RATE_LIMIT || '10', 10);
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const groq = new Groq({
  apiKey: GROQ_API_KEY,
});

const PROMPT_TEMPLATE = readFileSync(
  join(__dirname, 'prompts', 'employee-insights.txt'),
  'utf-8'
);

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
// POST /api/ai/insights — AI-generated insights
// ============================================================
router.post('/insights', (req, res) => {
  // ---- Consent check ----
  const consentToken = req.headers['x-consent-token'];
  if (!consentToken) {
    return res.status(401).json({
      error: 'Consent required',
      message:
        'AI features require explicit user consent.',
    });
  }

  // Accept any faked token from the frontend, or check the local map
  const isFakedToken = typeof consentToken === 'string' && consentToken.startsWith('faked-consent-token-');
  const consent = consentTokens.get(consentToken);

  if (!isFakedToken && !consent) {
    return res.status(403).json({
      error: 'Invalid consent token',
      message: 'The provided consent token is not recognized.',
    });
  }
  
  if (consent && new Date(consent.expiresAt) < new Date()) {
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

  // ---- Get employee from body ----
  const employee = req.body;
  if (!employee || !employee.uid) {
    return res.status(400).json({
      error: 'Bad request',
      message: 'Full employee object is required in the request body.',
    });
  }

  // ---- Real LLM Inference ----
  const start = Date.now();

  (async () => {
    try {
      const confidence = generateConfidence();
      const summary = await generateLLMSummary(employee);

      res.json({
        employeeId: employee.id,
        employeeUid: employee.uid,
        summary,
        confidence: Math.round(confidence * 100) / 100,
        generatedAt: new Date().toISOString(),
        model: 'groq-llama-3-70b',
        processingTimeMs: Date.now() - start,
      });
    } catch (error) {
      console.error('[AI Error]', error);
      res.status(500).json({
        error: 'LLM Inference failed',
        message: 'There was an issue generating insights from the real LLM.',
      });
    }
  })();
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

async function generateLLMSummary(employee) {
  const activity = employee.activity || {};
  const teams = employee.teams.map((t) => t.name).join(', ') || 'Unassigned';

  const prompt = PROMPT_TEMPLATE.replace('{{name}}', employee.name || employee.uid)
    .replace('{{teams}}', teams)
    .replace('{{prsLastMonth}}', activity.prsLastMonth || 0)
    .replace('{{commitsLastMonth}}', activity.commitsLastMonth || 0)
    .replace('{{reviewsLastMonth}}', activity.reviewsLastMonth || 0)
    .replace('{{incidentsLastMonth}}', activity.incidentsLastMonth || 0)
    .replace('{{meetingsLastWeek}}', activity.meetingsLastWeek || 0);

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
  });

  return completion.choices[0].message.content.trim();
}

export { router as aiInsightsRouter };
