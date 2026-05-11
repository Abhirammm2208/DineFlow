export interface BillItem {
    menu_item_id: string;
    item_name: string;
    price: number;
    quantity: number;
    subtotal: number;
}
export interface Customer {
    id: string;
    name: string;
    phone: string;
    points_balance?: number;
    total_visits?: number;
    total_spend?: number;
}
export interface MenuItem {
    id: string;
    name: string;
    price: number;
    category: string;
}
interface StoreState {
    token: string | null;
    merchantId: string | null;
    merchantName: string | null;
    currentBillItems: BillItem[];
    selectedCustomer: Customer | null;
    billTotal: number;
    isLoading: boolean;
    error: string | null;
    setToken: (token: string, merchantId: string, merchantName: string) => void;
    clearAuth: () => void;
    addBillItem: (item: MenuItem) => void;
    removeBillItem: (menuItemId: string) => void;
    updateBillItemQuantity: (menuItemId: string, quantity: number) => void;
    setSelectedCustomer: (customer: Customer | null) => void;
    clearBill: () => void;
    setError: (error: string | null) => void;
    setLoading: (loading: boolean) => void;
}
export declare const useStore: import("zustand").UseBoundStore<import("zustand").StoreApi<StoreState>>;
export {};
//# sourceMappingURL=store.d.ts.map