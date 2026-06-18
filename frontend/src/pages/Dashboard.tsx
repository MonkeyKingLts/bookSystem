import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowLeftRight, AlertTriangle, UserPlus, BookPlus, ScanBarcode } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Header from '../components/Header';
import StatCard, { Card } from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { api } from '../api/client';
import { formatDateTime } from '../utils/date';
import type { DashboardStats, Activity } from '../types';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [trends, setTrends] = useState<{ date: string; borrowed: number; returned: number }[]>([]);

  useEffect(() => {
    api.dashboard.stats().then(setStats);
    api.dashboard.activities().then(setActivities);
    api.dashboard.trends().then(setTrends);
  }, []);

  return (
    <>
      <Header title="Lexis 图书管理系统" searchPlaceholder="搜索目录、读者..." />
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary">概览</h1>
          <p className="text-secondary text-sm mt-1">中心区主馆的实时统计数据与最近动态</p>
        </div>

        <div className="grid grid-cols-4 gap-5 mb-6">
          <StatCard title="馆藏总量" value={stats?.totalCollection ?? '—'} icon={BookOpen} />
          <StatCard title="当前借阅" value={stats?.currentBorrowing ?? '—'} icon={ArrowLeftRight} />
          <StatCard title="逾期未还" value={stats?.overdue ?? '—'} icon={AlertTriangle} variant="warning" />
          <StatCard title="新增读者 (30天)" value={stats?.newReaders ?? '—'} icon={UserPlus} />
        </div>

        <div className="grid grid-cols-3 gap-5 mb-6">
          <div className="col-span-2">
            <Card title="借阅趋势">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="borrowed" name="借出" stroke="#1A2B44" fill="#1A2B44" fillOpacity={0.1} />
                    <Area type="monotone" dataKey="returned" name="归还" stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card title="快速操作">
            <div className="space-y-3">
              <Link to="/catalog" className="flex items-center gap-3 w-full px-4 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light transition-colors">
                <BookPlus className="w-4 h-4" />
                添加新书
              </Link>
              <Link to="/readers" className="flex items-center gap-3 w-full px-4 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light transition-colors">
                <UserPlus className="w-4 h-4" />
                注册读者
              </Link>
              <Link to="/circulation" className="flex items-center gap-3 w-full px-4 py-3 border border-border rounded-xl text-sm font-medium hover:bg-neutral transition-colors">
                <ScanBarcode className="w-4 h-4 text-secondary" />
                扫描 ISBN
              </Link>
            </div>
          </Card>
        </div>

        <Card
          title="最近动态"
          action={<button className="text-sm text-tertiary hover:underline">查看全部</button>}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="text-secondary text-left border-b border-border">
                <th className="pb-3 font-medium">状态</th>
                <th className="pb-3 font-medium">书名</th>
                <th className="pb-3 font-medium">读者</th>
                <th className="pb-3 font-medium">时间</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((a) => (
                <tr key={a.id} className="border-b border-border/50 last:border-0">
                  <td className="py-3"><StatusBadge status={a.status} /></td>
                  <td className="py-3 font-medium">{a.book_title}</td>
                  <td className="py-3 text-secondary">{a.reader_name}</td>
                  <td className="py-3 text-secondary">{formatDateTime(a.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
