export declare const api: {
    registerMerchant: (name: string, email: string, phone: string, pin: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    loginMerchant: (email: string, pin: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getMerchantProfile: () => Promise<import("axios").AxiosResponse<any, any, {}>>;
    updateMerchantProfile: (name: string, phone: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getMenu: () => Promise<import("axios").AxiosResponse<any, any, {}>>;
    createMenuItem: (name: string, price: number, category: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    updateMenuItem: (id: string, name: string, price: number, category: string, is_active: boolean) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    deleteMenuItem: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    searchCustomer: (phone: string) => Promise<any>;
    createCustomer: (name: string, phone: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getCustomers: () => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getCustomer: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    updateCustomer: (id: string, name: string, phone: string, points_balance: number) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    createBill: (customerId: string | null, items: any[]) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getBills: (status?: string, limit?: number, offset?: number) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getBill: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    punchBill: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getBillStats: () => Promise<import("axios").AxiosResponse<any, any, {}>>;
};
export default api;
//# sourceMappingURL=api.d.ts.map