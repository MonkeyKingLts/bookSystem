import { Search, Bell, HelpCircle } from 'lucide-react';

interface HeaderProps {
  title: string;
  searchPlaceholder?: string;
}

export default function Header({ title, searchPlaceholder = '搜索...' }: HeaderProps) {
  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-8 shrink-0">
      <h2 className="text-lg font-bold text-primary font-[family-name:var(--font-headline)]">{title}</h2>

      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-16 py-2 bg-neutral border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-secondary bg-white border border-border rounded px-1.5 py-0.5 font-mono">
            ⌘ K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-xl hover:bg-neutral transition-colors">
          <Bell className="w-5 h-5 text-secondary" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <button className="p-2 rounded-xl hover:bg-neutral transition-colors">
          <HelpCircle className="w-5 h-5 text-secondary" />
        </button>
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold ml-1">
          EV
        </div>
      </div>
    </header>
  );
}
