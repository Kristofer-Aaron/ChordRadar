import dotenv from "dotenv";
dotenv.config();

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

import chordRoutes from './routes/chordRoutes.js';
import notationRoutes from './routes/notationRoutes.js';
import tuningRoutes from './routes/tuningRoutes.js';
import gripRoutes from './routes/gripRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();
const openapiSpec = YAML.load("./docs/openapi.yaml");

// CORS must come BEFORE routes
const allowedOrigins = [
    'http://localhost',
    'http://localhost:80',
    'http://127.0.0.1',
];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, true); // Allow all for now
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
    maxAge: 86400,
}));

// app.options('*', cors());

app.use(express.json());

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.use('/api/chords', chordRoutes);
app.use('/api/notations', notationRoutes);
app.use('/api/tunings', tuningRoutes);
app.use('/api/grips', gripRoutes);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);



export default app;