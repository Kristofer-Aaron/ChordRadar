import app from './app.js';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { expression } from 'joi';
dotenv.config();

const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

app.use(expression.json);

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});