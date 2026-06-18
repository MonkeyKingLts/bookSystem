import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  ArrowLeftRight,
  Users,
  BarChart3,
  Settings,
  ShoppingCart,
  HelpCircle,
  LogOut,
  Library,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '仪表盘' },
  { to: '/catalog', icon: BookOpen, label: '图书目录' },
  { to: '/circulation', icon: ArrowLeftRight, label: '借阅管理' },
  { to: '/readers', icon: Users, label: '读者中心' },
  { to: '/reports', icon: BarChart3, label: '报表中心' },
  { to: '/settings', icon: Settings, label: '系统设置' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 min-h-screen bg-primary text-white flex flex-col shrink-0">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-tertiary/20 flex items-center justify-center">
            <Library className="w-5 h-5 text-tertiary" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight">Lexis 图书管理系统</h1>
            <p className="text-xs text-white/50 mt-0.5">{user?.role || '中心馆管理员'}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        <NavLink
          to="/circulation"
          className="flex items-center gap-2 w-full px-4 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-sm font-medium transition-colors"
        >
          <ShoppingCart className="w-4 h-4" />
          快速借出
        </NavLink>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-tertiary/15 text-tertiary border-l-[3px] border-tertiary -ml-px'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 pb-6 space-y-1 border-t border-white/10 pt-4">
        <button className="flex items-center gap-3 px-4 py-2 text-sm text-white/50 hover:text-white/80 w-full">
          <HelpCircle className="w-4 h-4" />
          技术支持
        </button>
        <button onClick={logout} className="flex items-center gap-3 px-4 py-2 text-sm text-white/50 hover:text-white/80 w-full">
          <LogOut className="w-4 h-4" />
          退出登录
        </button>
      </div>
    </aside>
  );
}
