import { useNavigate } from 'react-router-dom';
import { FiCheck, FiPrinter } from 'react-icons/fi';
import { useStore } from '../store/store.js';

export function OrderSuccessPage() {
  const navigate = useNavigate();
  const last = useStore((s) => s.lastCheckout);

  if (!last) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-[#f4f6f8] p-6">
        <p className="text-slate-500 text-sm">No order data.</p>
        <button type="button" className="mt-4 text-teal-700 font-semibold" onClick={() => navigate('/pos')}>
          Back to POS
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#f4f6f8] flex flex-col">
      <div className="h-11 bg-slate-900 text-white text-[12px] font-medium flex items-center justify-center gap-2 shrink-0">
        <span aria-hidden>💳</span>
        Order Success — DineFlow
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-6 pb-12">
        <div className="w-full max-w-[400px]">
          <div className="w-[72px] h-[72px] mx-auto rounded-full bg-emerald-500 flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/25 ring-4 ring-emerald-100">
            <FiCheck className="text-white text-4xl stroke-[3]" />
          </div>
          <h1 className="text-[22px] font-extrabold text-center text-slate-900 tracking-tight">Bill Punched Successfully!</h1>
          <p className="text-center text-slate-500 text-[13px] mt-2">Order complete and payment verified.</p>

          <div className="mt-8 df-card p-5 space-y-3">
            <div className="flex justify-between text-[12px]">
              <span className="text-slate-500 font-semibold uppercase tracking-wide">Order #</span>
              <span className="font-extrabold text-slate-900 text-[13px]">{last.orderLabel}</span>
            </div>
            <div className="flex justify-between text-[12px] items-baseline">
              <span className="text-slate-500 font-semibold uppercase tracking-wide">Total Amount</span>
              <span className="font-extrabold text-[20px] text-slate-900">
                ${last.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-[12px] items-center pt-1 border-t border-slate-100">
              <span className="text-slate-500 font-semibold uppercase tracking-wide">Payment Method</span>
              <span className="font-semibold text-slate-800 text-[13px]">
                {last.payment_method} ending in {last.payment_last_four}
              </span>
            </div>
          </div>

          <div className="mt-4 df-card p-4 flex gap-3 items-center border-sky-100 bg-sky-50/60">
            <div className="w-11 h-11 rounded-full bg-sky-200/80 text-sky-900 flex items-center justify-center text-lg">🏷</div>
            <div>
              <div className="font-extrabold text-slate-900 text-[14px]">Earned +{last.pointsEarned} Points</div>
              <div className="text-[12px] text-slate-600 mt-0.5">
                New Balance: {last.newPointsBalance != null ? `${last.newPointsBalance.toLocaleString()} pts` : '—'}
              </div>
            </div>
          </div>

          {last.customerEmail && (
            <p className="text-center text-[12px] text-emerald-700 font-medium mt-4 flex items-center justify-center gap-1.5">
              <span>Receipt sent to {last.customerEmail}</span>
            </p>
          )}
          {!last.customerEmail && last.customerPhone && (
            <p className="text-center text-[12px] text-slate-500 font-medium mt-4 flex items-center justify-center gap-1.5">
              <span>No email on file — receipt not sent</span>
            </p>
          )}

          <button
            type="button"
            onClick={() => navigate('/pos')}
            className="mt-8 w-full py-3.5 rounded-[12px] bg-black text-white font-bold text-[14px] hover:bg-slate-900 shadow-md"
          >
            Next Order
          </button>
          <button
            type="button"
            className="mt-3 w-full py-3 rounded-[12px] border border-slate-200 bg-white text-slate-900 font-semibold text-[13px] inline-flex items-center justify-center gap-2 hover:bg-slate-50"
          >
            <FiPrinter /> Print Physical Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
