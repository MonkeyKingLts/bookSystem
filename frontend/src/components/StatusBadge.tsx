const statusStyles: Record<string, string> = {
  '信用良好': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '有逾期未还': 'bg-amber-50 text-amber-700 border-amber-200',
  '账户已封禁': 'bg-red-50 text-red-700 border-red-200',
  '已借出': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '已归还': 'bg-slate-50 text-slate-600 border-slate-200',
  '已续借': 'bg-blue-50 text-blue-700 border-blue-200',
  '已还': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '逾期': 'bg-red-50 text-red-700 border-red-200',
  '可借阅': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '成功': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '失败 (密码错误)': 'bg-red-50 text-red-700 border-red-200',
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
      {status}
    </span>
  );
}
