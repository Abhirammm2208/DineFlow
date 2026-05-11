export declare const supabase: import("@supabase/supabase-js").SupabaseClient<any, "public", "public", any, any>;
export interface Merchant {
    id: string;
    name: string;
    email: string;
    phone: string;
    pin_hash: string;
    created_at: string;
}
export interface Customer {
    id: string;
    merchant_id: string;
    phone: string;
    name: string;
    points_balance: number;
    total_visits: number;
    total_spend: number;
    created_at: string;
}
export interface MenuItem {
    id: string;
    merchant_id: string;
    name: string;
    price: number;
    category: string;
    is_active: boolean;
    created_at: string;
}
export interface Bill {
    id: string;
    merchant_id: string;
    customer_id: string | null;
    items: BillItem[];
    total_amount: number;
    status: 'pending' | 'completed' | 'cancelled';
    created_at: string;
    completed_at: string | null;
}
export interface BillItem {
    menu_item_id: string;
    item_name: string;
    price: number;
    quantity: number;
    subtotal: number;
}
//# sourceMappingURL=supabase.d.ts.map