// Utility functions for class merging
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(amount, currency = '₹') {
  if (amount === null || amount === undefined || isNaN(amount)) return `${currency}0`;
  return `${currency}${Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function generateBillNumber(prefix = 'SC', sequence = 1) {
  return `${prefix}-${String(sequence).padStart(4, '0')}`;
}

export function debounce(fn, delay = 300) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}
