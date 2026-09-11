import React from 'react';

export default function LoadingSpinner({ size = 'md', message = '' }) {
  const sizes = { sm: 16, md: 24, lg: 40 };
  const px = sizes[size] || 24;
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        style={{
          width: px,
          height: px,
          border: `${size === 'lg' ? 3 : 2}px solid rgba(184,117,79,0.2)`,
          borderTopColor: '#B8754F',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }}
      />
      {message && <p className="text-sm text-[#A1A1AA]">{message}</p>}
    </div>
  );
}
