import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import merchantRoutes from './routes/merchants.js';
import menuRoutes from './routes/menu.js';
import customerRoutes from './routes/customers.js';
import billRoutes from './routes/bills.js';
const app = express();
const PORT = process.env.PORT || 3001;
// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
// Routes
app.use('/api/merchants', merchantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/bills', billRoutes);
// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
    });
});
// Start server
app.listen(PORT, () => {
    console.log(`🚀 DineFlow Backend running on http://localhost:${PORT}`);
    console.log(`📝 API Documentation:`);
    console.log(`  - Merchants: POST /api/merchants/register, /api/merchants/login`);
    console.log(`  - Menu: GET /api/menu, POST /api/menu`);
    console.log(`  - Customers: GET /api/customers, POST /api/customers`);
    console.log(`  - Bills: GET /api/bills, POST /api/bills, POST /api/bills/:id/punch`);
});
//# sourceMappingURL=index.js.map