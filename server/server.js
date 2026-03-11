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

app.listen(port, () => {
  console.log(`\n🚀 AI Insights Server ready at http://localhost:${port}`);
  console.log(`Mode: Real LLM (Groq)\n`);
});
