import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { aiInsightsRouter } from './ai-simulator.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/ai', aiInsightsRouter);

export default app;
