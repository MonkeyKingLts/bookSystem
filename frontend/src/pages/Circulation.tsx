import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, BookOpen, Printer, ScanBarcode, RotateCcw, ArrowDownToLine,
} from 'lucide-react';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import BarcodeScanner from '../components/BarcodeScanner';
import { Card } from '../components/StatCard';
import { api } from '../api/client';
import { downloadCheckoutReceipt } from '../utils/pdf';
import type { Reader, Book, Borrowing, ActiveBorrowing, CheckoutResult } from '../types';

type Tab = 'checkout' | 'return' | 'renew' | 'overdue';
type ScanTarget = 'reader' | 'book-checkout' | 'book-return' | null;

export default function Circulation() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('checkout');
  const [readerId, setReaderId] = useState('');
  const [reader, setReader] = useState<Reader | null>(null);
  const [isbn, setIsbn] = useState('');
  const [scannedBooks, setScannedBooks] = useState<Book[]>([]);
  const [recent, setRecent] = useState<Borrowing[]>([]);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [overdueCount, setOverdueCount] = useState(0);
  const [overdueList, setOverdueList] = useState<ActiveBorrowing[]>([]);
  const [activeBorrowings, setActiveBorrowings] = useState<ActiveBorrowing[]>([]);
  const [message, setMessage] = useState('');
  const [lastCheckout, setLastCheckout] = useState<CheckoutResult | null>(null);
  const [scanTarget, setScanTarget] = useState<ScanTarget>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    api.circulation.recent(showAllRecent ? 50 : 10).then(setRecent);
    api.circulation.overdueCount().then((r) => setOverdueCount(r.count));
  }, [showAllRecent]);

  useEffect(() => { refresh(); }, [refresh]);

  const lookupReader = async (id?: string) => {
    const rid = (id || readerId).trim();
    if (!rid) return;
    try {
      const r = await api.readers.getByReaderId(rid);
      setReader(r);
      setReaderId(rid);
      setMessage('');
      if (tab === 'return' || tab === 'renew') {
        const borrowings = await api.circulation.readerBorrowings(rid);
        setActiveBorrowings(borrowings);
      }
    } catch {
      setReader(null);
      setMessage('读者不存在');
    }
  };

  const addBookByIsbn = async (code: string) => {
    try {
      let book: Book;
      try {
        book = await api.books.getByIsbn(code);
      } catch {
        const res = await api.books.list({ search: code, limit: '1' });
        book = res.books[0];
      }
      if (!book) { setMessage('图书不存在'); return; }
      if (book.available <= 0) { setMessage('该图书暂无可借副本'); return; }
      if (scannedBooks.find((b) => b.id === book.id)) { setMessage('该图书已扫描'); return; }
      setScannedBooks((prev) => [...prev, book]);
      setIsbn('');
      setMessage('');
    } catch {
      setMessage('扫描失败');
    }
  };

  const handleCheckout = async () => {
    if (!reader || scannedBooks.length === 0) return;
    setLoading(true);
    try {
      const result = await api.circulation.checkout(reader.reader_id, scannedBooks.map((b) => b.id));
      setLastCheckout(result);
      setMessage('借出成功！');
      setScannedBooks([]);
      refresh();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (borrowingId: number) => {
    setLoading(true);
    try {
      const result = await api.circulation.return(borrowingId);
      setMessage(result.fine ? `归还成功，产生罚金 $${result.fine.toFixed(2)}` : '归还成功！');
      if (reader) lookupReader(reader.reader_id);
      refresh();
      loadOverdue();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnByIsbn = async (code: string) => {
    setLoading(true);
    try {
      const result = await api.circulation.returnByIsbn(code, reader?.reader_id);
      setMessage(result.fine ? `归还成功，产生罚金 $${result.fine.toFixed(2)}` : '归还成功！');
      if (reader) lookupReader(reader.reader_id);
      refresh();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async (borrowingId: number) => {
    setLoading(true);
    try {
      const result = await api.circulation.renew(borrowingId);
      setMessage(`续借成功！新应还日期: ${result.newDueDate}`);
      if (reader) lookupReader(reader.reader_id);
      refresh();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadOverdue = () => api.circulation.overdue().then(setOverdueList);

  const onScan = (code: string) => {
    if (scanTarget === 'reader') lookupReader(code);
    else if (scanTarget === 'book-checkout') addBookByIsbn(code);
    else if (scanTarget === 'book-return') handleReturnByIsbn(code);
    setScanTarget(null);
  };

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: 'checkout', label: '借出' },
    { key: 'return', label: '归还' },
    { key: 'renew', label: '续借' },
    { key: 'overdue', label: '逾期', badge: overdueCount },
  ];

  const BorrowingTable = ({ items, showActions }: { items: ActiveBorrowing[]; showActions: 'return' | 'renew' | 'both' }) => (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-secondary border-b border-border bg-neutral/50">
          <th className="px-5 py-3 text-left font-medium">书名</th>
          <th className="px-5 py-3 text-left font-medium">ISBN</th>
          <th className="px-5 py-3 text-left font-medium">应还日期</th>
          <th className="px-5 py-3 text-left font-medium">状态</th>
          <th className="px-5 py-3 text-left font-medium">操作</th>
        </tr>
      </thead>
      <tbody>
        {items.length === 0 ? (
          <tr><td colSpan={5} className="px-5 py-8 text-center text-secondary">暂无借阅记录</td></tr>
        ) : items.map((item) => (
          <tr key={item.id} className="border-b border-border/50">
            <td className="px-5 py-3 font-medium">{item.book_title}</td>
            <td className="px-5 py-3 font-mono text-xs">{item.isbn}</td>
            <td className="px-5 py-3 text-secondary">{item.due_date}</td>
            <td className="px-5 py-3"><StatusBadge status={item.status} /></td>
            <td className="px-5 py-3">
              <div className="flex gap-2">
                {(showActions === 'return' || showActions === 'both') && (
                  <button onClick={() => handleReturn(item.id)} disabled={loading}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs bg-primary text-white rounded-lg hover:bg-primary-light disabled:opacity-50">
                    <ArrowDownToLine className="w-3 h-3" />归还
                  </button>
                )}
                {(showActions === 'renew' || showActions === 'both') && item.status !== '逾期' && (
                  <button onClick={() => handleRenew(item.id)} disabled={loading}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs border border-border rounded-lg hover:bg-neutral disabled:opacity-50">
                    <RotateCcw className="w-3 h-3" />续借
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

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
                onClick={() => {
                  setTab(t.key);
                  setMessage('');
                  if (t.key === 'overdue') loadOverdue();
                  if ((t.key === 'return' || t.key === 'renew') && reader) lookupReader();
                }}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === t.key ? 'bg-primary text-white' : 'text-secondary hover:text-primary'
                }`}>
                {t.label}
                {t.badge ? (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{t.badge}</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-xl text-sm ${message.includes('成功') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            {message}
          </div>
        )}

        {tab === 'checkout' && (
          <div className="grid grid-cols-3 gap-5 mb-6">
            <div className="col-span-2 space-y-5">
              <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">读者 ID</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input value={readerId} onChange={(e) => setReaderId(e.target.value)}
                          onBlur={() => lookupReader()} onKeyDown={(e) => e.key === 'Enter' && lookupReader()}
                          placeholder="PAT-88402"
                          className="w-full px-3 py-2.5 pr-10 border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        {reader && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />}
                      </div>
                      <button onClick={() => setScanTarget('reader')} className="px-3 py-2 border border-border rounded-xl hover:bg-neutral" title="扫描读者证">
                        <ScanBarcode className="w-4 h-4 text-secondary" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">图书条形码 / ISBN</label>
                    <div className="flex gap-2">
                      <input value={isbn} onChange={(e) => setIsbn(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addBookByIsbn(isbn)} placeholder="扫描图书..."
                        className="flex-1 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      <button onClick={() => isbn ? addBookByIsbn(isbn) : setScanTarget('book-checkout')}
                        className="px-3 py-2 border border-border rounded-xl hover:bg-neutral">
                        <ScanBarcode className="w-4 h-4 text-secondary" />
                      </button>
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
                        style={{ backgroundColor: reader.avatar_color }}>{reader.name[0]}</div>
                      <div>
                        <p className="font-semibold">{reader.name}</p>
                        <p className="text-xs text-secondary">{reader.reader_type}</p>
                        <p className="text-xs text-secondary mt-1">当前借阅: {reader.current_borrowing ?? 0} / {reader.borrow_limit}</p>
                        <p className="text-xs text-secondary">罚金: ${reader.fines.toFixed(2)}</p>
                      </div>
                    </div>
                  ) : <p className="text-sm text-secondary">请输入或扫描读者 ID</p>}
                </div>
                <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-secondary mb-3">已扫描图书 ({scannedBooks.length})</h3>
                  {scannedBooks.length > 0 ? (
                    <div className="space-y-2">
                      {scannedBooks.map((b) => (
                        <div key={b.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-secondary" /><span>{b.title}</span></div>
                          <button onClick={() => setScannedBooks(scannedBooks.filter((x) => x.id !== b.id))} className="text-xs text-red-500">移除</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-4 text-secondary">
                      <BookOpen className="w-8 h-8 mb-2 opacity-30" /><p className="text-sm">等待扫描图书...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
              <h3 className="font-semibold text-primary mb-4">借阅操作</h3>
              <button onClick={handleCheckout} disabled={!reader || scannedBooks.length === 0 || loading}
                className="w-full py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light disabled:opacity-40 mb-3">
                确认借出
              </button>
              <button onClick={() => lastCheckout && downloadCheckoutReceipt(lastCheckout)} disabled={!lastCheckout}
                className="w-full py-3 border border-border rounded-xl text-sm text-secondary hover:bg-neutral flex items-center justify-center gap-2 disabled:opacity-40">
                <Printer className="w-4 h-4" />下载借书收据 (PDF)
              </button>
            </div>
          </div>
        )}

        {(tab === 'return' || tab === 'renew') && (
          <div className="space-y-5 mb-6">
            <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
              <div className="flex gap-3 max-w-md">
                <input value={readerId} onChange={(e) => setReaderId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && lookupReader()} placeholder="输入读者 ID..."
                  className="flex-1 px-3 py-2.5 border border-border rounded-xl text-sm font-mono" />
                <button onClick={() => lookupReader()} className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm">查询</button>
                <button onClick={() => setScanTarget('reader')} className="px-3 py-2.5 border border-border rounded-xl"><ScanBarcode className="w-4 h-4" /></button>
                {tab === 'return' && (
                  <button onClick={() => setScanTarget('book-return')} className="px-3 py-2.5 border border-border rounded-xl" title="扫描归还">
                    <ScanBarcode className="w-4 h-4 text-tertiary" />
                  </button>
                )}
              </div>
              {reader && <p className="text-sm mt-3">读者: <strong>{reader.name}</strong> ({reader.reader_id})</p>}
            </div>
            <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
              <BorrowingTable items={activeBorrowings} showActions={tab === 'return' ? 'return' : 'renew'} />
            </div>
          </div>
        )}

        {tab === 'overdue' && (
          <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden mb-6">
            <BorrowingTable items={overdueList} showActions="both" />
          </div>
        )}

        <Card title="最近交易记录" action={
          <button onClick={() => { setShowAllRecent(!showAllRecent); navigate('/circulation'); }}
            className="text-sm text-tertiary hover:underline">
            {showAllRecent ? '收起' : '查看全部'}
          </button>
        }>
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
                  <td className="py-3 text-secondary">{new Date(t.borrowed_at).toLocaleString('zh-CN')}</td>
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

      <BarcodeScanner
        open={scanTarget !== null}
        onClose={() => setScanTarget(null)}
        onScan={onScan}
        title={scanTarget === 'reader' ? '扫描读者证' : '扫描图书条形码'}
      />
    </>
  );
}
