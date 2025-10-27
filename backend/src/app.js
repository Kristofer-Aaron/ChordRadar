import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import bodyParser from 'body-parser';

import chordRoutes from './routes/chordRoutes.js';
import tuningRoutes from './routes/tuningRoutes.js';
import gripRoutes from './routes/gripRoutes.js';

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/api/chords', chordRoutes);
app.use('/api/tunings', tuningRoutes);
app.use('/api/grips', gripRoutes);

app.patch('/api/chords/:id', async (req, res) => {
  const id = parseInt(req.params.id)
  try {
    const updatedChord = await prisma.chord.update({
      where: { id },
      data: req.body,
    })
    res.json(updatedChord)
  } catch (error) {
    res.status(404).json({ error: 'Chord not found or invalid data' })
  }
})

export default app;