import { useEffect, useState } from 'react';
import { Trash2, Plus, Upload } from 'lucide-react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import type { Settings } from '../types';

type Tab = 'general' | 'borrowing' | 'security' | 'notifications';

export default function SettingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('general');
  const [settings, setSettings] = useState<Settings>({});
  const [originalSettings, setOriginalSettings] = useState<Settings>({});
  const [auditLogs, setAuditLogs] = useState<{ id: number; event_type: string; ip_address: string; status: string; created_at: string }[]>([]);
  const [ipList, setIpList] = useState<{ id: number; name: string; ip_range: string }[]>([]);
  const [saved, setSaved] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showIpModal, setShowIpModal] = useState(false);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [ipForm, setIpForm] = useState({ name: '', ip_range: '' });
  const [message, setMessage] = useState('');

  const loadSettings = () => {
    api.settings.get().then((s) => { setSettings(s); setOriginalSettings(s); });
    api.settings.auditLogs().then(setAuditLogs);
    api.settings.ipWhitelist().then(setIpList);
  };

  useEffect(() => { loadSettings(); }, []);

  const update = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    await api.settings.update(settings);
    setOriginalSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDiscard = () => {
    setSettings(originalSettings);
    setMessage('已放弃更改');
    setTimeout(() => setMessage(''), 2000);
  };

  const handleBackup = async () => {
    const result = await api.settings.backup();
    update('last_backup', result.timestamp);
    setMessage('备份完成');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPass !== passwordForm.confirm) {
      setMessage('两次输入的新密码不一致');
      return;
    }
    await api.auth.changePassword(passwordForm.current, passwordForm.newPass);
    setShowPasswordModal(false);
    setPasswordForm({ current: '', newPass: '', confirm: '' });
    setMessage('密码修改成功');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleAddIp = async () => {
    await api.settings.addIp(ipForm.name, ipForm.ip_range);
    setIpForm({ name: '', ip_range: '' });
    setShowIpModal(false);
    api.settings.ipWhitelist().then(setIpList);
  };

  const handleDeleteIp = async (id: number) => {
    await api.settings.deleteIp(id);
    api.settings.ipWhitelist().then(setIpList);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'general', label: '通用设置' },
    { key: 'borrowing', label: '借阅规则' },
    { key: 'security', label: '账户与安全' },
    { key: 'notifications', label: '通知配置' },
  ];

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-slate-200'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );

  return (
    <>
      <Header title="Lexis 图书管理系统" searchPlaceholder="搜索设置..." />
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary">系统设置</h1>
          <p className="text-secondary text-sm mt-1">配置并管理您的图书馆自动化系统偏好</p>
        </div>

        <div className="flex gap-6 border-b border-border mb-6">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-primary'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'general' && (
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
              <h3 className="font-semibold text-primary mb-4">图书馆信息</h3>
              <div className="space-y-3">
                {[
                  { key: 'library_name', label: '图书馆名称' },
                  { key: 'branch_id', label: '分馆编号' },
                  { key: 'address', label: '详细地址' },
                  { key: 'contact_email', label: '联系邮箱' },
                  { key: 'contact_phone', label: '联系电话' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs text-secondary mb-1">{label}</label>
                    <input value={settings[key] || ''} onChange={(e) => update(key, e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
              <h3 className="font-semibold text-primary mb-4">品牌定制</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl">L</div>
                <div className="flex-1 border-2 border-dashed border-border rounded-xl p-6 text-center">
                  <Upload className="w-6 h-6 text-secondary mx-auto mb-2" />
                  <p className="text-xs text-secondary">拖放上传 Logo</p>
                  <p className="text-xs text-secondary/60">SVG, PNG, JPG (最大 2MB)</p>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
              <h3 className="font-semibold text-primary mb-4">本地化</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-secondary mb-1">系统语言</label>
                  <select value={settings.language || 'zh-CN'} onChange={(e) => update('language', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-xl text-sm">
                    <option value="zh-CN">中文 (简体)</option>
                    <option value="en-US">English</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-secondary mb-1">时区</label>
                  <select value={settings.timezone || 'Asia/Shanghai'} onChange={(e) => update('timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-xl text-sm">
                    <option value="Asia/Shanghai">(UTC+08:00) 北京</option>
                    <option value="America/New_York">(UTC-05:00) 纽约</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
              <h3 className="font-semibold text-primary mb-4">数据管理</h3>
              <div>
                <label className="block text-xs text-secondary mb-1">自动备份频率</label>
                <select value={settings.backup_frequency || 'weekly'} onChange={(e) => update('backup_frequency', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl text-sm mb-3">
                  <option value="daily">每天</option>
                  <option value="weekly">每周</option>
                  <option value="monthly">每月</option>
                </select>
                <p className="text-xs text-secondary">上次备份: {settings.last_backup ? new Date(settings.last_backup).toLocaleString('zh-CN') : '未知'}</p>
                <button onClick={handleBackup} className="text-xs text-tertiary hover:underline mt-1">触发手动备份</button>
              </div>
            </div>
          </div>
        )}

        {tab === 'borrowing' && (
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm max-w-2xl">
            <h3 className="font-semibold text-primary mb-4">借阅规则配置</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'borrow_days', label: '默认借阅天数' },
                { key: 'max_renewals', label: '最大续借次数' },
                { key: 'overdue_fine_per_day', label: '逾期罚金 (每天)' },
                { key: 'max_books_undergrad', label: '本科生借阅上限' },
                { key: 'max_books_grad', label: '研究生借阅上限' },
                { key: 'max_books_faculty', label: '教职工借阅上限' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-secondary mb-1">{label}</label>
                  <input value={settings[key] || ''} onChange={(e) => update(key, e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'security' && (
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
              <h3 className="font-semibold text-primary mb-4">管理员资料</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                  {user?.name?.[0] || 'A'}
                </div>
                <div>
                  <p className="font-semibold">{user?.name || settings.admin_name}</p>
                  <p className="text-xs text-secondary">{user?.role || settings.admin_role}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-secondary mb-1">邮箱</label>
                  <input value={user?.email || settings.admin_email || ''} readOnly
                    className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-neutral" />
                </div>
                <div>
                  <label className="block text-xs text-secondary mb-1">密码</label>
                  <div className="flex gap-2">
                    <input type="password" value="••••••••" readOnly
                      className="flex-1 px-3 py-2 border border-border rounded-xl text-sm bg-neutral" />
                    <button onClick={() => setShowPasswordModal(true)} className="px-3 py-2 text-sm text-tertiary border border-border rounded-xl hover:bg-neutral">修改</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-primary">网络访问白名单</h3>
                <button onClick={() => setShowIpModal(true)} className="flex items-center gap-1 text-xs text-tertiary hover:underline">
                  <Plus className="w-3 h-3" /> 添加 IP 规则
                </button>
              </div>
              <div className="space-y-2">
                {ipList.map((ip) => (
                  <div key={ip.id} className="flex items-center justify-between p-3 bg-neutral rounded-xl">
                    <div>
                      <p className="text-sm font-medium">{ip.name}</p>
                      <p className="text-xs text-secondary font-mono">{ip.ip_range}</p>
                    </div>
                    <button onClick={() => handleDeleteIp(ip.id)} className="p-1.5 hover:bg-white rounded-lg"><Trash2 className="w-4 h-4 text-secondary" /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
              <h3 className="font-semibold text-primary mb-4">身份验证</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">多因素认证 (MFA)</p>
                    <p className="text-xs text-secondary">登录时需要验证器应用代码</p>
                  </div>
                  <Toggle checked={settings.mfa_enabled === 'true'} onChange={(v) => update('mfa_enabled', String(v))} />
                </div>
                <div>
                  <label className="block text-xs text-secondary mb-1">空闲会话超时</label>
                  <select value={settings.session_timeout || '30'} onChange={(e) => update('session_timeout', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-xl text-sm">
                    <option value="15">15 分钟</option>
                    <option value="30">30 分钟 (建议)</option>
                    <option value="60">60 分钟</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-primary">安全审计日志</h3>
                <button onClick={() => setShowAllLogs(!showAllLogs)} className="text-xs text-tertiary hover:underline">
                  {showAllLogs ? '收起' : '查看全部日志 →'}
                </button>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-secondary border-b border-border">
                    <th className="pb-2 text-left font-medium">时间戳</th>
                    <th className="pb-2 text-left font-medium">事件类型</th>
                    <th className="pb-2 text-left font-medium">IP 地址</th>
                    <th className="pb-2 text-left font-medium">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {(showAllLogs ? auditLogs : auditLogs.slice(0, 4)).map((log) => (
                    <tr key={log.id} className="border-b border-border/50">
                      <td className="py-2 text-secondary">{new Date(log.created_at).toLocaleString('zh-CN')}</td>
                      <td className="py-2">{log.event_type}</td>
                      <td className="py-2 font-mono">{log.ip_address}</td>
                      <td className="py-2"><StatusBadge status={log.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'notifications' && (
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
              <h3 className="font-semibold text-primary mb-4">系统触发器</h3>
              <div className="space-y-4">
                {[
                  { key: 'notify_overdue', label: '图书逾期提醒', desc: '图书逾期时自动发送提醒' },
                  { key: 'notify_reservation', label: '预约到达通知', desc: '预约图书到馆时通知读者' },
                  { key: 'notify_maintenance', label: '系统维护公告', desc: '全局广播系统维护信息' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-secondary">{desc}</p>
                    </div>
                    <Toggle checked={settings[key] === 'true'} onChange={(v) => update(key, String(v))} />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
              <h3 className="font-semibold text-primary mb-4">发送渠道</h3>
              <div className="space-y-3">
                {[
                  { key: 'email_enabled', label: '邮件 (SMTP)', status: '已启用' },
                  { key: 'sms_enabled', label: '短信 (Twilio)', status: '已启用' },
                  { key: 'push_enabled', label: '系统推送 (Mobile App)', status: '待配置' },
                ].map(({ key, label, status }) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-neutral rounded-xl">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-secondary">{status}</p>
                    </div>
                    <Toggle checked={settings[key] === 'true'} onChange={(v) => update(key, String(v))} />
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-2 bg-surface rounded-2xl border border-border p-5 shadow-sm">
              <h3 className="font-semibold text-primary mb-4">模板编辑器 — 逾期通知</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-secondary mb-1">主题行</label>
                  <input value={settings.email_template_subject || ''} onChange={(e) => update('email_template_subject', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-xl text-sm font-mono" />
                </div>
                <div>
                  <label className="block text-xs text-secondary mb-1">消息正文 (支持 Markdown)</label>
                  <textarea value={settings.email_template_body || ''} onChange={(e) => update('email_template_body', e.target.value)}
                    rows={4} className="w-full px-3 py-2 border border-border rounded-xl text-sm font-mono resize-none" />
                </div>
              </div>
            </div>
          </div>
        )}

        {message && <p className="text-sm text-tertiary mb-4">{message}</p>}

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={handleDiscard} className="px-5 py-2.5 text-sm text-secondary border border-border rounded-xl hover:bg-neutral">放弃更改</button>
          <button onClick={handleSave}
            className="px-5 py-2.5 text-sm bg-primary text-white rounded-xl font-medium hover:bg-primary-light">
            {saved ? '已保存 ✓' : '保存配置'}
          </button>
        </div>
      </div>

      <Modal open={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="修改密码"
        footer={<>
          <button onClick={() => setShowPasswordModal(false)} className="px-4 py-2 text-sm text-secondary">取消</button>
          <button onClick={handleChangePassword} className="px-5 py-2 bg-primary text-white rounded-xl text-sm">确认修改</button>
        </>}>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">当前密码</label>
            <input type="password" value={passwordForm.current} onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">新密码</label>
            <input type="password" value={passwordForm.newPass} onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">确认新密码</label>
            <input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm" />
          </div>
        </div>
      </Modal>

      <Modal open={showIpModal} onClose={() => setShowIpModal(false)} title="添加 IP 规则"
        footer={<>
          <button onClick={() => setShowIpModal(false)} className="px-4 py-2 text-sm text-secondary">取消</button>
          <button onClick={handleAddIp} className="px-5 py-2 bg-primary text-white rounded-xl text-sm">添加</button>
        </>}>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">名称</label>
            <input value={ipForm.name} onChange={(e) => setIpForm({ ...ipForm, name: e.target.value })}
              placeholder="主校区网络" className="w-full px-3 py-2.5 border border-border rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">IP 范围</label>
            <input value={ipForm.ip_range} onChange={(e) => setIpForm({ ...ipForm, ip_range: e.target.value })}
              placeholder="192.168.1.0/24" className="w-full px-3 py-2.5 border border-border rounded-xl text-sm font-mono" />
          </div>
        </div>
      </Modal>
    </>
  );
}
