'use client';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  selected?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className = '', selected, onClick }: CardProps) {
  const interactive = onClick ? 'cursor-pointer hover:border-indigo-300 hover:shadow-md' : '';
  const selectedStyle = selected ? 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50' : 'border-gray-200';

  return (
    <div
      className={`rounded-xl border bg-white p-6 shadow-sm transition-all ${interactive} ${selectedStyle} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      {children}
    </div>
  );
}
