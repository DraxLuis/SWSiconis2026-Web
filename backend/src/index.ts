import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import testDbRoute from './routes/testDb';
import dashboardRoute from './routes/dashboard';
import gastosRoute from './routes/gastos';
import ingresosRoute from './routes/ingresos';
import pagosRoute from './routes/pagos';
import reportesRoute from './routes/reportes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware configuration
app.use(cors());
app.use(express.json());

// Routes mapping
app.use('/api/test-db', testDbRoute);
app.use('/api/dashboard', dashboardRoute);
app.use('/api/gastos', gastosRoute);
app.use('/api/ingresos', ingresosRoute);
app.use('/api/pagos', pagosRoute);
app.use('/api/reportes', reportesRoute);

// Base route handler
app.get('/', (req, res) => {
  res.json({
    message: 'SWSiconis 2026 API Server running',
    endpoints: [
      '/api/test-db',
      '/api/dashboard',
      '/api/gastos',
      '/api/ingresos',
      '/api/pagos',
      '/api/reportes'
    ]
  });
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
