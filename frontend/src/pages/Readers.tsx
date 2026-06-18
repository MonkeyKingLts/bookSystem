import { useEffect, useState } from 'react';
import { Plus, Filter, Pencil } from 'lucide-react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { api } from '../api/client';
import type { Reader } from '../types';

export default function Readers() {
  const [readers, setReaders] = useState<Reader[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingReader, setEditingReader] = useState<Reader | null>(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', student_id: '', reader_type: '本科生', expiry_date: '', status: '信用良好',
  });

  const loadReaders = () => {
    const params: Record<string, string> = { page: String(page), limit: '10' };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    api.readers.list(params).then((res) => { setReaders(res.readers); setTotal(res.total); });
  };

  useEffect(() => { loadReaders(); }, [page, statusFilter]);

  const handleSearch = () => { setPage(1); loadReaders(); };

  const openCreate = () => {
    setEditingReader(null);
    setForm({ name: '', email: '', phone: '', student_id: '', reader_type: '本科生', expiry_date: '', status: '信用良好' });
    setShowModal(true);
  };

  const openEdit = (r: Reader) => {
    setEditingReader(r);
    setForm({ name: r.name, email: r.email, phone: r.phone, student_id: r.student_id,
      reader_type: r.reader_type, expiry_date: r.expiry_date, status: r.status });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (editingReader) await api.readers.update(editingReader.id, form);
    else await api.readers.create(form);
    setShowModal(false);
    loadReaders();
  };

  const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      <Header title="Lexis 图书管理系统" searchPlaceholder="搜索读者姓名、ID 或邮箱..." />
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">读者中心</h1>
            <p className="text-secondary text-sm mt-1">管理图书馆读者，查看借阅历史及更新账户状态</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setShowFilter(!showFilter)} className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm hover:bg-neutral">
                <Filter className="w-4 h-4" />筛选
              </button>
              {showFilter && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border rounded-xl shadow-lg p-3 z-10">
                  <p className="text-xs text-secondary mb-2">按状态筛选</p>
                  {['', '信用良好', '有逾期未还', '账户已封禁'].map((s) => (
                    <button key={s} onClick={() => { setStatusFilter(s); setShowFilter(false); setPage(1); }}
                      className={`block w-full text-left px-3 py-2 text-sm rounded-lg ${statusFilter === s ? 'bg-primary/10 text-primary' : 'hover:bg-neutral'}`}>
                      {s || '全部'}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light">
              <Plus className="w-4 h-4" />注册读者
            </button>
          </div>
        </div>

        <div className="mb-4 flex gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜索读者姓名、ID 或邮箱..." className="flex-1 max-w-md px-4 py-2.5 border border-border rounded-xl text-sm" />
          <button onClick={handleSearch} className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm">搜索</button>
        </div>

        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-secondary text-left border-b border-border bg-neutral/50">
                <th className="px-5 py-3 font-medium">读者</th>
                <th className="px-5 py-3 font-medium">读者 ID</th>
                <th className="px-5 py-3 font-medium">联系方式</th>
                <th className="px-5 py-3 font-medium">当前借阅</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {readers.map((r) => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-neutral/30">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ backgroundColor: r.avatar_color }}>
                        {getInitials(r.name)}
                      </div>
                      <div>
                        <p className="font-medium">{r.name}</p>
                        <p className="text-xs text-secondary">加入于 {new Date(r.joined_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' })}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs">{r.reader_id}</td>
                  <td className="px-5 py-4"><p className="text-xs">{r.email}</p><p className="text-xs text-secondary">{r.phone}</p></td>
                  <td className="px-5 py-4 text-center">{r.current_borrowing ?? 0}</td>
                  <td className="px-5 py-4"><StatusBadge status={r.status} /></td>
                  <td className="px-5 py-4">
                    <button onClick={() => openEdit(r)} className="p-1.5 hover:bg-neutral rounded-lg text-secondary hover:text-primary">
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-5 py-3 text-sm text-secondary border-t border-border">
            <span>共 {total} 位读者</span>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1 rounded-lg border border-border disabled:opacity-40">上一页</button>
              <button disabled={page * 10 >= total} onClick={() => setPage(page + 1)} className="px-3 py-1 rounded-lg border border-border disabled:opacity-40">下一页</button>
            </div>
          </div>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingReader ? '编辑读者' : '注册读者'} wide
        footer={<>
          <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-secondary">取消</button>
          <button onClick={handleSave} className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium">{editingReader ? '保存' : '确认注册'}</button>
        </>}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">姓名</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">读者类型</label>
            <select value={form.reader_type} onChange={(e) => setForm({ ...form, reader_type: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-xl text-sm">
              <option>本科生</option><option>研究生</option><option>教职工</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">电子邮箱</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">手机号码</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">学号</label>
            <input value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">有效期至</label>
            <input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-xl text-sm" />
          </div>
          {editingReader && (
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1.5">账户状态</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-xl text-sm">
                <option>信用良好</option><option>有逾期未还</option><option>账户已封禁</option>
              </select>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
