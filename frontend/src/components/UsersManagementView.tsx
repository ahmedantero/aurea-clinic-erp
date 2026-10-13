import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  UserCheck, 
  Search, 
  RefreshCw, 
  Edit3, 
  Trash2, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  AlertCircle, 
  ShieldAlert,
  Sparkles,
  Lock
} from 'lucide-react';
import { UserAccount } from '../types';
import { useAuth } from '../context/AuthContext';

export const UsersManagementView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    role: 'RECEPTIONIST' as 'ADMIN' | 'RECEPTIONIST',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [modalLoading, setModalLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete modal state
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserAccount | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setUsers(data);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch users from database:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      name: '',
      password: '',
      role: 'RECEPTIONIST',
    });
    setFormError(null);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserAccount) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      name: user.name || '',
      password: user.password || '',
      role: user.role,
    });
    setFormError(null);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.username.trim()) {
      setFormError('يرجى إدخال اسم المستخدم.');
      return;
    }
    if (!editingUser && !formData.password.trim()) {
      setFormError('يرجى إدخال كلمة المرور للمستخدم الجديد.');
      return;
    }

    setModalLoading(true);
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username.trim(),
          name: formData.name.trim() || undefined,
          password: formData.password.trim() || undefined,
          role: formData.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'حدث خطأ أثناء حفظ البيانات.');
        return;
      }

      if (editingUser) {
        setUsers((prev) =>
          prev.map((u) => (u.id === editingUser.id ? { ...u, ...data } : u))
        );
      } else {
        setUsers((prev) => [...prev, data]);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'فشل الاتصال بالخادم.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmUser) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/users/${deleteConfirmUser.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'فشل حذف المستخدم');
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== deleteConfirmUser.id));
      setDeleteConfirmUser(null);
    } catch (err: any) {
      alert(err?.message || 'فشل حذف المستخدم');
    } finally {
      setDeleteLoading(false);
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      (u.name && u.name.toLowerCase().includes(q))
    );
  });

  const adminsCount = users.filter((u) => u.role === 'ADMIN').length;
  const receptionCount = users.filter((u) => u.role === 'RECEPTIONIST').length;

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. TOP HEADER & ACTIONS */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/80">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0f3b2c] text-[#d4af37] flex items-center justify-center border border-[#d4af37]/40 shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#0f3b2c] tracking-tight">
              إدارة المستخدمين والصلاحيات
            </h1>
            <p className="text-xs text-stone-500 font-medium">
              التحكم في حسابات النظام، تخصيص أدوار المدراء وموظفي الاستقبال، وتأمين كلمات المرور
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-stone-200 bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-all cursor-pointer shadow-2xs"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-700' : ''}`} />
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0f3b2c] hover:bg-[#144c39] active:bg-[#0c2e22] text-[#fbf8ee] text-xs font-bold border border-[#d4af37]/40 shadow-md shadow-emerald-950/10 cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <UserPlus className="w-4 h-4 text-amber-300" />
            <span>إضافة مستخدم جديد</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. SUMMARY KPI STATS CARDS */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-stone-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-400">إجمالي الحسابات</p>
            <h3 className="text-2xl font-black text-[#0f3b2c] mt-1">{users.length}</h3>
            <span className="text-[11px] text-stone-500">حسابات نشطة في النظام</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-[#d4af37]/30 shadow-xs flex items-center justify-between bg-gradient-to-tr from-white via-white to-amber-50/40">
          <div>
            <p className="text-xs font-bold text-[#0f3b2c]">المدراء العامون (ADMIN)</p>
            <h3 className="text-2xl font-black text-amber-800 mt-1">{adminsCount}</h3>
            <span className="text-[11px] text-amber-900/80 font-medium">كامل صلاحيات النظام والتقارير</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200">
            <ShieldCheck className="w-5 h-5 text-amber-700" />
          </div>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-stone-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-600">موظفو الاستقبال (RECEPTIONIST)</p>
            <h3 className="text-2xl font-black text-stone-800 mt-1">{receptionCount}</h3>
            <span className="text-[11px] text-stone-500">إدارة الحجوزات والعملاء والخدمات</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center border border-stone-200">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. SEARCH & FILTER BAR */}
      {/* ======================================================== */}
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="بحث باسم المستخدم أو الاسم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-3 py-2 rounded-xl border border-stone-200 text-xs font-medium focus:outline-hidden focus:border-[#0f3b2c] focus:ring-2 focus:ring-[#0f3b2c]/10"
          />
        </div>

        <div className="text-xs text-stone-400 font-medium mr-auto">
          عرض <span className="font-bold text-stone-700">{filteredUsers.length}</span> من أصل <span className="font-bold text-stone-700">{users.length}</span> مستخدم
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. USERS DATA TABLE */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-[#0f3b2c] text-[#fbf8ee] text-xs font-bold border-b border-emerald-950/20">
                <th className="py-3.5 px-5">اسم المستخدم (Username)</th>
                <th className="py-3.5 px-5">الاسم المعروض</th>
                <th className="py-3.5 px-5">الصلاحية (Role)</th>
                <th className="py-3.5 px-5">كلمة المرور</th>
                <th className="py-3.5 px-5">تاريخ الإنشاء</th>
                <th className="py-3.5 px-5 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="w-6 h-6 border-2 border-[#0f3b2c] border-t-transparent rounded-full animate-spin" />
                      <span>جاري تحميل بيانات المستخدمين من قاعدة البيانات...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    لا يوجد مستخدمون مطابقون لمعايير البحث.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, index) => {
                  const isAdminRole = u.role === 'ADMIN';
                  const isMainAdmin = u.username.toLowerCase() === 'admin';
                  const isCurrent = currentUser?.username === u.username;
                  const isPasswordVisible = visiblePasswords[u.id] || false;

                  return (
                    <tr 
                      key={u.id}
                      className={`hover:bg-[#faf8f4]/80 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-stone-50/40'
                      }`}
                    >
                      {/* Username */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                            isAdminRole
                              ? 'bg-[#0f3b2c] text-amber-300 border border-[#d4af37]/40 shadow-2xs'
                              : 'bg-stone-100 text-stone-700 border border-stone-200'
                          }`}>
                            {isAdminRole ? 'A' : 'R'}
                          </div>
                          <div>
                            <span className="font-mono font-bold text-stone-800 text-sm">
                              {u.username}
                            </span>
                            {isCurrent && (
                              <span className="mr-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                أنت
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Display Name */}
                      <td className="py-3.5 px-5 font-bold text-stone-700">
                        {u.name || (isAdminRole ? 'المدير العام' : 'موظف استقبال')}
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isAdminRole
                            ? 'bg-amber-100 text-amber-900 border border-amber-300/80 shadow-2xs'
                            : 'bg-stone-100 text-stone-700 border border-stone-200'
                        }`}>
                          {isAdminRole ? (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                              <span>مدير (ADMIN)</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5 text-stone-500" />
                              <span>استقبال (RECEPTIONIST)</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Password */}
                      <td className="py-3.5 px-5">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-stone-50 border border-stone-200 font-mono text-xs">
                          <span>
                            {isPasswordVisible ? (u.password || '••••••') : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(u.id)}
                            className="text-stone-400 hover:text-stone-700 cursor-pointer"
                            title={isPasswordVisible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                          >
                            {isPasswordVisible ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Created At */}
                      <td className="py-3.5 px-5 text-stone-500 text-[11px]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg text-stone-600 hover:text-[#0f3b2c] hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="تعديل بيانات المستخدم"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeleteConfirmUser(u)}
                            disabled={isMainAdmin}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isMainAdmin
                                ? 'text-stone-300 cursor-not-allowed'
                                : 'text-stone-400 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                            title={isMainAdmin ? 'لا يمكن حذف المسؤول الرئيسي' : 'حذف المستخدم'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. ADD / EDIT USER MODAL */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-[#0f3b2c] text-white flex items-center justify-between border-b border-[#d4af37]/30">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-[#d4af37]/40">
                  <KeyRound className="w-4 h-4 text-[#d4af37]" />
                </div>
                <div>
                  <h3 className="font-black text-base">
                    {editingUser ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}
                  </h3>
                  <p className="text-[11px] text-amber-200">
                    {editingUser ? `تحديث حساب @${editingUser.username}` : 'إنشاء حساب جديد وتعيين الصلاحيات'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">
                  اسم المستخدم (Username) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: dr_ahmed أو receptionist_1"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-mono font-medium focus:outline-hidden focus:border-[#0f3b2c] focus:ring-2 focus:ring-[#0f3b2c]/10"
                />
              </div>

              {/* Display Name Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">
                  الاسم المعروض (Display Name)
                </label>
                <input
                  type="text"
                  placeholder="مثال: د. أحمد حسام أو مروة سعيد"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-medium focus:outline-hidden focus:border-[#0f3b2c] focus:ring-2 focus:ring-[#0f3b2c]/10"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-stone-700">
                    كلمة المرور (Password) {editingUser ? '(اتركه فارغاً للإبقاء على الحالية)' : '*'}
                  </label>
                  <span className="text-[10px] text-stone-400">للتجربة: 123</span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!editingUser}
                    placeholder={editingUser ? '••••••••' : 'أدخل كلمة المرور'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-mono font-medium focus:outline-hidden focus:border-[#0f3b2c] focus:ring-2 focus:ring-[#0f3b2c]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold text-stone-700">
                  الصلاحية ونطاق الوصول (Role) *
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'ADMIN' })}
                    className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col gap-1 ${
                      formData.role === 'ADMIN'
                        ? 'border-[#d4af37] bg-amber-50/70 shadow-xs'
                        : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-900">مدير عام</span>
                      <ShieldCheck className="w-4 h-4 text-amber-700" />
                    </div>
                    <span className="text-[10px] text-stone-500 leading-tight">
                      كامل الصلاحيات والتقارير والمصروفات
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'RECEPTIONIST' })}
                    className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col gap-1 ${
                      formData.role === 'RECEPTIONIST'
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                        : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-950">موظف استقبال</span>
                      <UserCheck className="w-4 h-4 text-emerald-700" />
                    </div>
                    <span className="text-[10px] text-stone-500 leading-tight">
                      الحجوزات، العملاء، الخدمات فقط
                    </span>
                  </button>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={modalLoading}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#0f3b2c] hover:bg-[#144c39] active:bg-[#0c2e22] text-[#fbf8ee] text-xs font-extrabold border border-[#d4af37]/40 shadow-sm cursor-pointer transition-all flex items-center gap-2"
                >
                  {modalLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-amber-300" />
                      <span>{editingUser ? 'حفظ التعديلات' : 'إضافة المستخدم'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. DELETE CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-black text-stone-900 text-base">
                تأكيد حذف المستخدم
              </h3>
              <p className="text-xs text-stone-500">
                هل أنت متأكد من رغبتك في حذف حساب المستخدم{' '}
                <span className="font-mono font-bold text-stone-800">
                  @{deleteConfirmUser.username}
                </span>
                ؟ لن يتمكن من تسجيل الدخول بعد الآن.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                disabled={deleteLoading}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold cursor-pointer transition-colors"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold cursor-pointer transition-all flex items-center gap-2 shadow-sm"
              >
                {deleteLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>جاري الحذف...</span>
                  </>
                ) : (
                  <span>نعم، حذف الحساب</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
