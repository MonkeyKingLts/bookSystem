import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: 'default' | 'warning';
  suffix?: string;
}

export default function StatCard({ title, value, icon: Icon, variant = 'default', suffix }: StatCardProps) {
  return (
    <div className={`bg-surface rounded-2xl p-5 border ${variant === 'warning' ? 'border-red-100 bg-red-50/30' : 'border-border'} shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-secondary mb-1">{title}</p>
          <p className="text-3xl font-bold text-primary font-[family-name:var(--font-headline)]">
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix && <span className="text-sm font-normal text-secondary ml-1">{suffix}</span>}
          </p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${variant === 'warning' ? 'bg-red-100' : 'bg-primary/5'}`}>
          <Icon className={`w-5 h-5 ${variant === 'warning' ? 'text-red-500' : 'text-primary'}`} />
        </div>
      </div>
    </div>
  );
}

export function Card({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="bg-surface rounded-2xl border border-border shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-primary">{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
