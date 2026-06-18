import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import type { Notification } from '../types';

interface HeaderProps {
  title: string;
  searchPlaceholder?: string;
}

export default function Header({ title, searchPlaceholder = '搜索...' }: HeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<{ books: { id: number; title: string; author: string }[]; readers: { id: number; name: string; reader_id: string }[] } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    api.notifications.unreadCount().then((r) => setUnreadCount(r.count)).catch(() => {});
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults(null); return; }
    const results = await api.search(q);
    setSearchResults(results);
    setShowSearch(true);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const loadNotifications = async () => {
    const list = await api.notifications.list();
    setNotifications(list);
    setShowNotifs(true);
  };

  const markAllRead = async () => {
    await api.notifications.markAllRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
  };

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'AD';

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-8 shrink-0 relative z-30">
      <h2 className="text-lg font-bold text-primary font-[family-name:var(--font-headline)]">{title}</h2>

      <div className="flex-1 max-w-md mx-8 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
          <input
            id="global-search"
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); doSearch(e.target.value); }}
            onFocus={() => query && setShowSearch(true)}
            onBlur={() => setTimeout(() => setShowSearch(false), 200)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-16 py-2 bg-neutral border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-secondary bg-white border border-border rounded px-1.5 py-0.5 font-mono">⌘ K</kbd>
        </div>

        {showSearch && searchResults && (searchResults.books.length > 0 || searchResults.readers.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-lg overflow-hidden">
            {searchResults.books.length > 0 && (
              <div className="p-2">
                <p className="text-xs text-secondary px-2 py-1">图书</p>
                {searchResults.books.map((b) => (
                  <button key={b.id} onClick={() => { navigate('/catalog'); setShowSearch(false); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-neutral rounded-lg">
                    <span className="font-medium">{b.title}</span>
                    <span className="text-secondary ml-2 text-xs">{b.author}</span>
                  </button>
                ))}
              </div>
            )}
            {searchResults.readers.length > 0 && (
              <div className="p-2 border-t border-border">
                <p className="text-xs text-secondary px-2 py-1">读者</p>
                {searchResults.readers.map((r) => (
                  <button key={r.id} onClick={() => { navigate('/readers'); setShowSearch(false); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-neutral rounded-lg">
                    <span className="font-medium">{r.name}</span>
                    <span className="text-secondary ml-2 text-xs font-mono">{r.reader_id}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button onClick={loadNotifications} className="relative p-2 rounded-xl hover:bg-neutral transition-colors">
            <Bell className="w-5 h-5 text-secondary" />
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
          </button>
          {showNotifs && (
            <div className="absolute right-0 top-full mt-1 w-80 bg-surface border border-border rounded-xl shadow-lg z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="font-semibold text-sm">通知</span>
                <button onClick={markAllRead} className="text-xs text-tertiary hover:underline">全部已读</button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className={`px-4 py-3 border-b border-border/50 ${n.read ? 'opacity-60' : ''}`}>
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-secondary mt-0.5">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <button className="p-2 rounded-xl hover:bg-neutral transition-colors" title="帮助文档">
          <HelpCircle className="w-5 h-5 text-secondary" />
        </button>
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold ml-1" title={user?.name}>
          {initials}
        </div>
      </div>
    </header>
  );
}
