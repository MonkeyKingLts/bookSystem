import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Library, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@lexiconlib.org');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-tertiary/20 flex items-center justify-center mx-auto mb-4">
            <Library className="w-8 h-8 text-tertiary" />
          </div>
          <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-headline)]">Lexis 图书管理系统</h1>
          <p className="text-white/50 text-sm mt-2">管理员登录</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5">邮箱</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1.5">密码</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full px-4 py-3 pr-12 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-light disabled:opacity-50 transition-colors">
            {loading ? '登录中...' : '登录'}
          </button>

          <p className="text-xs text-secondary text-center mt-4">
            默认账号: admin@lexiconlib.org / admin123
          </p>
        </form>
      </div>
    </div>
  );
}
