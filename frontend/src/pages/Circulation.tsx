import { useEffect, useState } from 'react';
import { CheckCircle, BookOpen, Printer, ScanBarcode } from 'lucide-react';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import { Card } from '../components/StatCard';
import { api } from '../api/client';
import type { Reader, Book, Borrowing } from '../types';

type Tab = 'checkout' | 'return' | 'renew' | 'overdue';

export default function Circulation() {
  const [tab, setTab] = useState<Tab>('checkout');
  const [readerId, setReaderId] = useState('');
  const [reader, setReader] = useState<Reader | null>(null);
  const [isbn, setIsbn] = useState('');
  const [scannedBooks, setScannedBooks] = useState<Book[]>([]);
  const [recent, setRecent] = useState<Borrowing[]>([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [overdueList, setOverdueList] = useState<Borrowing[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.circulation.recent().then(setRecent);
    api.circulation.overdueCount().then((r) => setOverdueCount(r.count));
  }, []);

  const lookupReader = async () => {
    if (!readerId.trim()) return;
    try {
      const r = await api.readers.getByReaderId(readerId.trim());
      setReader(r);
      setMessage('');
    } catch {
      setReader(null);
      setMessage('读者不存在');
    }
  };

  const scanBook = async () => {
    if (!isbn.trim()) return;
    try {
      const res = await api.books.list({ search: isbn.trim(), limit: '1' });
      const book = res.books[0];
      if (!book) { setMessage('图书不存在'); return; }
      if (book.available <= 0) { setMessage('该图书暂无可借副本'); return; }
      if (scannedBooks.find((b) => b.id === book.id)) { setMessage('该图书已扫描'); return; }
      setScannedBooks([...scannedBooks, book]);
      setIsbn('');
      setMessage('');
    } catch {
      setMessage('扫描失败');
    }
  };

  const handleCheckout = async () => {
    if (!reader || scannedBooks.length === 0) return;
    try {
      await api.circulation.checkout(reader.reader_id, scannedBooks.map((b) => b.id));
      setMessage('借出成功！');
      setScannedBooks([]);
      setReader(null);
      setReaderId('');
      api.circulation.recent().then(setRecent);
    } catch (e) {
      setMessage((e as Error).message);
    }
  };

  const loadOverdue = () => {
    api.circulation.overdue().then(setOverdueList);
  };

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: 'checkout', label: '借出' },
    { key: 'return', label: '归还' },
    { key: 'renew', label: '续借' },
    { key: 'overdue', label: '逾期', badge: overdueCount },
  ];

  return (
    <>
      <Header title="Lexis 图书管理系统" searchPlaceholder="搜索借阅记录..." />
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">借阅管理</h1>
            <p className="text-secondary text-sm mt-1">处理图书借出、归还和续借操作</p>
          </div>
          <div className="flex bg-surface border border-border rounded-xl p-1">
            {tabs.map((t) => (
              <button key={t.key}
                onClick={() => { setTab(t.key); if (t.key === 'overdue') loadOverdue(); }}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === t.key ? 'bg-primary text-white' : 'text-secondary hover:text-primary'
                }`}>
                {t.label}
                {t.badge ? (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {t.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {tab === 'checkout' && (
          <div className="grid grid-cols-3 gap-5 mb-6">
            <div className="col-span-2 space-y-5">
              <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">读者 ID</label>
                    <div className="relative">
                      <input value={readerId} onChange={(e) => setReaderId(e.target.value)}
                        onBlur={lookupReader} placeholder="PAT-88402"
                        className="w-full px-3 py-2.5 pr-10 border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      {reader && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">图书条形码 / ISBN</label>
                    <div className="relative">
                      <input value={isbn} onChange={(e) => setIsbn(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && scanBook()} placeholder="扫描图书..."
                        className="w-full px-3 py-2.5 pr-10 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      <ScanBarcode className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-secondary mb-3">读者信息</h3>
                  {reader ? (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: reader.avatar_color }}>
                        {reader.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold">{reader.name}</p>
                        <p className="text-xs text-secondary">{reader.reader_type}</p>
                        <p className="text-xs text-secondary mt-1">
                          当前借阅: {reader.current_borrowing ?? 0} / {reader.borrow_limit} 上限
                        </p>
                        <p className="text-xs text-secondary">罚金: ${reader.fines.toFixed(2)}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-secondary">请输入读者 ID</p>
                  )}
                </div>

                <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-secondary mb-3">图书详情</h3>
                  {scannedBooks.length > 0 ? (
                    <div className="space-y-2">
                      {scannedBooks.map((b) => (
                        <div key={b.id} className="flex items-center gap-2 text-sm">
                          <BookOpen className="w-4 h-4 text-secondary" />
                          <span className="font-medium">{b.title}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4 text-secondary">
                      <BookOpen className="w-8 h-8 mb-2 opacity-30" />
                      <p className="text-sm">等待扫描图书...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
              <h3 className="font-semibold text-primary mb-4">借阅操作</h3>
              <p className="text-sm text-secondary mb-4">已扫描: {scannedBooks.length} 本</p>
              {message && <p className={`text-sm mb-3 ${message.includes('成功') ? 'text-tertiary' : 'text-red-500'}`}>{message}</p>}
              <button onClick={handleCheckout} disabled={!reader || scannedBooks.length === 0}
                className="w-full py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light disabled:opacity-40 disabled:cursor-not-allowed mb-3">
                确认借出
              </button>
              <button className="w-full py-3 border border-border rounded-xl text-sm text-secondary hover:bg-neutral flex items-center justify-center gap-2">
                <Printer className="w-4 h-4" />
                打印收据
              </button>
            </div>
          </div>
        )}

        {tab === 'overdue' && (
          <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-secondary border-b border-border bg-neutral/50">
                  <th className="px-5 py-3 text-left font-medium">读者</th>
                  <th className="px-5 py-3 text-left font-medium">图书</th>
                  <th className="px-5 py-3 text-left font-medium">应还日期</th>
                  <th className="px-5 py-3 text-left font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {overdueList.map((item: Borrowing & { reader_id?: string }) => (
                  <tr key={item.id} className="border-b border-border/50">
                    <td className="px-5 py-3">{item.reader_name}</td>
                    <td className="px-5 py-3">{item.book_title}</td>
                    <td className="px-5 py-3 text-secondary">{item.due_date}</td>
                    <td className="px-5 py-3"><StatusBadge status="逾期" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Card title="最近交易记录" action={<button className="text-sm text-tertiary hover:underline">查看全部</button>}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-secondary text-left border-b border-border">
                <th className="pb-3 font-medium">时间</th>
                <th className="pb-3 font-medium">读者</th>
                <th className="pb-3 font-medium">书名</th>
                <th className="pb-3 font-medium">应还日期</th>
                <th className="pb-3 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((t) => (
                <tr key={t.id} className="border-b border-border/50">
                  <td className="py-3 text-secondary">{new Date(t.borrowed_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="py-3">{t.reader_name}</td>
                  <td className="py-3">{t.book_title}</td>
                  <td className="py-3 text-secondary">{t.due_date}</td>
                  <td className="py-3"><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
