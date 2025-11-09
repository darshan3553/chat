import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.route.js';
import messageRoutes from './routes/message.route.js';
import path from 'path';
import { connectDB } from './lib/db.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
const _dirname = path.resolve();

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);



app.listen(PORT, () => {
  console.log(`Server is running on port:${PORT}`);
  connectDB();
});
