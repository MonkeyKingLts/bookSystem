import { useEffect, useState } from 'react';
import { BookOpen, RefreshCw, Users, BookPlus, Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import Header from '../components/Header';
import StatCard, { Card } from '../components/StatCard';
import { api } from '../api/client';

interface Overview {
  totalBorrowings: number;
  turnoverRate: number;
  activeReaders: number;
  collectionGrowth: number;
  trends: { borrowings: number; turnover: number; readers: number; growth: number };
}

interface Log {
  date: string;
  category: string;
  description: string;
  value: number;
  trend: string;
}

const categoryColors: Record<string, string> = {
  '流通': 'bg-blue-50 text-blue-700 border-blue-200',
  '入库': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '异常': 'bg-red-50 text-red-700 border-red-200',
  '会员': 'bg-slate-50 text-slate-600 border-slate-200',
};

export default function Reports() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [trends, setTrends] = useState<{ date: string; borrowed: number; returned: number }[]>([]);
  const [categories, setCategories] = useState<{ name: string; percentage: number }[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    api.reports.overview().then(setOverview);
    api.reports.trends().then(setTrends);
    api.reports.categories().then(setCategories);
    api.reports.logs().then((res) => setLogs(res.logs));
  }, []);

  const TrendIcon = ({ value }: { value: number }) => {
    if (value > 0) return <span className="text-emerald-600 text-xs flex items-center gap-0.5"><TrendingUp className="w-3 h-3" />+{value}%</span>;
    if (value < 0) return <span className="text-red-500 text-xs flex items-center gap-0.5"><TrendingDown className="w-3 h-3" />{value}%</span>;
    return <span className="text-secondary text-xs flex items-center gap-0.5"><Minus className="w-3 h-3" />0%</span>;
  };

  return (
    <>
      <Header title="Lexis 图书管理系统" searchPlaceholder="搜索报表、指标或日期..." />
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">报表中心</h1>
            <p className="text-secondary text-sm mt-1">查看和分析图书馆运营的关键指标、借阅趋势及馆藏状态</p>
          </div>
          <div className="flex items-center gap-3">
            <select className="px-3 py-2.5 bg-surface border border-border rounded-xl text-sm">
              <option>最近 30 天</option>
              <option>最近 90 天</option>
              <option>最近一年</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium">
              <Download className="w-4 h-4" />
              导出报告
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-5 mb-6">
          <div>
            <StatCard title="借阅总量" value={overview?.totalBorrowings ?? '—'} icon={BookOpen} />
            {overview && <div className="mt-1 px-1"><TrendIcon value={overview.trends.borrowings} /></div>}
          </div>
          <div>
            <StatCard title="平均周转率" value={overview?.turnoverRate ?? '—'} icon={RefreshCw} suffix="次/本" />
            {overview && <div className="mt-1 px-1"><TrendIcon value={overview.trends.turnover} /></div>}
          </div>
          <div>
            <StatCard title="活跃读者数" value={overview?.activeReaders ?? '—'} icon={Users} />
            {overview && <div className="mt-1 px-1"><TrendIcon value={overview.trends.readers} /></div>}
          </div>
          <div>
            <StatCard title="馆藏增长量" value={overview?.collectionGrowth ?? '—'} icon={BookPlus} />
            {overview && <div className="mt-1 px-1"><TrendIcon value={overview.trends.growth} /></div>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5 mb-6">
          <div className="col-span-2">
            <Card title="借阅趋势">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="borrowed" name="借出" stroke="#1A2B44" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="returned" name="归还" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card title="热门分类">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categories} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="%" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={50} />
                  <Tooltip />
                  <Bar dataKey="percentage" fill="#1A2B44" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card title="详细运营日志">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-secondary text-left border-b border-border">
                <th className="pb-3 font-medium">日期</th>
                <th className="pb-3 font-medium">类别</th>
                <th className="pb-3 font-medium">关键指标/操作</th>
                <th className="pb-3 font-medium">数值</th>
                <th className="pb-3 font-medium">趋势</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-3 text-secondary">{log.date}</td>
                  <td className="py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${categoryColors[log.category] || ''}`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3">{log.description}</td>
                  <td className="py-3 font-mono">{log.value.toLocaleString()}</td>
                  <td className="py-3">
                    {log.trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                    {log.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                    {log.trend === 'flat' && <Minus className="w-4 h-4 text-secondary" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
