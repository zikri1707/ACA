import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import accountRoutes from './routes/accountRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import ruleRoutes from './routes/ruleRoutes.js';
import consultationRoutes from './routes/consultationRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration — supports local dev and Netlify production
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3002']
  : true; // allow all in dev

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Routes registration
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  return res.json({ status: 'ok', system: 'ACA Expert System', version: '2.4.0' });
});

// Start Express server
app.listen(PORT, () => {
  console.log(`Backend server successfully listening on port ${PORT}`);
});
export default app;
