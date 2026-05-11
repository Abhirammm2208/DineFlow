export type DemoMerchantSeed = {
    name: string;
    email: string;
    phone: string;
    pin: string;
    tax_rate: number;
    receipt_template: string;
    staff_roles: string[];
};
export declare const demoMerchant: DemoMerchantSeed;
export declare const demoCustomers: {
    name: string;
    phone: string;
    email: string;
    points_balance: number;
    total_visits: number;
    total_spend: number;
    crm_status: string;
    loyalty_tier: string;
    last_visit_at: string;
}[];
export declare const demoMenuItems: {
    name: string;
    category: string;
    price: number;
    description: string;
}[];
export declare const demoCampaigns: {
    title: string;
    description: string;
    status: string;
    icon: string;
    stat_primary_label: string;
    stat_primary_value: string;
    stat_secondary_label: string;
    stat_secondary_value: string;
}[];
export declare const demoBills: ({
    total_amount: number;
    status: string;
    created_at: string;
    completed_at: string;
    customer_phone: string;
} | {
    total_amount: number;
    status: string;
    created_at: string;
    completed_at: null;
    customer_phone: string;
})[];
//# sourceMappingURL=demoSeed.d.ts.map