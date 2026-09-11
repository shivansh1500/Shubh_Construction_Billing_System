import React from 'react';
import { formatCurrency } from '../../utils';
import { Percent, Tag, Calculator } from 'lucide-react';

export default function BillTotals({ items, discount, setDiscount, taxRate, setTaxRate, taxEnabled, setTaxEnabled, currency = '₹' }) {
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const discountAmt = parseFloat(discount) || 0;
  const afterDiscount = subtotal - discountAmt;
  const taxAmt = taxEnabled ? (afterDiscount * (parseFloat(taxRate) || 0)) / 100 : 0;
  const grandTotal = afterDiscount + taxAmt;

  return (
    <div
      className="rounded-[10px] overflow-hidden"
      style={{ border: '1px solid #2A2F38', background: '#191C21' }}
    >
      {/* Discount row */}
      <div
        className="flex items-center justify-between px-5 py-4 gap-4"
        style={{ borderBottom: '1px solid #2A2F38' }}
      >
        <div className="flex items-center gap-2">
          <Tag size={15} className="text-[#A1A1AA]" />
          <label className="text-sm text-[#A1A1AA]">Discount</label>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#A1A1AA] text-sm">{currency}</span>
          <input
            className="input text-sm text-right py-1.5"
            type="number"
            min="0"
            style={{ width: 120 }}
            placeholder="0.00"
            value={discount}
            onChange={e => setDiscount(e.target.value)}
          />
        </div>
      </div>

      {/* Tax row */}
      <div
        className="flex items-center justify-between px-5 py-4 gap-4"
        style={{ borderBottom: '1px solid #2A2F38' }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Percent size={15} className="text-[#A1A1AA]" />
            <label className="text-sm text-[#A1A1AA]">GST / Tax</label>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => setTaxEnabled(!taxEnabled)}
              className="relative w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0"
              style={{ background: taxEnabled ? '#B8754F' : '#2A2F38' }}
            >
              <div
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                style={{ transform: taxEnabled ? 'translateX(21px)' : 'translateX(2px)' }}
              />
            </div>
            <span className="text-xs text-[#71717A]">{taxEnabled ? 'Enabled' : 'Disabled'}</span>
          </label>
        </div>
        {taxEnabled && (
          <div className="flex items-center gap-2">
            <input
              className="input text-sm text-right py-1.5"
              type="number"
              min="0"
              max="100"
              style={{ width: 80 }}
              value={taxRate}
              onChange={e => setTaxRate(e.target.value)}
            />
            <span className="text-[#A1A1AA] text-sm">%</span>
          </div>
        )}
      </div>

      {/* Totals summary */}
      <div className="px-5 py-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-[#A1A1AA]">Subtotal</span>
          <span className="text-white font-medium">{formatCurrency(subtotal, currency)}</span>
        </div>
        {discountAmt > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-[#A1A1AA]">Discount</span>
            <span className="text-green-400">− {formatCurrency(discountAmt, currency)}</span>
          </div>
        )}
        {taxEnabled && taxAmt > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-[#A1A1AA]">GST ({taxRate}%)</span>
            <span className="text-white">{formatCurrency(taxAmt, currency)}</span>
          </div>
        )}
        <div
          className="flex justify-between items-center pt-3"
          style={{ borderTop: '1px solid #2A2F38' }}
        >
          <div className="flex items-center gap-2">
            <Calculator size={16} className="text-[#B8754F]" />
            <span className="font-semibold text-white">Grand Total</span>
          </div>
          <span className="font-display text-2xl text-white">
            {formatCurrency(grandTotal, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
