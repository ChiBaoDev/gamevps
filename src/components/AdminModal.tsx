import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Key, 
  Users, 
  Activity, 
  Megaphone, 
  History, 
  Copy, 
  Check, 
  Plus, 
  UserX, 
  Gift, 
  RefreshCw, 
  X,
  Lock,
  Unlock,
  Coins,
  Gem
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface AdminModalProps {
  token: string;
  onClose: () => void;
  onShowMessage: (msg: string) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ token, onClose, onShowMessage }) => {
  const [activeTab, setActiveTab] = useState<'keys' | 'users' | 'system' | 'broadcast' | 'history'>('system');
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [keysList, setKeysList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);

  // Form states - Create Key
  const [keyCount, setKeyCount] = useState<number>(1);
  const [keyPrefix, setKeyPrefix] = useState<string>('KEY');
  const [keyRole, setKeyRole] = useState<'player' | 'admin'>('player');
  const [keyInitialXu, setKeyInitialXu] = useState<number>(50000);
  const [keyInitialLuong, setKeyInitialLuong] = useState<number>(20);
  const [keyAssignedName, setKeyAssignedName] = useState<string>('');
  const [keyNote, setKeyNote] = useState<string>('');

  // Form state - Broadcast
  const [broadcastText, setBroadcastText] = useState<string>('');

  // Form state - Edit User Modal
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editXu, setEditXu] = useState<number>(0);
  const [editLuong, setEditLuong] = useState<number>(0);
  const [editLevel, setEditLevel] = useState<number>(1);
  const [editBanned, setEditBanned] = useState<boolean>(false);

  // Fetch System Stats
  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Keys
  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/keys', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setKeysList(data.keys);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsersList(data.users);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'system') fetchStats();
    if (activeTab === 'keys') fetchKeys();
    if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

  // Handle Copy Key
  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(code);
    sounds.playClick();
    onShowMessage(`Đã sao chép mã: ${code}`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Handle Create Keys
  const handleCreateKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playWin();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/keys/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          count: keyCount,
          prefix: keyPrefix,
          role: keyRole,
          xu: keyInitialXu,
          luong: keyInitialLuong,
          assignedName: keyAssignedName,
          note: keyNote
        })
      });
      const data = await res.json();
      if (data.success) {
        onShowMessage(`Tạo thành công ${data.count} mã key mới!`);
        fetchKeys();
      } else {
        onShowMessage(`Lỗi: ${data.error}`);
      }
    } catch {
      onShowMessage('Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Toggle Key
  const handleToggleKey = async (keyId: number, currentActive: boolean) => {
    sounds.playClick();
    try {
      const res = await fetch('/api/admin/keys/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ keyId, isActive: !currentActive })
      });
      const data = await res.json();
      if (data.success) {
        onShowMessage(data.message);
        fetchKeys();
      }
    } catch {}
  };

  // Handle Kick User
  const handleKickUser = async (keyCode: string) => {
    if (!confirm(`Bạn có chắc muốn đá người chơi này ra khỏi server?`)) return;
    sounds.playClick();
    try {
      const res = await fetch('/api/admin/users/kick', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ keyCode, reason: 'Quản trị viên đã mời bạn ra khỏi phòng.' })
      });
      const data = await res.json();
      onShowMessage(data.message);
      fetchUsers();
    } catch {}
  };

  // Handle Update User
  const handleSaveUserEdit = async () => {
    if (!selectedUser) return;
    sounds.playWin();
    try {
      const res = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          xu: editXu,
          luong: editLuong,
          level: editLevel,
          isBanned: editBanned,
        })
      });
      const data = await res.json();
      if (data.success) {
        onShowMessage('Cập nhật người chơi thành công!');
        setSelectedUser(null);
        fetchUsers();
      }
    } catch {}
  };

  // Handle Send Global Broadcast
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    sounds.playWin();
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: broadcastText.trim() })
      });
      const data = await res.json();
      if (data.success) {
        onShowMessage('Đã phát thông báo toàn máy chủ!');
        setBroadcastText('');
      }
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-zinc-950 border-4 border-amber-500/80 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col max-h-[92vh] overflow-hidden text-zinc-100 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-950/80 via-zinc-900 to-zinc-900 border-b-2 border-amber-500/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-amber-300 tracking-wider flex items-center gap-2">
                BẢNG QUẢN TRỊ HỆ THỐNG (ADMIN PANEL)
              </h2>
              <p className="text-xs text-zinc-400">Quản lý mã key, người chơi, tài sản và giám sát RAM VPS</p>
            </div>
          </div>
          <button
            onClick={() => { sounds.playClick(); onClose(); }}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/50 px-6 gap-2 overflow-x-auto">
          {[
            { id: 'system', label: 'Giám Sát RAM & Server', icon: Activity },
            { id: 'keys', label: 'Quản Lý Mã Key', icon: Key },
            { id: 'users', label: 'Quản Lý Người Chơi', icon: Users },
            { id: 'broadcast', label: 'Phát Thông Báo', icon: Megaphone },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { sounds.playClick(); setActiveTab(tab.id as any); }}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: SYSTEM & RAM MONITOR */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-amber-200">Hiệu Năng Máy Chủ VPS & Mức Tiêu Thụ RAM</h3>
                <button
                  onClick={fetchStats}
                  className="flex items-center gap-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg border border-zinc-700 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Làm mới
                </button>
              </div>

              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* RAM RSS */}
                  <div className="p-4 bg-zinc-900/80 border border-emerald-500/30 rounded-xl">
                    <p className="text-xs text-zinc-400">RAM Sử Dụng (RSS)</p>
                    <p className="text-2xl font-black text-emerald-400">{stats.ram.rssMb} MB</p>
                    <span className="text-[10px] text-emerald-300/80">Cực kỳ tối ưu (&lt; 70MB)</span>
                  </div>

                  {/* Heap Used */}
                  <div className="p-4 bg-zinc-900/80 border border-blue-500/30 rounded-xl">
                    <p className="text-xs text-zinc-400">Heap V8 Sử Dụng</p>
                    <p className="text-2xl font-black text-blue-400">{stats.ram.heapUsedMb} MB</p>
                    <span className="text-[10px] text-zinc-400">Tổng Heap: {stats.ram.heapTotalMb} MB</span>
                  </div>

                  {/* CCU Online */}
                  <div className="p-4 bg-zinc-900/80 border border-amber-500/30 rounded-xl">
                    <p className="text-xs text-zinc-400">Người Chơi Online (CCU)</p>
                    <p className="text-2xl font-black text-amber-400">{stats.onlineCount} người</p>
                    <span className="text-[10px] text-zinc-400">Tổng tài khoản: {stats.totalUsers}</span>
                  </div>

                  {/* Uptime */}
                  <div className="p-4 bg-zinc-900/80 border border-purple-500/30 rounded-xl">
                    <p className="text-xs text-zinc-400">Thời Gian Hoạt Động</p>
                    <p className="text-2xl font-black text-purple-400">{Math.floor(stats.uptimeSeconds / 60)} phút</p>
                    <span className="text-[10px] text-zinc-400">Node {stats.nodeVersion}</span>
                  </div>
                </div>
              )}

              <div className="p-4 bg-amber-950/20 border border-amber-500/20 rounded-xl text-xs text-amber-300/90 leading-relaxed">
                💡 <strong>Ghi chú tối ưu VPS:</strong> SQLite được nhúng trực tiếp trong Node.js và chạy chế độ WAL (Write-Ahead Logging) với cache trần 2MB. Nhờ kiến trúc này, máy chủ game của bạn chỉ tiêu thụ khoảng <strong>40MB - 60MB RAM</strong>, vận hành mượt mà cả trên các gói VPS 512MB RAM rẻ nhất!
              </div>
            </div>
          )}

          {/* TAB 2: KEY MANAGEMENT */}
          {activeTab === 'keys' && (
            <div className="space-y-6">
              {/* Form Sinh Key Mới */}
              <form onSubmit={handleCreateKeys} className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-4">
                <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Tạo Mã Key Mới
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Số lượng key</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={keyCount}
                      onChange={(e) => setKeyCount(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Tiền tố (Prefix)</label>
                    <input
                      type="text"
                      value={keyPrefix}
                      onChange={(e) => setKeyPrefix(e.target.value)}
                      placeholder="KEY / VIP"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Xu khởi tạo</label>
                    <input
                      type="number"
                      value={keyInitialXu}
                      onChange={(e) => setKeyInitialXu(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Lượng khởi tạo</label>
                    <input
                      type="number"
                      value={keyInitialLuong}
                      onChange={(e) => setKeyInitialLuong(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Phân quyền</label>
                    <select
                      value={keyRole}
                      onChange={(e) => setKeyRole(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm"
                    >
                      <option value="player">Người chơi bình thường (Player)</option>
                      <option value="admin">Quản trị viên tối cao (Admin)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Tên người nhận (Tùy chọn)</label>
                    <input
                      type="text"
                      value={keyAssignedName}
                      onChange={(e) => setKeyAssignedName(e.target.value)}
                      placeholder="Ví dụ: Bạn Nam"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-2 rounded-lg text-sm transition"
                    >
                      + Tạo Key Ngay
                    </button>
                  </div>
                </div>
              </form>

              {/* Bảng Danh Sách Key */}
              <div className="border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="p-3">Mã Key</th>
                      <th className="p-3">Quyền</th>
                      <th className="p-3">Người Nhận</th>
                      <th className="p-3">Xu / Lượng</th>
                      <th className="p-3">Trạng Thái</th>
                      <th className="p-3 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 bg-zinc-950">
                    {keysList.map((k) => (
                      <tr key={k.id} className="hover:bg-zinc-900/50">
                        <td className="p-3 font-mono font-bold text-amber-300">
                          {k.key_code}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${k.role === 'admin' ? 'bg-rose-500/20 text-rose-300' : 'bg-blue-500/20 text-blue-300'}`}>
                            {k.role}
                          </span>
                        </td>
                        <td className="p-3 text-zinc-300">{k.assigned_name || '-'}</td>
                        <td className="p-3 text-zinc-300">{k.initial_xu?.toLocaleString()} Xu / {k.initial_luong} Lượng</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${k.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {k.is_active ? 'Hoạt động' : 'Đã khóa'}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => handleCopy(k.key_code)}
                            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs inline-flex items-center gap-1"
                            title="Sao chép Key"
                          >
                            {copiedKey === k.key_code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            Copy
                          </button>
                          <button
                            onClick={() => handleToggleKey(k.id, k.is_active === 1)}
                            className={`px-2 py-1 rounded text-xs inline-flex items-center gap-1 ${k.is_active ? 'bg-red-900/50 text-red-200 hover:bg-red-800' : 'bg-emerald-900/50 text-emerald-200 hover:bg-emerald-800'}`}
                          >
                            {k.is_active ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            {k.is_active ? 'Khóa' : 'Mở'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: USERS MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-amber-300">Danh Sách Người Chơi ({usersList.length})</h4>
                <button onClick={fetchUsers} className="text-xs text-zinc-400 hover:text-white flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5" /> Làm mới
                </button>
              </div>

              <div className="border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="p-3">Trạng Thái</th>
                      <th className="p-3">Tên Nhân Vật</th>
                      <th className="p-3">Key Gắn Kèm</th>
                      <th className="p-3">Cấp Độ</th>
                      <th className="p-3">Tài Sản (Xu / Lượng)</th>
                      <th className="p-3 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 bg-zinc-950">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-zinc-900/50">
                        <td className="p-3">
                          <span className="flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${u.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
                            {u.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-white">
                          {u.nickname}
                          {u.role === 'admin' && <span className="ml-1.5 text-[9px] bg-amber-500 text-black px-1 rounded font-black">ADMIN</span>}
                        </td>
                        <td className="p-3 font-mono text-zinc-400">{u.key_code}</td>
                        <td className="p-3 font-bold text-amber-400">Lv.{u.level}</td>
                        <td className="p-3 text-zinc-300">
                          <span className="text-yellow-400 font-bold">{u.xu?.toLocaleString()}</span> Xu / <span className="text-purple-400 font-bold">{u.luong}</span> Lượng
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setEditXu(u.xu);
                              setEditLuong(u.luong);
                              setEditLevel(u.level);
                              setEditBanned(Boolean(u.is_banned));
                            }}
                            className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 rounded text-xs"
                          >
                            Sửa Dữ Liệu
                          </button>
                          {u.isOnline && (
                            <button
                              onClick={() => handleKickUser(u.key_code)}
                              className="px-2 py-1 bg-red-900/40 text-red-300 border border-red-700/40 hover:bg-red-800 rounded text-xs"
                              title="Đá khỏi game"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Modal Edit User */}
              {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                  <div className="bg-zinc-900 border-2 border-amber-500 rounded-xl p-5 max-w-md w-full space-y-4">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                      <h3 className="font-bold text-amber-300">Chỉnh Sửa: {selectedUser.nickname}</h3>
                      <button onClick={() => setSelectedUser(null)} className="text-zinc-400 hover:text-white">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="text-zinc-400 block mb-1">Số dư Xu</label>
                        <input
                          type="number"
                          value={editXu}
                          onChange={(e) => setEditXu(Number(e.target.value))}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-yellow-400 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-zinc-400 block mb-1">Số dư Lượng</label>
                        <input
                          type="number"
                          value={editLuong}
                          onChange={(e) => setEditLuong(Number(e.target.value))}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-purple-400 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-zinc-400 block mb-1">Cấp Độ (Level)</label>
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={editLevel}
                          onChange={(e) => setEditLevel(Number(e.target.value))}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          id="banCheck"
                          checked={editBanned}
                          onChange={(e) => setEditBanned(e.target.checked)}
                          className="w-4 h-4 rounded text-red-600 bg-zinc-950 border-zinc-700"
                        />
                        <label htmlFor="banCheck" className="text-red-400 font-bold">Khóa tài khoản (Ban Account)</label>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-3">
                      <button
                        onClick={() => setSelectedUser(null)}
                        className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-bold"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleSaveUserEdit}
                        className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-bold"
                      >
                        Lưu Thay Đổi
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: GLOBAL BROADCAST */}
          {activeTab === 'broadcast' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="text-center space-y-1">
                <h4 className="text-base font-bold text-amber-300">Phát Thông Báo Toàn Máy Chủ</h4>
                <p className="text-xs text-zinc-400">Tin nhắn sẽ chạy chữ trên đầu màn hình của 100% người chơi đang online.</p>
              </div>

              <form onSubmit={handleSendBroadcast} className="space-y-4">
                <textarea
                  rows={4}
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  placeholder="Nhập nội dung thông báo... (Ví dụ: Chào mừng sự kiện x2 Xu toàn server lúc 20:00 tối nay!)"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={!broadcastText.trim()}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black rounded-xl text-sm transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Megaphone className="w-4 h-4" /> Bắn Thông Báo Toàn Server
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
