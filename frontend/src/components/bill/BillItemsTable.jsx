import React, { useEffect, useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { formatCurrency } from '../../utils';

const UNITS = ['Bag', 'Ton', 'Kg', 'Meter', 'Sq.ft', 'Cu.ft', 'No.s', 'Lot', 'Day', 'Hour', 'Trip', 'Load', 'Bundle', 'Sheet', 'Litre', 'Drum'];

function BillItemRow({ item, index, onChange, onRemove }) {
  function handleChange(field, value) {
    const updated = { ...item, [field]: value };
    if (field === 'quantity' || field === 'rate') {
      const q = parseFloat(updated.quantity) || 0;
      const r = parseFloat(updated.rate) || 0;
      updated.amount = q * r;
    }
    onChange(index, updated);
  }

  return (
    <tr className="group hover:bg-[#22262E] transition-colors">
      <td className="px-3 py-3 text-center">
        <span className="text-xs text-[#71717A]" style={{ fontFamily: 'JetBrains Mono' }}>
          {index + 1}
        </span>
      </td>
      <td className="px-3 py-2">
        <input
          className="input text-sm py-2"
          placeholder="Item description..."
          value={item.description}
          onChange={e => handleChange('description', e.target.value)}
        />
      </td>
      <td className="px-3 py-2" style={{ width: 90 }}>
        <input
          className="input text-sm py-2 text-center"
          type="number"
          min="0"
          placeholder="0"
          value={item.quantity}
          onChange={e => handleChange('quantity', e.target.value)}
        />
      </td>
      <td className="px-3 py-2" style={{ width: 110 }}>
        <select
          className="input text-sm py-2"
          value={item.unit}
          onChange={e => handleChange('unit', e.target.value)}
        >
          {UNITS.map(u => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2" style={{ width: 120 }}>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] text-sm">₹</span>
          <input
            className="input text-sm py-2 pl-7"
            type="number"
            min="0"
            placeholder="0"
            value={item.rate}
            onChange={e => handleChange('rate', e.target.value)}
          />
        </div>
      </td>
      <td className="px-3 py-2 text-right" style={{ width: 130 }}>
        <span className="text-sm font-semibold text-white">
          {formatCurrency(item.amount)}
        </span>
      </td>
      <td className="px-3 py-2 text-center" style={{ width: 50 }}>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="btn btn-ghost btn-sm text-[#71717A] hover:text-red-400 p-1.5 rounded-[6px] opacity-0 group-hover:opacity-100 transition-all"
          title="Remove item"
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
}

export default function BillItemsTable({ items, onChange }) {
  function handleItemChange(index, updated) {
    const newItems = [...items];
    newItems[index] = updated;
    onChange(newItems);
  }

  function addItem() {
    onChange([
      ...items,
      { description: '', quantity: '', unit: 'Bag', rate: '', amount: 0 },
    ]);
  }

  function removeItem(index) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div>
      {/* Table header */}
      <div className="table-container mb-0 rounded-b-none">
        <table className="table">
          <thead>
            <tr>
              <th className="text-center" style={{ width: 40 }}>#</th>
              <th>Item / Description</th>
              <th className="text-center" style={{ width: 90 }}>Qty</th>
              <th style={{ width: 110 }}>Unit</th>
              <th style={{ width: 120 }}>Rate</th>
              <th className="text-right" style={{ width: 130 }}>Amount</th>
              <th style={{ width: 50 }}></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-[#71717A] text-sm">
                  No items added yet. Click "+ Add Item" below to start.
                </td>
              </tr>
            ) : (
              items.map((item, i) => (
                <BillItemRow
                  key={i}
                  item={item}
                  index={i}
                  onChange={handleItemChange}
                  onRemove={removeItem}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add item button */}
      <div
        className="rounded-b-[10px]"
        style={{ background: '#191C21', border: '1px solid #2A2F38', borderTop: 'none', padding: '12px 16px' }}
      >
        <button
          type="button"
          className="btn btn-ghost btn-sm text-[#B8754F] hover:bg-[rgba(184,117,79,0.1)] border border-dashed border-[rgba(184,117,79,0.3)] hover:border-[#B8754F]"
          onClick={addItem}
        >
          <Plus size={15} />
          Add Item
        </button>
      </div>
    </div>
  );
}
