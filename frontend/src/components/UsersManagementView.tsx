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
  Lock,
  Briefcase
} from 'lucide-react';
import { UserAccount, StaffMemberItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { Pagination } from './ui/Pagination';
import { usePagination } from '../hooks/usePagination';

export const UsersManagementView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [staffList, setStaffList] = useState<StaffMemberItem[]>([]);
  const [formData, setFormData] = useState({
    staffId: '',
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
      const res = await fetch('/api/users', { cache: 'no-store' });
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

  // Fetch staff members to link with user accounts
  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/hr/staff', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setStaffList(data.filter((s: StaffMemberItem) => s.status === 'Active'));
        }
      }
    } catch (err) {
      console.warn('Failed to fetch staff members for user linking:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStaff();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
    fetchStaff();
  };

  const handleStaffSelect = (selectedId: string) => {
    const selectedStaff = staffList.find(s => s.id === selectedId);
    setFormData(prev => ({
      ...prev,
      staffId: selectedId,
      name: selectedStaff ? selectedStaff.name : prev.name,
    }));
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      staffId: '',
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
      staffId: user.staffId || '',
      username: user.username,
      name: user.name || '',
      password: '',
      role: user.role,
    });
    setFormError(null);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!editingUser && !formData.staffId) {
      setFormError('يرجى اختيار الموظف لربط الحساب به.');
      return;
    }

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
          staffId: formData.staffId || undefined,
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

  // Luxury Pagination Controller
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedData: paginatedUsers,
    resetPage,
  } = usePagination(filteredUsers, { initialPageSize: 10 });

  useEffect(() => {
    resetPage();
  }, [searchQuery]);

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
        <div className="p-5 rounded-2xl bg-gradient-to-br from-white via-[#fcfaf6] to-[#f8f5ee] dark:from-stone-900 dark:via-stone-900/90 dark:to-stone-950 border border-stone-200/90 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-500 dark:text-stone-400">إجمالي الحسابات</p>
            <h3 className="text-2xl font-black text-[#0f3b2c] dark:text-emerald-400 mt-1">{users.length}</h3>
            <span className="text-[11px] text-stone-400">حسابات نشطة في النظام</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#0f3b2c]/10 text-[#0f3b2c] dark:bg-emerald-500/10 dark:text-emerald-400 border border-[#0f3b2c]/15 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-white via-[#fcfaf6] to-[#f8f5ee] dark:from-stone-900 dark:via-stone-900/90 dark:to-stone-950 border border-stone-200/90 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-800 dark:text-amber-400">المدراء العامون (ADMIN)</p>
            <h3 className="text-2xl font-black text-amber-800 dark:text-amber-300 mt-1">{adminsCount}</h3>
            <span className="text-[11px] text-stone-400 font-medium">كامل صلاحيات النظام والتقارير</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-white via-[#fcfaf6] to-[#f8f5ee] dark:from-stone-900 dark:via-stone-900/90 dark:to-stone-950 border border-stone-200/90 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-500 dark:text-stone-400">موظفو الاستقبال (RECEPTIONIST)</p>
            <h3 className="text-2xl font-black text-stone-900 dark:text-white mt-1">{receptionCount}</h3>
            <span className="text-[11px] text-stone-400">إدارة الحجوزات والعملاء والخدمات</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#0f3b2c]/10 text-[#0f3b2c] dark:bg-emerald-500/10 dark:text-emerald-400 border border-[#0f3b2c]/15 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. SEARCH & FILTER BAR */}
      {/* ======================================================== */}
      <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl p-3.5 rounded-2xl border border-stone-200/90 dark:border-white/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="بحث باسم المستخدم أو الاسم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-stone-200/90 dark:border-stone-700 bg-white/90 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-medium focus:outline-hidden focus:border-[#0f3b2c] shadow-2xs placeholder-stone-400 transition-colors"
          />
        </div>

        <div className="text-xs text-stone-500 dark:text-stone-400 font-medium mr-auto">
          عرض <span className="font-bold text-stone-800 dark:text-stone-200">{filteredUsers.length}</span> من أصل <span className="font-bold text-stone-800 dark:text-stone-200">{users.length}</span> مستخدم
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. USERS DATA TABLE */}
      {/* ======================================================== */}
      <div className="bg-white/85 dark:bg-stone-900/85 backdrop-blur-xl rounded-3xl border border-stone-200/90 dark:border-white/10 shadow-[0_15px_40px_-12px_rgba(15,59,44,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="sticky top-0 z-10 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200/90 dark:border-stone-800 shadow-2xs">
              <tr className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                <th className="py-3.5 px-5">اسم المستخدم (Username)</th>
                <th className="py-3.5 px-5">الاسم المعروض</th>
                <th className="py-3.5 px-5">الموظف المرتبط (HR)</th>
                <th className="py-3.5 px-5">الصلاحية (Role)</th>
                <th className="py-3.5 px-5">كلمة المرور</th>
                <th className="py-3.5 px-5">تاريخ الإنشاء</th>
                <th className="py-3.5 px-5 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="w-6 h-6 border-2 border-[#0f3b2c] border-t-transparent rounded-full animate-spin" />
                      <span>جاري تحميل بيانات المستخدمين من قاعدة البيانات...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    لا يوجد مستخدمون مطابقون لمعايير البحث.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u, index) => {
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

                      {/* Linked Staff Member */}
                      <td className="py-3.5 px-5">
                        {u.staffName ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                            <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{u.staffName}</span>
                            {u.staffRole && (
                              <span className="text-[10px] text-emerald-600 font-normal">({u.staffRole})</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-stone-400 text-xs font-normal">غير مرتبط</span>
                        )}
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

                      {/* Password Security Status */}
                      <td className="py-3.5 px-5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50/80 border border-emerald-200/80 text-emerald-800 text-xs font-semibold" title="كلمة المرور مشفرة ومحمية بـ Hash أمني بالخادم">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>مشفرة وآمنة</span>
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

        <Pagination
          currentPage={currentPage}
          totalItems={filteredUsers.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 20, 50, 100]}
          itemLabel="مستخدم"
        />
      </div>

      {/* ======================================================== */}
      {/* 5. ADD / EDIT USER MODAL */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0f3b2c]/25 backdrop-blur-md">
          <div className="bg-gradient-to-b from-[#fdfbf7] via-[#fcfaf5] to-[#f7f4ed] dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 rounded-3xl shadow-[0_25px_70px_-15px_rgba(15,59,44,0.22)] border border-stone-200/90 dark:border-white/10 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-stone-200/70 dark:border-stone-800 flex items-center justify-between bg-white/60 dark:bg-stone-900/60 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0f3b2c]/10 dark:bg-emerald-500/10 flex items-center justify-center border border-[#0f3b2c]/15 text-[#0f3b2c] dark:text-emerald-400">
                  <KeyRound className="w-5 h-5 text-[#0f3b2c] dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-stone-900 dark:text-stone-100">
                    {editingUser ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    {editingUser ? `تحديث حساب @${editingUser.username}` : 'إنشاء حساب جديد وتعيين الصلاحيات'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
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

              {/* Select Staff Member Dropdown (Link to HR) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                    اختيار الموظف (Select Staff Member) {!editingUser && <span className="text-rose-500">*</span>}
                  </label>
                  <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    ربط بالموارد البشرية
                  </span>
                </div>
                <select
                  required={!editingUser}
                  value={formData.staffId}
                  onChange={(e) => handleStaffSelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200/90 dark:border-stone-700 text-xs font-semibold focus:outline-hidden focus:border-[#0f3b2c] focus:ring-2 focus:ring-[#0f3b2c]/10 bg-white/90 dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                >
                  <option value="">-- اختر الموظف لربط الحساب به --</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.role}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-stone-400">
                  يتم ربط حساب الدخول بسجل الموظف وتعبئة الاسم المعروض تلقائياً
                </p>
              </div>

              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                  اسم المستخدم (Username) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: dr_ahmed أو receptionist_1"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200/90 dark:border-stone-700 text-xs font-mono font-medium focus:outline-hidden focus:border-[#0f3b2c] focus:ring-2 focus:ring-[#0f3b2c]/10 bg-white/90 dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                />
              </div>

              {/* Display Name Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                  الاسم المعروض (Display Name)
                </label>
                <input
                  type="text"
                  placeholder="مثال: د. أحمد حسام أو مروة سعيد"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200/90 dark:border-stone-700 text-xs font-medium focus:outline-hidden focus:border-[#0f3b2c] focus:ring-2 focus:ring-[#0f3b2c]/10 bg-white/90 dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
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
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200/90 dark:border-stone-700 text-xs font-mono font-medium focus:outline-hidden focus:border-[#0f3b2c] focus:ring-2 focus:ring-[#0f3b2c]/10 bg-white/90 dark:bg-stone-800 text-stone-800 dark:text-stone-200"
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
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                  الصلاحية ونطاق الوصول (Role) *
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'ADMIN' })}
                    className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col gap-1 ${
                      formData.role === 'ADMIN'
                        ? 'border-[#0f3b2c] bg-emerald-50/80 dark:bg-emerald-950/40 shadow-xs ring-1 ring-[#0f3b2c]/20'
                        : 'border-stone-200 hover:bg-stone-50/80 dark:border-stone-700 dark:hover:bg-stone-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#0f3b2c] dark:text-emerald-400">مدير عام</span>
                      <ShieldCheck className="w-4 h-4 text-[#0f3b2c] dark:text-emerald-400" />
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
                        ? 'border-[#0f3b2c] bg-emerald-50/80 dark:bg-emerald-950/40 shadow-xs ring-1 ring-[#0f3b2c]/20'
                        : 'border-stone-200 hover:bg-stone-50/80 dark:border-stone-700 dark:hover:bg-stone-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#0f3b2c] dark:text-emerald-400">موظف استقبال</span>
                      <UserCheck className="w-4 h-4 text-[#0f3b2c] dark:text-emerald-400" />
                    </div>
                    <span className="text-[10px] text-stone-500 leading-tight">
                      الحجوزات، العملاء، الخدمات فقط
                    </span>
                  </button>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-stone-200/70 dark:border-stone-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={modalLoading}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-white/80 dark:hover:bg-stone-800 text-xs font-bold cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#0f3b2c] hover:bg-[#164e3b] active:bg-[#0c2e22] text-[#fbf8ee] text-xs font-bold shadow-md shadow-emerald-950/10 cursor-pointer transition-all flex items-center gap-2"
                >
                  {modalLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0f3b2c]/25 backdrop-blur-md">
          <div className="bg-gradient-to-b from-[#fdfbf7] via-[#fcfaf5] to-[#f7f4ed] dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 rounded-3xl shadow-[0_25px_70px_-15px_rgba(15,59,44,0.22)] border border-stone-200/90 dark:border-white/10 max-w-sm w-full p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200/70 shadow-xs">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-black text-stone-900 dark:text-stone-100 text-base">
                تأكيد حذف المستخدم
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                هل أنت متأكد من رغبتك في حذف حساب المستخدم{' '}
                <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
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
                className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-white/80 dark:hover:bg-stone-800 text-xs font-bold cursor-pointer transition-colors"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold cursor-pointer transition-all flex items-center gap-2 shadow-md shadow-rose-950/10"
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
