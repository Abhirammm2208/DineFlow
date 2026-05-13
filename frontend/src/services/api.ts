import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  registerMerchant: async (name: string, email: string, phone: string, pin: string) => {
    return apiClient.post('/merchants/register', { name, email, phone, pin });
  },

  loginMerchant: async (email: string, pin: string) => {
    return apiClient.post('/merchants/login', { email, pin });
  },

  getMerchantProfile: async () => {
    return apiClient.get('/merchants/profile');
  },

  updateMerchantProfile: async (payload: {
    name?: string;
    phone?: string;
    tax_rate?: number;
    receipt_template?: string;
    staff_roles?: string[];
    points_rate?: number;
  }) => {
    return apiClient.put('/merchants/profile', payload);
  },

  getMenu: async () => {
    return apiClient.get('/menu');
  },

  createMenuItem: async (
    name: string,
    price: number,
    category: string,
    description?: string,
    image_url?: string
  ) => {
    return apiClient.post('/menu', { name, price, category, description, image_url });
  },

  updateMenuItem: async (
    id: string,
    name: string,
    price: number,
    category: string,
    is_active: boolean
  ) => {
    return apiClient.put(`/menu/${id}`, { name, price, category, is_active });
  },

  deleteMenuItem: async (id: string) => {
    return apiClient.delete(`/menu/${id}`);
  },

  searchCustomer: async (phone: string) => {
    try {
      const response = await apiClient.get(`/customers/search/${encodeURIComponent(phone)}`);
      return response.data;
    } catch {
      return null;
    }
  },

  searchCustomersQuery: async (q: string) => {
    const response = await apiClient.get('/customers/search', { params: { q } });
    return response.data;
  },

  createCustomer: async (name: string, phone: string, email?: string, telegram_chat_id?: string) => {
    return apiClient.post('/customers', { name, phone, email, telegram_chat_id });
  },

  getCustomers: async () => {
    return apiClient.get('/customers');
  },

  getCustomersPaged: async (params: { segment?: string; page?: number; limit?: number; q?: string }) => {
    return apiClient.get('/customers', { params });
  },

  getCustomer: async (id: string) => {
    return apiClient.get(`/customers/${id}`);
  },

  getCustomerActivity: async (id: string) => {
    return apiClient.get(`/customers/${id}/activity`);
  },

  getCustomerTopItems: async (id: string) => {
    return apiClient.get(`/customers/${id}/top-items`);
  },

  sendCustomerMessage: async (id: string, body: string, channel?: string) => {
    return apiClient.post(`/customers/${id}/message`, { body, channel });
  },

  updateCustomer: async (id: string, payload: Record<string, unknown>) => {
    return apiClient.put(`/customers/${id}`, payload);
  },

  createBill: async (payload: {
    customerId: string | null;
    items: unknown[];
    subtotal?: number;
    taxRate?: number;
    taxAmount?: number;
    totalAmount?: number;
    order_type?: string;
    table_ref?: string;
    order_label?: string;
  }) => {
    return apiClient.post('/bills', payload);
  },

  getBills: async (status?: string, limit?: number, offset?: number) => {
    return apiClient.get('/bills', {
      params: { status, limit: limit || 50, offset: offset || 0 },
    });
  },

  getBill: async (id: string) => {
    return apiClient.get(`/bills/${id}`);
  },

  holdBill: async (id: string, held = true) => {
    return apiClient.patch(`/bills/${id}/hold`, { held });
  },

  punchBill: async (id: string, payment?: { payment_method?: string; payment_last_four?: string; points_redeemed?: number; discount_amount?: number }) => {
    return apiClient.post(`/bills/${id}/punch`, payment || {});
  },

  getBillStats: async () => {
    return apiClient.get('/bills/stats/today');
  },

  getDashboardStats: async () => {
    return apiClient.get('/dashboard/stats');
  },

  getLiveRevenue: async () => {
    return apiClient.get('/dashboard/live-revenue');
  },

  exportDashboard: async () => {
    return apiClient.post('/dashboard/export', {});
  },

  globalSearch: async (q: string) => {
    const { data } = await apiClient.get('/search', { params: { q } });
    return data;
  },

  getV1Categories: async () => {
    return apiClient.get('/v1/categories');
  },

  getV1Products: async (category?: string, filter?: string) => {
    return apiClient.get('/v1/products', { params: { category, filter } });
  },

  getV1Tables: async () => {
    return apiClient.get('/v1/tables');
  },

  getLoyaltyStats: async () => {
    return apiClient.get('/loyalty/stats');
  },

  getLoyaltyTiers: async () => {
    return apiClient.get('/loyalty/tiers');
  },

  getLoyaltyStreaks: async () => {
    return apiClient.get('/loyalty/streaks');
  },

  getLoyaltyReferrals: async () => {
    return apiClient.get('/loyalty/referrals');
  },

  getLoyaltyCashback: async () => {
    return apiClient.get('/loyalty/cashback');
  },

  getCampaigns: async () => {
    return apiClient.get('/campaigns');
  },

  createCampaign: async (title: string, description?: string, status?: string, scheduled_at?: string, target_segment?: string) => {
    return apiClient.post('/campaigns', { title, description, status, scheduled_at, target_segment });
  },

  patchCampaign: async (id: string, patch: { status?: string; scheduled_at?: string | null; target_segment?: string }) => {
    return apiClient.patch(`/campaigns/${id}`, patch);
  },

  broadcastCampaign: async (id: string) => {
    return apiClient.post(`/campaigns/${id}/broadcast`);
  },

  getAnalyticsSummary: async () => {
    return apiClient.get('/analytics/summary');
  },

  getRevenueChart: async () => {
    return apiClient.get('/analytics/revenue-chart');
  },

  getTopCustomers: async () => {
    return apiClient.get('/dashboard/top-customers');
  },

  getAtRisk: async () => {
    return apiClient.get('/dashboard/at-risk');
  },

  generateCampaignMessage: async (title: string, description?: string, segment?: string) => {
    return apiClient.post('/ai/generate-campaign', { title, description, segment });
  },

  uploadMenuItemImage: async (itemId: string, imageUrl: string, altText?: string) => {
    return apiClient.post(`/menu/${itemId}/upload-image`, { image_url: imageUrl, image_alt_text: altText });
  },
};

export default api;
