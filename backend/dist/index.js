import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import merchantRoutes from './routes/merchants.js';
import menuRoutes from './routes/menu.js';
import customerRoutes from './routes/customers.js';
import billRoutes from './routes/bills.js';
import dashboardRoutes from './routes/dashboard.js';
import searchRoutes from './routes/search.js';
import v1CatalogRoutes from './routes/v1Catalog.js';
import loyaltyRoutes from './routes/loyalty.js';
import campaignsRoutes from './routes/campaigns.js';
import analyticsRoutes from './routes/analytics.js';
import testEmailRoutes from './routes/testEmail.js';
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
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/v1', v1CatalogRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/test-email', testEmailRoutes);
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
    console.log(`DineFlow backend: http://localhost:${PORT}`);
    console.log('API: /api/merchants, /menu, /customers, /bills, /dashboard, /search, /v1, /loyalty, /campaigns, /analytics');
});
//# sourceMappingURL=index.js.map