import { create } from 'zustand';

export interface BillItem {
  menu_item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  subtotal: number;
  modifiers?: string[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  points_balance?: number;
  total_visits?: number;
  total_spend?: number;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  image_url?: string;
  stock_qty?: number;
}

export interface CheckoutResult {
  billId: string;
  orderLabel: string;
  total: number;
  payment_method?: string;
  payment_last_four?: string;
  pointsEarned: number;
  newPointsBalance?: number;
  customerPhone?: string;
  customerEmail?: string;
}

interface StoreState {
  token: string | null;
  merchantId: string | null;
  merchantName: string | null;

  currentBillItems: BillItem[];
  selectedCustomer: Customer | null;
  /** Sum of line subtotals (pre-tax) */
  subtotal: number;
  taxRate: number;
  /** Loyalty points percentage (e.g. 5 means 5% of bill becomes points) */
  pointsRate: number;
  tableRef: string;
  orderType: string;
  orderLabel: string;

  lastCheckout: CheckoutResult | null;

  isLoading: boolean;
  error: string | null;

  setToken: (token: string, merchantId: string, merchantName: string) => void;
  clearAuth: () => void;
  addBillItem: (item: MenuItem, modifiers?: string[]) => void;
  removeBillItem: (menuItemId: string) => void;
  updateBillItemQuantity: (menuItemId: string, quantity: number) => void;
  setSelectedCustomer: (customer: Customer | null) => void;
  clearBill: () => void;
  setTableRef: (ref: string) => void;
  setOrderType: (t: string) => void;
  setLastCheckout: (r: CheckoutResult | null) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  setTaxRate: (rate: number) => void;
  setPointsRate: (rate: number) => void;
}

const DEFAULT_TAX = 0.085;
const DEFAULT_POINTS_RATE = 5;

export const useStore = create<StoreState>((set) => ({
  token: localStorage.getItem('token'),
  merchantId: localStorage.getItem('merchantId'),
  merchantName: localStorage.getItem('merchantName'),
  currentBillItems: [],
  selectedCustomer: null,
  subtotal: 0,
  taxRate: Number(localStorage.getItem('taxRate')) || DEFAULT_TAX,
  pointsRate: Number(localStorage.getItem('pointsRate')) || DEFAULT_POINTS_RATE,
  tableRef: 'T-12',
  orderType: 'dine-in',
  orderLabel: '',
  lastCheckout: null,
  isLoading: false,
  error: null,

  setToken: (token: string, merchantId: string, merchantName: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('merchantId', merchantId);
    localStorage.setItem('merchantName', merchantName);
    set({ token, merchantId, merchantName });
  },

  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('merchantId');
    localStorage.removeItem('merchantName');
    localStorage.removeItem('taxRate');
    localStorage.removeItem('pointsRate');
    set({
      token: null,
      merchantId: null,
      merchantName: null,
      currentBillItems: [],
      selectedCustomer: null,
      lastCheckout: null,
      subtotal: 0,
      taxRate: DEFAULT_TAX,
      pointsRate: DEFAULT_POINTS_RATE,
    });
  },

  addBillItem: (item: MenuItem, modifiers: string[] = []) => {
    set((state) => {
      const existing = state.currentBillItems.find((bi) => bi.menu_item_id === item.id);
      let newItems: BillItem[];

      if (existing) {
        newItems = state.currentBillItems.map((bi) =>
          bi.menu_item_id === item.id
            ? {
                ...bi,
                quantity: bi.quantity + 1,
                subtotal: (bi.quantity + 1) * bi.price,
              }
            : bi
        );
      } else {
        newItems = [
          ...state.currentBillItems,
          {
            menu_item_id: item.id,
            item_name: item.name,
            price: item.price,
            quantity: 1,
            subtotal: item.price,
            modifiers: modifiers.length ? modifiers : undefined,
          },
        ];
      }

      const sub = newItems.reduce((sum, x) => sum + x.subtotal, 0);
      return { currentBillItems: newItems, subtotal: sub };
    });
  },

  removeBillItem: (menuItemId: string) => {
    set((state) => {
      const newItems = state.currentBillItems.filter((item) => item.menu_item_id !== menuItemId);
      const sub = newItems.reduce((sum, x) => sum + x.subtotal, 0);
      return { currentBillItems: newItems, subtotal: sub };
    });
  },

  updateBillItemQuantity: (menuItemId: string, quantity: number) => {
    set((state) => {
      if (quantity <= 0) {
        return state;
      }

      const newItems = state.currentBillItems.map((item) =>
        item.menu_item_id === menuItemId
          ? { ...item, quantity, subtotal: quantity * item.price }
          : item
      );

      const sub = newItems.reduce((sum, x) => sum + x.subtotal, 0);
      return { currentBillItems: newItems, subtotal: sub };
    });
  },

  setSelectedCustomer: (customer: Customer | null) => {
    set({ selectedCustomer: customer });
  },

  setTableRef: (tableRef: string) => set({ tableRef }),
  setOrderType: (orderType: string) => set({ orderType }),

  clearBill: () => {
    set({
      currentBillItems: [],
      selectedCustomer: null,
      subtotal: 0,
      orderLabel: '',
    });
  },

  setLastCheckout: (lastCheckout: CheckoutResult | null) => set({ lastCheckout }),

  setError: (error: string | null) => {
    set({ error });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setTaxRate: (rate: number) => {
    localStorage.setItem('taxRate', String(rate));
    set({ taxRate: rate });
  },

  setPointsRate: (rate: number) => {
    localStorage.setItem('pointsRate', String(rate));
    set({ pointsRate: rate });
  },
}));

export function getBillSubtotal(items: BillItem[]) {
  return items.reduce((s, i) => s + i.subtotal, 0);
}

export function getTaxAmount(subtotal: number, rate: number) {
  return Math.round(subtotal * rate * 100) / 100;
}
