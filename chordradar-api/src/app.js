import dotenv from "dotenv";
dotenv.config();

import express from 'express';
import cors from 'cors';
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

import chordRoutes from './routes/chordRoutes.js';
import notationRoutes from './routes/notationRoutes.js';
import tuningRoutes from './routes/tuningRoutes.js';
import gripRoutes from './routes/gripRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { register } from "node:module";

const app = express();
const openapiSpec = YAML.load("./docs/openapi.yaml");

const allowedOrigins = [
    'http://127.0.01',
    'http://localhost',
    'http://localhost:80',
    'http://localhost:5173'
  ];

app.use(cors({
    origin(origin, cb) {
      // allow non-browser tools without Origin (curl/Postman)
      if (!origin) return cb(null, true);
      return allowedOrigins.includes(origin)
        ? cb(null, true)
        : cb(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  }));
  
app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.use('/api/chords', chordRoutes);
app.use('/api/notations', notationRoutes);
app.use('/api/tunings', tuningRoutes);
app.use('/api/grips', gripRoutes);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);

export default app;