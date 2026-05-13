import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, getTaxAmount } from '../store/store.js';
import api from '../services/api.js';
import {
  FiSearch,
  FiPlus,
  FiMinus,
  FiTrash2,
  FiBell,
  FiArrowLeft,
  FiPercent,
  FiUserPlus,
  FiPause,
  FiMenu,
  FiCreditCard,
  FiCamera,
} from 'react-icons/fi';

const ADDON_LINES = [
  { label: 'Extra Cheese', price: '+$2.00' },
  { label: 'Garlic Dip', price: '+$1.50' },
  { label: 'Chili Flakes', price: 'Free' },
];

export function POSPage() {
  const navigate = useNavigate();
  const token = useStore((s) => s.token);
  const merchantName = useStore((s) => s.merchantName);
  const clearAuth = useStore((s) => s.clearAuth);
  const currentBillItems = useStore((s) => s.currentBillItems);
  const subtotal = useStore((s) => s.subtotal);
  const taxRate = useStore((s) => s.taxRate);
  const pointsRate = useStore((s) => s.pointsRate);
  const selectedCustomer = useStore((s) => s.selectedCustomer);
  const addBillItem = useStore((s) => s.addBillItem);
  const removeBillItem = useStore((s) => s.removeBillItem);
  const updateBillItemQuantity = useStore((s) => s.updateBillItemQuantity);
  const setSelectedCustomer = useStore((s) => s.setSelectedCustomer);
  const clearBill = useStore((s) => s.clearBill);
  const tableRef = useStore((s) => s.tableRef);
  const setTableRef = useStore((s) => s.setTableRef);
  const orderType = useStore((s) => s.orderType);
  const setLastCheckout = useStore((s) => s.setLastCheckout);
  const setTaxRate = useStore((s) => s.setTaxRate);
  const setPointsRate = useStore((s) => s.setPointsRate);

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [chip, setChip] = useState('all');
  const [phoneSearch, setPhoneSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [tables, setTables] = useState<{ id: string; label: string }[]>([]);
  const [displayOrder, setDisplayOrder] = useState('');
  const [navOpen, setNavOpen] = useState(false);
  const [cartExpanded, setCartExpanded] = useState(false);
  const [addonNotification, setAddonNotification] = useState<string | null>(null);
  const [lastItemMenuId, setLastItemMenuId] = useState<string | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [showRecentOrders, setShowRecentOrders] = useState(false);
  const [showNewCustModal, setShowNewCustModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountPct, setDiscountPct] = useState(0);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustTelegram, setNewCustTelegram] = useState('');
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const headerSearchRef = useRef<HTMLInputElement>(null);

  const taxAmount = useMemo(() => getTaxAmount(subtotal, taxRate), [subtotal, taxRate]);
  const preDiscountTotal = useMemo(() => Math.round((subtotal + taxAmount) * 100) / 100, [subtotal, taxAmount]);
  const discountAmount = useMemo(() => Math.round(preDiscountTotal * discountPct) / 100, [preDiscountTotal, discountPct]);
  const grandTotal = useMemo(() => Math.round((preDiscountTotal - discountAmount) * 100) / 100, [preDiscountTotal, discountAmount]);
  const estimatedPoints = useMemo(() => Math.floor(grandTotal * (pointsRate / 100)), [grandTotal, pointsRate]);

  // Max discount % based on customer points: 100 pts = 1%, capped at 10% (1000 pts)
  const maxDiscountPct = useMemo(() => {
    const pts = selectedCustomer?.points_balance ?? 0;
    return Math.min(Math.floor(pts / 100), 10);
  }, [selectedCustomer]);

  useEffect(() => {
    if (currentBillItems.length === 0) {
      setDisplayOrder('');
    } else if (!displayOrder) {
      setDisplayOrder(`#${4050 + Math.floor(Math.random() * 80)}`);
    }
  }, [currentBillItems.length, displayOrder]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    (async () => {
      try {
        const [menuRes, tRes, profileRes] = await Promise.all([
          api.getMenu(),
          api.getV1Tables().catch(() => ({ data: { tables: [] } })),
          api.getMerchantProfile().catch(() => ({ data: { tax_rate: 0.085, points_rate: 5 } })),
        ]);
        const items = menuRes.data;
        setMenuItems(items);
        const cats = Array.from(new Set(items.map((i: any) => String(i.category ?? '')).filter(Boolean))) as string[];
        setCategories(cats);
        setActiveCategory(cats[0] || '');
        setTables(tRes.data?.tables || []);
        
        // Load tax rate and points rate from merchant profile
        const taxRateFromProfile = profileRes.data?.tax_rate ?? 0.085;
        setTaxRate(Number(taxRateFromProfile));
        const pointsRateFromProfile = profileRes.data?.points_rate ?? 5;
        setPointsRate(Number(pointsRateFromProfile));
      } catch {
        setError('Failed to load menu');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, navigate, setTaxRate, setPointsRate]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const { data } = await api.getBills('completed', 10, 0);
        setRecentOrders(data || []);
      } catch {
        // Silently fail for recent orders
      }
    })();
  }, [token]);

  const filteredProducts = useMemo(() => {
    let list = activeCategory ? menuItems.filter((i) => i.category === activeCategory) : menuItems;
    if (chip !== 'all') {
      list = list.filter((i) => {
        const category = (i.category || '').toLowerCase();
        if (chip === 'vegetarian') {
          return category.includes('veg');
        }
        if (chip === 'non-veg') {
          return category.includes('non veg') || category.includes('non-veg');
        }
        return true;
      });
    }
    return list;
  }, [menuItems, activeCategory, chip]);

  const categoryCount = (c: string) => menuItems.filter((i) => i.category === c).length;

  const chips = useMemo(() => {
    const base = ['all', 'vegetarian', 'non-veg'];
    return base;
  }, []);

  const handleAddItemWithTracking = (item: any) => {
    addBillItem(item);
    setLastItemMenuId(item.id);
  };

  const handleAddAddon = (addonLabel: string) => {
    if (!lastItemMenuId || currentBillItems.length === 0) {
      setAddonNotification('Add an item first to add addons');
      setTimeout(() => setAddonNotification(null), 2000);
      return;
    }
    
    const lastItem = currentBillItems[currentBillItems.length - 1];
    if (lastItem.menu_item_id === lastItemMenuId) {
      const currentModifiers = lastItem.modifiers || [];
      if (!currentModifiers.includes(addonLabel)) {
        updateBillItemQuantity(lastItem.menu_item_id, lastItem.quantity);
        lastItem.modifiers = [...currentModifiers, addonLabel];
      }
      setAddonNotification(`Added ${addonLabel} to order`);
      setTimeout(() => setAddonNotification(null), 1500);
    }
  };

  const handleSearchCustomer = useCallback(async (query?: string) => {
    const q = (query ?? phoneSearch).trim();
    if (!q) {
      setCustomerResults([]);
      setSelectedCustomer(null);
      return;
    }
    try {
      const list = await api.searchCustomersQuery(q);
      if (Array.isArray(list) && list.length > 0) {
        setCustomerResults(list);
      } else {
        setCustomerResults([]);
      }
    } catch {
      setError('Search failed');
    }
  }, [phoneSearch, setSelectedCustomer]);

  // Debounced search — prevents cursor deactivation on every keystroke
  const handlePhoneSearchChange = useCallback((val: string) => {
    setPhoneSearch(val);
    setSelectedCustomer(null);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (val.trim().length >= 2) {
      searchTimerRef.current = setTimeout(() => {
        handleSearchCustomer(val);
      }, 400);
    } else {
      setCustomerResults([]);
    }
  }, [handleSearchCustomer, setSelectedCustomer]);

  const handleAddNewCustomer = async () => {
    if (!newCustName.trim() || !newCustPhone.trim()) {
      setError('Name and phone are required');
      return;
    }
    try {
      const { data } = await api.createCustomer(newCustName.trim(), newCustPhone.trim(), newCustEmail.trim() || undefined, newCustTelegram.trim() || undefined);
      setSelectedCustomer(data);
      setPhoneSearch('');
      setShowNewCustModal(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustEmail('');
      setNewCustTelegram('');
      setCustomerResults([]);
    } catch {
      setError('Could not create customer');
    }
  };

  const openDiscountModal = () => {
    if (!selectedCustomer) {
      setError('Select a customer first to apply points discount');
      return;
    }
    if (maxDiscountPct <= 0) {
      setError('Customer needs at least 100 points to get a discount');
      return;
    }
    setShowDiscountModal(true);
  };

  const applyDiscount = (pct: number) => {
    const pts = pct * 100;
    setDiscountPct(pct);
    setPointsToRedeem(pts);
    setShowDiscountModal(false);
  };

  const removeDiscount = () => {
    setDiscountPct(0);
    setPointsToRedeem(0);
  };

  const punch = async () => {
    if (currentBillItems.length === 0) {
      setError('Cart is empty');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const order_label = `ORD-${Date.now().toString(36).toUpperCase().slice(-6)}`;
      const { data: bill } = await api.createBill({
        customerId: selectedCustomer?.id || null,
        items: currentBillItems,
        subtotal,
        taxRate,
        taxAmount,
        totalAmount: grandTotal,
        order_type: orderType,
        table_ref: tableRef,
        order_label,
      });
      const punchRes = await api.punchBill(bill.id, {
        payment_method: 'Visa',
        payment_last_four: '4242',
        points_redeemed: pointsToRedeem,
        discount_amount: discountAmount,
      });
      const pdata = punchRes.data;
      setLastCheckout({
        billId: bill.id,
        orderLabel: order_label,
        total: grandTotal,
        payment_method: 'Visa',
        payment_last_four: '4242',
        pointsEarned: pdata.pointsEarned ?? estimatedPoints,
        newPointsBalance: pdata.newPointsBalance ?? pdata.customer?.points_balance,
        customerPhone: pdata.customer?.phone || selectedCustomer?.phone,
        customerEmail: pdata.customer?.email || selectedCustomer?.email,
      });
      clearBill();
      setPhoneSearch('');
      setDisplayOrder('');
      setDiscountPct(0);
      setPointsToRedeem(0);
      navigate('/pos/success');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Could not complete order');
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    clearAuth();
    navigate('/login');
  };

  if (!token) return null;

  const initials = (merchantName || 'U').slice(0, 2).toUpperCase();

  const renderCategoryNav = (mobile: boolean = false) => (
    <nav
      className={`${
        mobile
          ? 'p-3 flex flex-col gap-1'
          : 'lg:w-[220px] shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-[var(--df-border)] flex lg:flex-col overflow-x-auto lg:overflow-y-auto lg:min-h-0'
      }`}
    >
      <div className={`${mobile ? '' : 'lg:p-3'} flex lg:flex-col gap-1 p-2`}>
        {categories.map((c) => {
          const active = activeCategory === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => {
                setActiveCategory(c);
                setChip('all');
                setNavOpen(false);
              }}
              className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-[12px] text-[13px] font-semibold whitespace-nowrap lg:w-full transition-colors ${
                active
                  ? 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/80'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{c}</span>
              <span
                className={`text-[11px] font-bold tabular-nums px-1.5 py-0.5 rounded-md ${
                  active ? 'bg-emerald-200/60 text-emerald-900' : 'bg-slate-100 text-slate-400'
                }`}
              >
                {categoryCount(c)}
              </span>
            </button>
          );
        })}
      </div>
      {!mobile && (
        <div className="hidden lg:block mt-auto p-3 border-t border-slate-100 text-[12px] text-slate-500 space-y-1">
          <button type="button" onClick={() => navigate('/dashboard')} className="block w-full text-left py-1.5 hover:text-slate-800 font-medium">
            Dashboard
          </button>
          <button type="button" onClick={() => setShowRecentOrders(!showRecentOrders)} className="block w-full text-left py-1.5 hover:text-slate-800 font-medium">
            Recent Orders {showRecentOrders ? '▼' : '▶'}
          </button>
          {showRecentOrders && recentOrders.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-200 space-y-1 max-h-40 overflow-y-auto">
              {recentOrders.slice(0, 5).map((bill: any) => (
                <div key={bill.id} className="text-[11px] bg-emerald-50 p-2 rounded border border-emerald-200">
                  <div className="font-bold text-emerald-900">Order #{bill.id?.slice(-4) || '?'}</div>
                  <div className="text-emerald-700">${Number(bill.total_amount || 0).toFixed(2)}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {new Date(bill.completed_at || bill.created_at).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
          <button type="button" onClick={logout} className="block w-full text-left py-1.5 text-rose-600 font-medium">
            Sign out
          </button>
        </div>
      )}
    </nav>
  );

  const renderCartPanel = (compact: boolean = false) => (
    <div className={`flex flex-col bg-white ${compact ? 'rounded-t-2xl border border-b-0 border-slate-200 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]' : 'lg:border-l border-[var(--df-border)] lg:w-[360px] shrink-0 lg:h-[calc(100dvh-56px)]'}`}>
      <div className={`p-4 border-b border-slate-100 flex justify-between items-start ${compact ? 'pt-3' : ''}`}>
        <div>
          <h2 className="font-bold text-slate-900 text-[15px]">Current Order</h2>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Order {displayOrder || '—'} · <span className="capitalize">{orderType.replace('-', ' ')}</span>
          </p>
        </div>
        <button type="button" onClick={() => clearBill()} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg" aria-label="Clear order">
          <FiTrash2 />
        </button>
      </div>

      <div className="p-4 border-b border-slate-100 space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              ref={searchInputRef}
              className="w-full pl-9 pr-3 py-2 rounded-full bg-slate-100 border-0 text-[12px]"
              placeholder="Search by phone or name…"
              value={phoneSearch}
              onChange={(e) => handlePhoneSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchCustomer()}
            />
          </div>
        </div>
        {/* Search results dropdown */}
        {!selectedCustomer && customerResults.length > 0 && (
          <div className="rounded-[12px] border border-slate-200 bg-white shadow-sm overflow-hidden">
            {customerResults.map((c: any) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedCustomer(c);
                  setCustomerResults([]);
                  setPhoneSearch(c.phone || c.name || '');
                }}
                className="w-full text-left px-3 py-2.5 text-[12px] hover:bg-slate-50 border-b border-slate-100 last:border-0"
              >
                <div className="font-semibold text-slate-900">{c.name}</div>
                <div className="text-slate-500">{c.phone}{c.email ? ` · ${c.email}` : ''}</div>
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => { setNewCustPhone(phoneSearch); setShowNewCustModal(true); }}
          className="w-full py-2 text-[12px] font-semibold border border-slate-200 rounded-[10px] hover:bg-slate-50"
        >
          + New Customer
        </button>
        {selectedCustomer && (
          <div className="rounded-[12px] bg-emerald-50/80 border border-emerald-100 p-3 text-[12px]">
            <div className="font-bold text-emerald-950">{selectedCustomer.name}</div>
            <div className="text-emerald-800/90">{selectedCustomer.phone}</div>
            {selectedCustomer.email && (
              <div className="text-emerald-800/90">{selectedCustomer.email}</div>
            )}
            <div className="flex gap-4 mt-2 text-[11px] text-emerald-900">
              <span>
                Visits <b>{selectedCustomer.total_visits ?? 0}</b>
              </span>
              <span>
                Points <b className="text-emerald-700">{selectedCustomer.points_balance ?? 0}</b>
              </span>
            </div>
          </div>
        )}
        {!selectedCustomer && phoneSearch && customerResults.length === 0 && (
          <p className="text-[11px] text-slate-500">No match — tap + New Customer</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[120px] max-h-[40vh] lg:max-h-none">
        {currentBillItems.length === 0 ? (
          <p className="text-center text-slate-400 text-[13px] py-10">Add items from the menu</p>
        ) : (
          currentBillItems.map((item) => (
            <div key={item.menu_item_id} className="rounded-[12px] border border-slate-100 p-3 bg-slate-50/40">
              <div className="flex justify-between gap-2">
                <span className="font-semibold text-[13px] text-slate-900">{item.item_name}</span>
                <span className="text-[13px] font-bold text-slate-900">${item.subtotal.toFixed(2)}</span>
              </div>
              {item.modifiers?.length ? <div className="text-[11px] text-sky-700 mt-1">{item.modifiers.join(' · ')}</div> : null}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm"
                    onClick={() => updateBillItemQuantity(item.menu_item_id, item.quantity - 1)}
                  >
                    <FiMinus size={14} />
                  </button>
                  <span className="w-7 text-center text-[13px] font-bold">{item.quantity}</span>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm"
                    onClick={() => updateBillItemQuantity(item.menu_item_id, item.quantity + 1)}
                  >
                    <FiPlus size={14} />
                  </button>
                </div>
                <button type="button" onClick={() => removeBillItem(item.menu_item_id)} className="text-[11px] font-semibold text-rose-600">
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-slate-100 space-y-2 bg-[#f8fafc] mt-auto">
        <div className="flex justify-between text-[13px] text-slate-600">
          <span>Subtotal</span>
          <span className="font-medium">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[13px] text-slate-600">
          <span>Tax ({(taxRate * 100).toFixed(1)}%)</span>
          <span className="font-medium">${taxAmount.toFixed(2)}</span>
        </div>
        {discountPct > 0 && (
          <div className="flex justify-between text-[13px] text-emerald-700">
            <span>Discount ({discountPct}% · {pointsToRedeem} pts)</span>
            <span className="font-medium">-${discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-[18px] font-bold text-slate-900 pt-1">
          <span>Total</span>
          <span>${grandTotal.toFixed(2)}</span>
        </div>
        <div className="text-[11px] text-center text-emerald-800 font-semibold bg-emerald-100/80 rounded-[10px] py-2 border border-emerald-200/60">
          +{estimatedPoints} pts earned on punch ({pointsRate}% of bill)
        </div>
        <div className="flex gap-2">
          {discountPct > 0 ? (
            <button
              type="button"
              onClick={removeDiscount}
              className="flex-1 py-2.5 rounded-[10px] border border-emerald-200 bg-emerald-50 text-[11px] font-bold text-emerald-700 flex items-center justify-center gap-1"
            >
              <FiPercent size={14} /> {discountPct}% Applied ✕
            </button>
          ) : (
            <button
              type="button"
              onClick={openDiscountModal}
              className="flex-1 py-2.5 rounded-[10px] border border-slate-200 bg-white text-[11px] font-bold text-slate-600 flex items-center justify-center gap-1 hover:bg-slate-50"
            >
              <FiPercent size={14} /> Discount
            </button>
          )}
          <button
            type="button"
            className="flex-1 py-2.5 rounded-[10px] border border-slate-200 bg-white text-[11px] font-bold text-slate-600 flex items-center justify-center gap-1"
          >
            <FiUserPlus size={14} /> Add Guest
          </button>
        </div>
        <button
          type="button"
          disabled={busy || currentBillItems.length === 0}
          onClick={punch}
          className="w-full py-3.5 rounded-[12px] df-punch disabled:opacity-45 text-[14px] font-bold tracking-wide flex items-center justify-center gap-2 shadow-lg"
        >
          <FiCreditCard className="text-lg opacity-90" />
          {busy ? 'Processing…' : 'PUNCH BILL'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-[#eef1f4] text-slate-900 flex flex-col">
      {/* New Customer Modal */}
      {showNewCustModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add New Customer</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Customer Name</label>
                <input
                  className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-sm"
                  placeholder="e.g., Priya Sharma"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
                <input
                  className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-sm"
                  placeholder="e.g., +91 90000 10001"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                <input
                  className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-sm"
                  placeholder="e.g., customer@example.com"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Telegram Chat ID <span className="font-normal text-slate-400">(optional)</span></label>
                <input
                  className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-sm"
                  placeholder="e.g., 123456789"
                  value={newCustTelegram}
                  onChange={(e) => setNewCustTelegram(e.target.value)}
                />
                <p className="text-[10px] text-slate-400 mt-1">Customer sends /start to your bot, bot shows their Chat ID</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowNewCustModal(false); setNewCustName(''); setNewCustPhone(''); setNewCustEmail(''); setNewCustTelegram(''); }}
                  className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddNewCustomer}
                  className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700"
                >
                  Add Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Redeem Points for Discount</h2>
            <p className="text-[13px] text-slate-500 mb-4">
              {selectedCustomer?.name} has <b className="text-emerald-700">{selectedCustomer?.points_balance ?? 0} points</b>.
              <br />100 points = 1% discount, max 10% (1000 pts).
            </p>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {Array.from({ length: maxDiscountPct }, (_, i) => i + 1).map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => applyDiscount(pct)}
                  className="py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-[13px] font-bold hover:bg-emerald-100 transition"
                >
                  {pct}%
                </button>
              ))}
            </div>
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-4">
              Points exceeding 1000 without redemption will expire. Use them before they're gone!
            </p>
            <button
              type="button"
              onClick={() => setShowDiscountModal(false)}
              className="w-full py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {/* Desktop / tablet header */}
      <header className="shrink-0 h-14 bg-white border-b border-[var(--df-border)] flex items-center gap-2 sm:gap-3 px-3 sm:px-5">
        <button type="button" className="lg:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setNavOpen(true)} aria-label="Menu">
          <FiMenu className="text-lg" />
        </button>
        <button type="button" onClick={() => navigate('/dashboard')} className="p-2 rounded-lg hover:bg-slate-100 hidden sm:inline-flex">
          <FiArrowLeft />
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">D</span>
          <div className="font-bold text-slate-900 text-[15px] leading-none">
            DineFlow <span className="text-slate-400 font-normal text-[12px]">Terminal 1</span>
          </div>
        </div>
        <select
          className="ml-1 text-[12px] font-semibold border border-slate-200 rounded-[10px] px-2 py-1.5 bg-white min-w-[4.5rem]"
          value={tableRef}
          onChange={(e) => setTableRef(e.target.value)}
        >
          {(tables.length ? tables : [{ id: 'T-12', label: 'T-12' }]).map((t) => (
            <option key={t.id} value={t.label}>
              {t.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-[10px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
        >
          <FiPause /> Hold Order
        </button>
        <div className="flex-1 max-w-xl hidden md:block min-w-0">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              ref={headerSearchRef}
              className="w-full pl-9 pr-3 py-2 rounded-full bg-slate-100 border-0 text-[12px]"
              placeholder="Search by phone or name…"
              value={phoneSearch}
              onChange={(e) => handlePhoneSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchCustomer()}
            />
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1 sm:gap-2 shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Live Sync
          </span>
          <button type="button" className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
            <FiBell />
          </button>
          <div className="w-9 h-9 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-white shadow">
            {initials}
          </div>
        </div>
      </header>

      {/* Mobile title row */}
      <div className="lg:hidden relative flex items-center justify-center gap-2 py-2.5 bg-white border-b border-slate-100">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="text-[15px] font-bold text-slate-900">Billing</span>
        <button
          type="button"
          className="absolute right-2 p-2 rounded-full bg-slate-100 text-slate-600"
          onClick={() => navigate('/customers')}
          aria-label="Customers"
        >
          <FiSearch />
        </button>
      </div>

      <div className="flex-1 flex min-h-0 flex-col lg:flex-row relative">
        <div className={`fixed inset-0 z-50 bg-black/40 lg:hidden transition-opacity ${navOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setNavOpen(false)} />
        <div
          className={`fixed z-50 top-0 left-0 bottom-0 w-[260px] bg-white shadow-2xl transform transition-transform lg:hidden ${
            navOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {renderCategoryNav(true)}
        </div>

        <div className="hidden lg:block">
          {renderCategoryNav()}
        </div>

        <section className="flex-1 min-w-0 overflow-auto p-4 lg:p-6 pb-28 lg:pb-6">
          {error && <div className="mb-3 text-[12px] text-rose-700 bg-rose-50 border border-rose-100 rounded-[10px] px-3 py-2">{error}</div>}

          <div className="flex items-center gap-2 mb-3 lg:hidden">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              Table {tableRef}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Order {displayOrder || '—'}</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
            {chips.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setChip(c)}
                className={`shrink-0 px-4 py-2 rounded-full text-[12px] font-bold capitalize ${
                  chip === c ? 'bg-slate-900 text-white shadow' : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                {c === 'all' ? `All ${activeCategory || 'Menu'}` : c}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-slate-500 text-sm">Loading menu…</div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredProducts.map((item: any) => {
                const soldOut = (item.stock_qty ?? 1) <= 0;
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-[16px] border border-slate-100 shadow-sm overflow-hidden flex flex-col ${soldOut ? 'opacity-60' : ''}`}
                  >
                    <div className="relative h-[120px] lg:h-36 bg-slate-100 group">
                      {item.image_url && !soldOut ? (
                        <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl opacity-35">🍽️</div>
                      )}
                      {soldOut && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                          <span className="text-[11px] font-bold bg-white px-3 py-1 rounded-full shadow border">Sold Out</span>
                        </div>
                      )}
                      {/* Camera upload button — only shown to authenticated merchant on hover */}
                      {token && (
                        <label
                          title="Upload photo"
                          className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                        >
                          <FiCamera className="text-[13px]" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              e.target.value = '';
                              // Resize to max 800px before uploading
                              const resized = await new Promise<string>((resolve) => {
                                const img = new Image();
                                const url = URL.createObjectURL(file);
                                img.onload = () => {
                                  const MAX = 800;
                                  let { width, height } = img;
                                  if (width > MAX || height > MAX) {
                                    if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
                                    else { width = Math.round(width * MAX / height); height = MAX; }
                                  }
                                  const canvas = document.createElement('canvas');
                                  canvas.width = width; canvas.height = height;
                                  canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
                                  URL.revokeObjectURL(url);
                                  resolve(canvas.toDataURL('image/jpeg', 0.82));
                                };
                                img.src = url;
                              });
                              try {
                                await api.uploadMenuItemImage(item.id, resized, file.name);
                                setMenuItems((prev: any[]) =>
                                  prev.map((p: any) => p.id === item.id ? { ...p, image_url: resized } : p)
                                );
                              } catch (err: any) {
                                alert('Image upload failed: ' + (err?.response?.data?.error || err?.message || 'Unknown error'));
                              }
                            }}
                          />
                        </label>
                      )}
                      <span className="absolute top-2 right-2 bg-white/95 text-slate-900 text-[11px] font-extrabold px-2 py-1 rounded-lg shadow-sm border border-slate-100">
                        ${Number(item.price).toFixed(2)}
                      </span>
                    </div>
                    <div className="p-3 flex-1 flex flex-col">
                      <h3 className="font-bold text-slate-900 text-[13px] leading-snug">{item.name}</h3>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 flex-1">{item.description || item.category}</p>
                      <button
                        type="button"
                        disabled={soldOut}
                        onClick={() => !soldOut && handleAddItemWithTracking(item)}
                        className="mt-3 w-full py-2.5 rounded-[10px] bg-slate-900 text-white text-[11px] font-bold hover:bg-black disabled:opacity-40"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Quick add-ons</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {ADDON_LINES.map((x) => (
                <button
                  key={x.label}
                  type="button"
                  onClick={() => handleAddAddon(x.label)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-emerald-200 bg-white text-[11px] font-bold text-emerald-900 hover:bg-emerald-50/80 active:bg-emerald-100 transition"
                >
                  <span className="text-emerald-600">
                    <FiPlus className="inline" />
                  </span>
                  {x.label} <span className="text-emerald-700">{x.price}</span>
                </button>
              ))}
            </div>
            {addonNotification && (
              <div className="mt-2 text-xs text-emerald-700 font-semibold bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                {addonNotification}
              </div>
            )}
          </div>
        </section>

        <div className="hidden lg:flex lg:flex-col lg:shrink-0">
          {renderCartPanel()}
        </div>
      </div>

      {/* Mobile bottom sheet */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30">
        {!cartExpanded && (
          <button
            type="button"
            onClick={() => setCartExpanded(true)}
            className="w-full df-card !rounded-b-none border-b-0 px-4 py-3 flex items-center justify-between"
          >
            <div className="text-left">
              <div className="text-[10px] font-bold uppercase text-slate-400">Current Tab</div>
              <div className="text-[14px] font-bold text-slate-900">
                {currentBillItems.length} items · <span className="text-emerald-700">In Progress</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase text-slate-400">Subtotal</div>
              <div className="text-[18px] font-black text-slate-900">${subtotal.toFixed(2)}</div>
            </div>
          </button>
        )}
        {cartExpanded && (
          <div className="bg-slate-200/80 px-3 py-2 flex justify-center">
            <button type="button" className="text-[11px] font-bold text-slate-600" onClick={() => setCartExpanded(false)}>
              Tap to minimize
            </button>
          </div>
        )}
        <div className={`${cartExpanded ? 'max-h-[80dvh] overflow-y-auto' : 'max-h-0 overflow-hidden'}`}>
          {cartExpanded && renderCartPanel(true)}
        </div>
        {!cartExpanded && (
          <button
            type="button"
            disabled={busy || currentBillItems.length === 0}
            onClick={punch}
            className="w-full df-punch py-4 flex items-center justify-center gap-2 text-[14px] font-bold disabled:opacity-40"
          >
            <FiCreditCard /> Punch Bill &amp; Pay
          </button>
        )}
      </div>
    </div>
  );
}
