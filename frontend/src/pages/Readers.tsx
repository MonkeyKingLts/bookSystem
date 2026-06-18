import { useEffect, useState } from 'react';
import { Plus, Filter } from 'lucide-react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { api } from '../api/client';
import type { Reader } from '../types';

export default function Readers() {
  const [readers, setReaders] = useState<Reader[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', student_id: '', reader_type: '本科生', expiry_date: '',
  });

  const loadReaders = () => {
    api.readers.list({ page: String(page), limit: '10' }).then((res) => {
      setReaders(res.readers);
      setTotal(res.total);
    });
  };

  useEffect(() => { loadReaders(); }, [page]);

  const handleCreate = async () => {
    await api.readers.create(form);
    setShowModal(false);
    setForm({ name: '', email: '', phone: '', student_id: '', reader_type: '本科生', expiry_date: '' });
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
            <button className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm hover:bg-neutral">
              <Filter className="w-4 h-4" />
              筛选
            </button>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light">
              <Plus className="w-4 h-4" />
              注册读者
            </button>
          </div>
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
                <tr key={r.id} className="border-b border-border/50 hover:bg-neutral/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                        style={{ backgroundColor: r.avatar_color }}>
                        {getInitials(r.name)}
                      </div>
                      <div>
                        <p className="font-medium">{r.name}</p>
                        <p className="text-xs text-secondary">加入于 {new Date(r.joined_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' })}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs">{r.reader_id}</td>
                  <td className="px-5 py-4">
                    <p className="text-xs">{r.email}</p>
                    <p className="text-xs text-secondary">{r.phone}</p>
                  </td>
                  <td className="px-5 py-4 text-center">{r.current_borrowing ?? 0}</td>
                  <td className="px-5 py-4"><StatusBadge status={r.status} /></td>
                  <td className="px-5 py-4">
                    <button className="text-secondary hover:text-primary text-xs">···</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-5 py-3 text-sm text-secondary border-t border-border">
            <span>显示第 {(page - 1) * 10 + 1} 到 {Math.min(page * 10, total)} 条，共 {total} 位读者</span>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage(page - 1)}
                className="px-3 py-1 rounded-lg border border-border hover:bg-neutral disabled:opacity-40">上一页</button>
              <button disabled={page * 10 >= total} onClick={() => setPage(page + 1)}
                className="px-3 py-1 rounded-lg border border-border hover:bg-neutral disabled:opacity-40">下一页</button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="注册读者"
        wide
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-secondary">取消</button>
            <button onClick={handleCreate} className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium">确认注册</button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">姓名</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">读者类型</label>
            <select value={form.reader_type} onChange={(e) => setForm({ ...form, reader_type: e.target.value })}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm">
              <option>本科生</option>
              <option>研究生</option>
              <option>教职工</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">电子邮箱</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="example@domain.com"
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">手机号码</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">学号</label>
            <input value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">有效期至</label>
            <input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
      </Modal>
    </>
  );
}
