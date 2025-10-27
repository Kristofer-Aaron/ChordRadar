import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

import chordRoutes from './routes/chordRoutes.js';
import tuningRoutes from './routes/tuningRoutes.js';
import gripRoutes from './routes/gripRoutes.js';

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/api/chords', chordRoutes);
app.use('/api/tunings', tuningRoutes);
app.use('/api/grips', gripRoutes);

export default app;