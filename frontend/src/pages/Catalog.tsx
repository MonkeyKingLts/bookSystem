import { useEffect, useState } from 'react';
import { Plus, Star, MoreVertical, Search, Barcode } from 'lucide-react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { api } from '../api/client';
import type { Book } from '../types';

export default function Catalog() {
  const [books, setBooks] = useState<Book[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('所有分类');
  const [status, setStatus] = useState('');
  const [language, setLanguage] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '', author: '', isbn: '', category: '文学',
    publisher: '', publish_date: '', quantity: 1, location: '',
  });

  const loadBooks = () => {
    const params: Record<string, string> = { page: String(page), limit: '12' };
    if (search) params.search = search;
    if (category !== '所有分类') params.category = category;
    if (status) params.status = status;
    if (language) params.language = language;
    api.books.list(params).then((res) => {
      setBooks(res.books);
      setTotal(res.total);
    });
  };

  useEffect(() => { api.books.categories().then(setCategories); }, []);
  useEffect(() => { loadBooks(); }, [page, category, status, language]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadBooks();
  };

  const handleCreate = async () => {
    await api.books.create(form);
    setShowModal(false);
    setForm({ title: '', author: '', isbn: '', category: '文学', publisher: '', publish_date: '', quantity: 1, location: '' });
    loadBooks();
  };

  const totalPages = Math.ceil(total / 12);

  return (
    <>
      <Header title="Lexis 图书管理系统" searchPlaceholder="按书名、作者或 ISBN 搜索..." />
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">图书目录</h1>
            <p className="text-secondary text-sm mt-1">管理和跟踪图书馆库存</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加新书
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="按书名、作者或 ISBN 搜索..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </form>
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="px-3 py-2.5 bg-surface border border-border rounded-xl text-sm">
            <option>所有分类</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2.5 bg-surface border border-border rounded-xl text-sm">
            <option value="">状态</option>
            <option>可借阅</option>
            <option>已借出</option>
          </select>
          <select value={language} onChange={(e) => { setLanguage(e.target.value); setPage(1); }}
            className="px-3 py-2.5 bg-surface border border-border rounded-xl text-sm">
            <option value="">语言</option>
            <option>中文</option>
            <option>英文</option>
          </select>
        </div>

        <div className="grid grid-cols-4 gap-5 mb-6">
          {books.map((book) => (
            <div key={book.id} className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="h-40 flex items-center justify-center" style={{ backgroundColor: book.cover_color + '15' }}>
                <div className="w-20 h-28 rounded-lg shadow-lg flex items-center justify-center text-white text-xs font-bold p-2 text-center"
                  style={{ backgroundColor: book.cover_color }}>
                  {book.title.slice(0, 20)}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-sm text-primary line-clamp-1">{book.title}</h3>
                  <button className="p-1 hover:bg-neutral rounded"><MoreVertical className="w-4 h-4 text-secondary" /></button>
                </div>
                <p className="text-xs text-secondary mb-2">{book.author}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="font-medium">{book.rating}</span>
                    <span className="text-secondary">({book.review_count})</span>
                  </div>
                  <StatusBadge status={book.available > 0 ? '可借阅' : '已借出'} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-sm text-secondary">
          <span>显示第 {(page - 1) * 12 + 1} 到 {Math.min(page * 12, total)} 条，共 {total} 条结果</span>
          <div className="flex items-center gap-1">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 rounded-lg border border-border hover:bg-neutral disabled:opacity-40">上一页</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                className={`px-3 py-1.5 rounded-lg ${p === page ? 'bg-primary text-white' : 'border border-border hover:bg-neutral'}`}>{p}</button>
            ))}
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 rounded-lg border border-border hover:bg-neutral disabled:opacity-40">下一页</button>
          </div>
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="添加新书"
        wide
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-secondary hover:text-primary">取消</button>
            <button onClick={handleCreate} className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light">保存图书</button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1.5">书名</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">作者</label>
            <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">ISBN</label>
            <div className="relative">
              <input value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                className="w-full px-3 py-2.5 pr-10 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <Barcode className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">分类</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm">
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">出版社</label>
            <input value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">出版日期</label>
            <input type="date" value={form.publish_date} onChange={(e) => setForm({ ...form, publish_date: e.target.value })}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">副本数量</label>
            <input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) })}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1.5">存放位置</label>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="A区-3架-04"
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
      </Modal>
    </>
  );
}
