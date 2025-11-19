import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

import chordRoutes from './routes/chordRoutes.js';
import tuningRoutes from './routes/tuningRoutes.js';
import gripRoutes from './routes/gripRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/api/chords', chordRoutes);
app.use('/api/tunings', tuningRoutes);
app.use('/api/grips', gripRoutes);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);

export default app;