import React, { useState } from 'react';
import { 
  Sparkles, 
  Layers, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Clock, 
  Tag, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  RotateCcw, 
  FolderTree,
  ChevronRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import { ServiceItem, CategoryItem, PackageItem } from '../types';

interface ServicesViewProps {
  services: ServiceItem[];
  categories: CategoryItem[];
  packages?: PackageItem[];
  onRefreshServices: () => void;
  onRefreshCategories: () => void;
  onRefreshPackages?: () => void;
  onAddService: (newService: ServiceItem) => void;
  onUpdateService: (updatedService: ServiceItem) => void;
  onDeleteService: (id: string) => void;
  onAddCategory: (newCategory: CategoryItem) => void;
  onUpdateCategory: (updatedCategory: CategoryItem) => void;
  onDeleteCategory: (id: string) => void;
  onAddPackage?: (newPackage: PackageItem) => void;
  onUpdatePackage?: (updatedPackage: PackageItem) => void;
  onDeletePackage?: (id: string) => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({
  services,
  categories,
  packages = [],
  onRefreshServices,
  onRefreshCategories,
  onRefreshPackages,
  onAddService,
  onUpdateService,
  onDeleteService,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddPackage,
  onUpdatePackage,
  onDeletePackage,
}) => {
  // Navigation tabs: 'services' | 'categories' | 'packages'
  const [activeTab, setActiveTab] = useState<'services' | 'categories' | 'packages'>('services');

  // Search & Filter
  const [serviceSearch, setServiceSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('الكل');
  const [categorySearch, setCategorySearch] = useState('');
  const [packageSearch, setPackageSearch] = useState('');

  // Service Modal state (Add / Edit)
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceCategoryId, setServiceCategoryId] = useState('');
  const [serviceBasePrice, setServiceBasePrice] = useState<string>('');
  const [serviceMaxPrice, setServiceMaxPrice] = useState<string>('');
  const [serviceDuration, setServiceDuration] = useState<string>('45');
  const [serviceSessionsCount, setServiceSessionsCount] = useState<number>(1);
  const [serviceModalError, setServiceModalError] = useState<string | null>(null);
  const [isSubmittingService, setIsSubmittingService] = useState(false);

  // Category Modal state (Add / Edit)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryModalError, setCategoryModalError] = useState<string | null>(null);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  // Package Modal state (Add / Edit)
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [packageName, setPackageName] = useState('');
  const [packageFixedPrice, setPackageFixedPrice] = useState<string>('');
  const [packageDiscountPercentage, setPackageDiscountPercentage] = useState<string>('');
  const [packageSessionsCount, setPackageSessionsCount] = useState<number>(6);
  const [packageModalError, setPackageModalError] = useState<string | null>(null);
  const [isSubmittingPackage, setIsSubmittingPackage] = useState(false);

  // Combined refresh
  const handleRefreshAll = () => {
    onRefreshServices();
    onRefreshCategories();
    if (onRefreshPackages) onRefreshPackages();
  };

  // ==========================================
  // SERVICE ACTIONS
  // ==========================================
  const handleOpenAddServiceModal = () => {
    setEditingServiceId(null);
    setServiceName('');
    setServiceCategoryId(categories.length > 0 ? categories[0].id : '');
    setServiceBasePrice('');
    setServiceMaxPrice('');
    setServiceDuration('45');
    setServiceSessionsCount(1);
    setServiceModalError(null);
    setIsServiceModalOpen(true);
  };

  const handleOpenEditServiceModal = (service: ServiceItem) => {
    setEditingServiceId(service.id);
    setServiceName(service.name);

    // Find category ID by name or direct ID
    const matchedCat = categories.find(
      (c) => c.id === service.categoryId || c.name === service.category
    );
    setServiceCategoryId(matchedCat ? matchedCat.id : (service.categoryId || ''));
    setServiceBasePrice(service.minPrice.toString());
    setServiceMaxPrice(service.maxPrice ? service.maxPrice.toString() : '');
    setServiceDuration(service.durationMinutes ? service.durationMinutes.toString() : '45');
    setServiceSessionsCount(service.sessionsCount || 1);
    setServiceModalError(null);
    setIsServiceModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) {
      setServiceModalError('يرجى إدخال اسم الخدمة');
      return;
    }
    const minP = parseFloat(serviceBasePrice);
    if (isNaN(minP) || minP < 0) {
      setServiceModalError('يرجى إدخال سعر صحيح للخدمة');
      return;
    }

    setIsSubmittingService(true);
    setServiceModalError(null);

    const matchedCat = categories.find((c) => c.id === serviceCategoryId);
    const catName = matchedCat ? matchedCat.name : 'عام';

    const payload = {
      name: serviceName.trim(),
      categoryId: serviceCategoryId || undefined,
      category: catName,
      minPrice: minP,
      maxPrice: serviceMaxPrice ? parseFloat(serviceMaxPrice) : null,
      durationMinutes: parseInt(serviceDuration) || 45,
      type: catName,
      sessionsCount: Math.max(1, serviceSessionsCount || 1),
    };

    try {
      if (editingServiceId) {
        // UPDATE SERVICE
        const res = await fetch(`/api/services/${editingServiceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'فشل تحديث بيانات الخدمة');
        }

        const updated = await res.json();
        onUpdateService(updated);
      } else {
        // CREATE SERVICE
        const res = await fetch('/api/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'فشل إضافة الخدمة الجديدة');
        }

        const created = await res.json();
        onAddService(created);
      }

      setIsServiceModalOpen(false);
      onRefreshCategories(); // Refresh category service counts
    } catch (err: any) {
      console.warn('API error during service save:', err);
      setServiceModalError(err.message || 'حدث خطأ أثناء حفظ الخدمة');
    } finally {
      setIsSubmittingService(false);
    }
  };

  const handleDeleteService = async (service: ServiceItem) => {
    if (!confirm(`هل أنت متأكد من حذف الخدمة "${service.name}" نهائياً؟`)) {
      return;
    }

    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'لا يمكن حذف هذه الخدمة لوجود حجوزات سابقة مرتبطة بها.');
        return;
      }

      onDeleteService(service.id);
      onRefreshCategories();
    } catch (err: any) {
      console.warn('Error deleting service:', err);
      alert('تعذر حذف الخدمة، يرجى المحاولة لاحقاً');
    }
  };

  // ==========================================
  // CATEGORY ACTIONS
  // ==========================================
  const handleOpenAddCategoryModal = () => {
    setEditingCategoryId(null);
    setCategoryName('');
    setCategoryModalError(null);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategoryModal = (cat: CategoryItem) => {
    setEditingCategoryId(cat.id);
    setCategoryName(cat.name);
    setCategoryModalError(null);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setCategoryModalError('يرجى إدخال اسم التصنيف');
      return;
    }

    setIsSubmittingCategory(true);
    setCategoryModalError(null);

    const payload = { name: categoryName.trim() };

    try {
      if (editingCategoryId) {
        // UPDATE CATEGORY
        const res = await fetch(`/api/categories/${editingCategoryId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'فشل تحديث التصنيف');
        }

        const updated = await res.json();
        onUpdateCategory(updated);
        onRefreshServices(); // Category name change impacts services display
      } else {
        // CREATE CATEGORY
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'فشل إضافة التصنيف الجديد');
        }

        const created = await res.json();
        onAddCategory(created);
      }

      setIsCategoryModalOpen(false);
    } catch (err: any) {
      console.warn('API error during category save:', err);
      setCategoryModalError(err.message || 'حدث خطأ أثناء حفظ التصنيف');
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleDeleteCategory = async (cat: CategoryItem) => {
    if (!confirm(`هل أنت متأكد من حذف تصنيف "${cat.name}"؟`)) {
      return;
    }

    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'لا يمكن حذف هذا التصنيف لوجود خدمات تابعة له.');
        return;
      }

      onDeleteCategory(cat.id);
    } catch (err: any) {
      console.warn('Error deleting category:', err);
      alert('تعذر حذف التصنيف، يرجى المحاولة لاحقاً');
    }
  };

  // ==========================================
  // PACKAGE ACTIONS
  // ==========================================
  const handleOpenAddPackageModal = () => {
    setEditingPackageId(null);
    setPackageName('');
    setPackageFixedPrice('');
    setPackageDiscountPercentage('');
    setPackageSessionsCount(6);
    setPackageModalError(null);
    setIsPackageModalOpen(true);
  };

  const handleOpenEditPackageModal = (pkg: PackageItem) => {
    setEditingPackageId(pkg.id);
    setPackageName(pkg.name);
    setPackageFixedPrice(pkg.fixedPrice !== null && pkg.fixedPrice !== undefined ? pkg.fixedPrice.toString() : '');
    setPackageDiscountPercentage(pkg.discountPercentage !== null && pkg.discountPercentage !== undefined ? pkg.discountPercentage.toString() : '');
    setPackageSessionsCount(pkg.sessionsCount || 1);
    setPackageModalError(null);
    setIsPackageModalOpen(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageName.trim()) {
      setPackageModalError('يرجى إدخال اسم الباقة أو العرض');
      return;
    }

    setIsSubmittingPackage(true);
    setPackageModalError(null);

    const payload = {
      name: packageName.trim(),
      fixedPrice: packageFixedPrice ? parseFloat(packageFixedPrice) : null,
      discountPercentage: packageDiscountPercentage ? parseFloat(packageDiscountPercentage) : null,
      sessionsCount: Math.max(1, packageSessionsCount || 1),
    };

    try {
      if (editingPackageId) {
        const res = await fetch(`/api/packages/${editingPackageId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'فشل تحديث بيانات الباقة');
        }

        const updated = await res.json();
        if (onUpdatePackage) onUpdatePackage(updated);
      } else {
        const res = await fetch('/api/packages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'فشل إضافة الباقة الجديدة');
        }

        const created = await res.json();
        if (onAddPackage) onAddPackage(created);
      }

      setIsPackageModalOpen(false);
      if (onRefreshPackages) onRefreshPackages();
    } catch (err: any) {
      console.warn('API error during package save:', err);
      setPackageModalError(err.message || 'حدث خطأ أثناء حفظ الباقة');
    } finally {
      setIsSubmittingPackage(false);
    }
  };

  const handleDeletePackage = async (pkg: PackageItem) => {
    if (!confirm(`هل أنت متأكد من حذف أو إلغاء تفعيل الباقة "${pkg.name}"؟`)) {
      return;
    }

    try {
      const res = await fetch(`/api/packages/${pkg.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'تعذر حذف الباقة.');
        return;
      }

      if (onDeletePackage) onDeletePackage(pkg.id);
      if (onRefreshPackages) onRefreshPackages();
    } catch (err: any) {
      console.warn('Error deleting package:', err);
      alert('تعذر حذف الباقة، يرجى المحاولة لاحقاً');
    }
  };

  // Filtered Services
  const filteredServices = services.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(serviceSearch.toLowerCase());
    const matchesCategory =
      selectedCategoryFilter === 'الكل' || s.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Filtered Categories
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  // Filtered Packages
  const filteredPackages = packages.filter((p) =>
    p.name.toLowerCase().includes(packageSearch.toLowerCase())
  );

  // Summary Metrics
  const totalServices = services.length;
  const totalCategories = categories.length;
  const avgPrice =
    totalServices > 0
      ? Math.round(services.reduce((sum, s) => sum + s.minPrice, 0) / totalServices)
      : 0;
  const highestPrice =
    totalServices > 0 ? Math.max(...services.map((s) => s.minPrice)) : 0;

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">إدارة الخدمات والتصنيفات</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            تحديث وإدارة باقات العيادة والسبا، الأقسام الطبية، وتحديد الأسعار المعتمدة
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshAll}
            className="p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer"
            title="تحديث البيانات من السيرفر"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {activeTab === 'services' && (
            <button
              onClick={handleOpenAddServiceModal}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة خدمة جديدة</span>
            </button>
          )}

          {activeTab === 'categories' && (
            <button
              onClick={handleOpenAddCategoryModal}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة تصنيف جديد</span>
            </button>
          )}

          {activeTab === 'packages' && (
            <button
              onClick={handleOpenAddPackageModal}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة باقة جديدة</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-400">إجمالي الخدمات المعتمدة</p>
            <h3 className="text-2xl font-bold text-stone-800 mt-1">{totalServices}</h3>
            <p className="text-xs text-stone-400 mt-0.5">جلسة وخدمة علاجية</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-600">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-400">أقسام وتصنيفات المركز</p>
            <h3 className="text-2xl font-bold text-stone-800 mt-1">{totalCategories}</h3>
            <p className="text-xs text-stone-400 mt-0.5">أقسام وتخصصات نشطة</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
            <FolderTree className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-400">باقات العروض المتعددة</p>
            <h3 className="text-2xl font-bold text-purple-800 mt-1">{packages.length}</h3>
            <p className="text-xs text-purple-600 font-medium mt-0.5">باقات جلسات نشطة (POS)</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-400">أعلى سعر جلسة / باقة</p>
            <h3 className="text-2xl font-bold text-amber-700 mt-1">
              {highestPrice.toLocaleString()} <span className="text-xs font-normal text-stone-500">ج.م</span>
            </h3>
            <p className="text-xs text-amber-600 font-medium mt-0.5">الخدمات التخصصية</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Tabbed Switcher */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-2 shadow-xs flex items-center gap-2">
        <button
          onClick={() => setActiveTab('services')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
            activeTab === 'services'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>الخدمات والأسعار</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              activeTab === 'services'
                ? 'bg-emerald-800 text-white'
                : 'bg-stone-100 text-stone-600'
            }`}
          >
            {totalServices}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>الأقسام والتصنيفات</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              activeTab === 'categories'
                ? 'bg-emerald-800 text-white'
                : 'bg-stone-100 text-stone-600'
            }`}
          >
            {totalCategories}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('packages')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
            activeTab === 'packages'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>باقات العروض والجلسات (POS)</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              activeTab === 'packages'
                ? 'bg-emerald-800 text-white'
                : 'bg-stone-100 text-stone-600'
            }`}
          >
            {packages.length}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: SERVICES TAB */}
      {/* ======================================================== */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          {/* Search & Category Filter Pills */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedCategoryFilter('الكل')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategoryFilter === 'الكل'
                    ? 'bg-stone-800 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
                }`}
              >
                الكل ({services.length})
              </button>
              {categories.map((c) => {
                const count = services.filter((s) => s.category === c.name).length;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategoryFilter(c.name)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategoryFilter === c.name
                        ? 'bg-emerald-700 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
                    }`}
                  >
                    {c.name} ({count})
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72 shrink-0">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="بحث باسم الخدمة..."
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                className="w-full pr-10 pl-4 py-2 text-xs rounded-xl bg-stone-50/70 border border-stone-200 focus:bg-white focus:outline-hidden focus:border-emerald-600 text-stone-800 placeholder-stone-400 transition-colors"
              />
            </div>
          </div>

          {/* Services Data Table */}
          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-stone-50/70 border-b border-stone-200/80 text-xs font-semibold text-stone-600">
                    <th className="py-3.5 px-6">اسم الخدمة (Service Name)</th>
                    <th className="py-3.5 px-6">التصنيف (Category)</th>
                    <th className="py-3.5 px-6">عدد الجلسات (Sessions)</th>
                    <th className="py-3.5 px-6">السعر (Price)</th>
                    <th className="py-3.5 px-6 text-left">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-sm">
                  {filteredServices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-stone-400">
                        <Sparkles className="w-10 h-10 mx-auto mb-2 text-stone-300" />
                        <p className="font-medium text-stone-600">لا توجد خدمات مطابقة</p>
                        <p className="text-xs mt-1">اضغط على زر "إضافة خدمة جديدة" لإضافة خدمات في هذا القسم.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredServices.map((service) => (
                      <tr key={service.id} className="hover:bg-stone-50/50 transition-colors">
                        {/* Service Name */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-100 shrink-0">
                              <Sparkles className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                              <span className="font-bold text-stone-800 block">{service.name}</span>
                              <span className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3 text-stone-400" />
                                <span>{service.durationMinutes} دقيقة</span>
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 text-xs font-medium border border-stone-200/60">
                            <Tag className="w-3 h-3 text-stone-400" />
                            {service.category}
                          </span>
                        </td>

                        {/* Sessions Count */}
                        <td className="py-4 px-6">
                          {service.sessionsCount && service.sessionsCount > 1 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200/80">
                              <Layers className="w-3 h-3 text-purple-600" />
                              <span>{service.sessionsCount} جلسات (باقة POS)</span>
                            </span>
                          ) : (
                            <span className="text-xs text-stone-400 font-medium">جلسة واحدة</span>
                          )}
                        </td>

                        {/* Price */}
                        <td className="py-4 px-6">
                          <div className="flex items-baseline gap-1 font-bold">
                            <span className="text-emerald-800 text-base font-extrabold">
                              {service.minPrice.toLocaleString()}
                            </span>
                            {service.maxPrice && service.maxPrice > service.minPrice && (
                              <span className="text-xs text-stone-400 font-normal">
                                - {service.maxPrice.toLocaleString()}
                              </span>
                            )}
                            <span className="text-xs font-normal text-stone-500">ج.م</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-left">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditServiceModal(service)}
                              className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                              title="تعديل الخدمة"
                            >
                              <Edit3 className="w-4 h-4 text-stone-600" />
                            </button>
                            <button
                              onClick={() => handleDeleteService(service)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                              title="حذف الخدمة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 2: CATEGORIES TAB */}
      {/* ======================================================== */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          {/* Categories Search & Header Bar */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="بحث عن تصنيف أو تخصص..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="w-full pr-10 pl-4 py-2 text-xs rounded-xl bg-stone-50/70 border border-stone-200 focus:bg-white focus:outline-hidden focus:border-emerald-600 text-stone-800 placeholder-stone-400 transition-colors"
              />
            </div>

            <div className="text-xs text-stone-500 font-medium">
              إجمالي الأقسام: <strong className="text-stone-800">{filteredCategories.length}</strong> قسم
            </div>
          </div>

          {/* Categories Grid List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.length === 0 ? (
              <div className="col-span-full bg-white p-12 rounded-2xl border border-stone-200/80 text-center text-stone-400">
                <FolderTree className="w-10 h-10 mx-auto mb-2 text-stone-300" />
                <p className="font-medium text-stone-600">لا توجد تصنيفات مسجلة</p>
                <p className="text-xs mt-1">اضغط على زر "إضافة تصنيف جديد" لإنشاء قسم جديد.</p>
              </div>
            ) : (
              filteredCategories.map((cat) => {
                const count = services.filter((s) => s.category === cat.name).length;
                return (
                  <div
                    key={cat.id}
                    className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs hover:border-emerald-200 transition-all flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                          <FolderTree className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 border border-stone-200/60">
                          {count} {count === 1 ? 'خدمة' : 'خدمات'}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-stone-800 mt-3">{cat.name}</h3>
                      <p className="text-xs text-stone-400 mt-0.5">قسم رئيسي معتمد بالعيادة والسبا</p>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setSelectedCategoryFilter(cat.name);
                          setActiveTab('services');
                        }}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                      >
                        <span>عرض الخدمات التابعة</span>
                        <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditCategoryModal(cat)}
                          className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                          title="تعديل اسم التصنيف"
                        >
                          <Edit3 className="w-4 h-4 text-stone-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          title="حذف التصنيف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 3: PACKAGES TAB */}
      {/* ======================================================== */}
      {activeTab === 'packages' && (
        <div className="space-y-4">
          {/* Packages Search & Header Bar */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="بحث باسم الباقة أو العرض..."
                value={packageSearch}
                onChange={(e) => setPackageSearch(e.target.value)}
                className="w-full pr-10 pl-4 py-2 text-xs rounded-xl bg-stone-50/70 border border-stone-200 focus:bg-white focus:outline-hidden focus:border-emerald-600 text-stone-800 placeholder-stone-400 transition-colors"
              />
            </div>

            <div className="text-xs text-stone-500 font-medium">
              إجمالي الباقات: <strong className="text-stone-800">{filteredPackages.length}</strong> باقة مسجلة
            </div>
          </div>

          {/* Packages Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPackages.length === 0 ? (
              <div className="col-span-full bg-white p-12 rounded-2xl border border-stone-200/80 text-center text-stone-400">
                <Layers className="w-10 h-10 mx-auto mb-2 text-stone-300" />
                <p className="font-medium text-stone-600">لا توجد باقات أو عروض مطابقة</p>
                <p className="text-xs mt-1">اضغط على زر "إضافة باقة جديدة" لإنشاء باقة علاجية أو عرض متعدد الجلسات.</p>
              </div>
            ) : (
              filteredPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs hover:border-purple-200 transition-all flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700">
                        <Layers className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200/60">
                        {pkg.sessionsCount || 1} {pkg.sessionsCount === 1 ? 'جلسة' : 'جلسات'}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-stone-800 mt-3">{pkg.name}</h3>
                    <p className="text-xs text-stone-500 mt-1">
                      {pkg.fixedPrice ? (
                        <span className="font-bold text-emerald-800">
                          السعر الثابت: {pkg.fixedPrice.toLocaleString()} ج.م
                        </span>
                      ) : pkg.discountPercentage ? (
                        <span className="font-bold text-purple-700">
                          نسبة الخصم: {pkg.discountPercentage}%
                        </span>
                      ) : (
                        <span className="text-stone-400">سعر مرن حسب الجلسات</span>
                      )}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[11px] text-stone-400 font-medium">
                      متاحة للحجز ونظام POS التلقائي
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditPackageModal(pkg)}
                        className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                        title="تعديل الباقة"
                      >
                        <Edit3 className="w-4 h-4 text-stone-600" />
                      </button>
                      <button
                        onClick={() => handleDeletePackage(pkg)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                        title="حذف الباقة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: ADD / EDIT SERVICE MODAL */}
      {/* ======================================================== */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-800 text-base">
                    {editingServiceId ? 'تعديل بيانات الخدمة' : 'إضافة خدمة جديدة'}
                  </h3>
                  <p className="text-xs text-stone-400">تحديد اسم الخدمة، التصنيف، والسعر الأساسي</p>
                </div>
              </div>
              <button
                onClick={() => setIsServiceModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveService} className="p-6 space-y-4 text-right">
              {serviceModalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{serviceModalError}</span>
                </div>
              )}

              {/* 1. Service Name */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  اسم الخدمة (Service Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: جلسة تقشير وتجديد البشرة"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 transition-colors text-stone-800 font-medium"
                />
              </div>

              {/* 2. Category Dropdown */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  التصنيف / القسم (Category) <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={serviceCategoryId}
                  onChange={(e) => setServiceCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 transition-colors text-stone-800 font-medium"
                >
                  <option value="" disabled>
                    -- اختر التصنيف التابع له --
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    لا توجد تصنيفات حالياً، يرجى إضافة تصنيف أولاً من تبويب التصنيفات.
                  </p>
                )}
              </div>

              {/* 3. Base Price & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    السعر الأساسي (ج.م) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    placeholder="مثال: 350"
                    value={serviceBasePrice}
                    onChange={(e) => setServiceBasePrice(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 transition-colors text-stone-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    مدة الجلسة (بالدقائق)
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    placeholder="45"
                    value={serviceDuration}
                    onChange={(e) => setServiceDuration(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 transition-colors text-stone-800"
                  />
                </div>
              </div>

              {/* Sessions Count for POS Multi-session automation */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-stone-700">
                    عدد الجلسات (Sessions Count) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-200">
                    نظام باقات POS التلقائي
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  placeholder="1"
                  value={serviceSessionsCount}
                  onChange={(e) => setServiceSessionsCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 transition-colors text-stone-800 font-bold"
                />
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  إذا كان عدد الجلسات أكثر من 1 (مثلاً 6 أو 8 جلسات)، سينشئ النظام تلقائياً باقة جلسات للعميل عند أول حجز/دفع ليتم خصم الجلسات القادمة منها مجاناً.
                </p>
              </div>

              {/* Optional: Max Price */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  أقصى سعر اختياري (ج.م) <span className="text-stone-400 font-normal">(في حال تفاوت الأسعار)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="مثال: 500 (اختياري)"
                  value={serviceMaxPrice}
                  onChange={(e) => setServiceMaxPrice(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 transition-colors text-stone-800"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingService || categories.length === 0}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingService
                    ? 'جاري الحفظ...'
                    : editingServiceId
                    ? 'حفظ التعديلات'
                    : 'إضافة الخدمة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ADD / EDIT CATEGORY MODAL */}
      {/* ======================================================== */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div
            className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                  <FolderTree className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-800 text-base">
                    {editingCategoryId ? 'تعديل اسم التصنيف' : 'إضافة تصنيف جديد'}
                  </h3>
                  <p className="text-xs text-stone-400">تنظيم وتجميع الخدمات حسب القسم الطبي</p>
                </div>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveCategory} className="p-6 space-y-4 text-right">
              {categoryModalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{categoryModalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  اسم التصنيف / القسم <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تغذية علاجية، ليزر، عناية بالبشرة..."
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 transition-colors text-stone-800 font-medium"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCategory}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingCategory
                    ? 'جاري الحفظ...'
                    : editingCategoryId
                    ? 'حفظ التعديلات'
                    : 'إضافة التصنيف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: ADD / EDIT PACKAGE MODAL */}
      {/* ======================================================== */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-800 text-base">
                    {editingPackageId ? 'تعديل بيانات الباقة' : 'إضافة باقة / عرض جديد'}
                  </h3>
                  <p className="text-xs text-stone-400">تحديد عدد الجلسات، السعر، ونظام الحسم للعملاء</p>
                </div>
              </div>
              <button
                onClick={() => setIsPackageModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSavePackage} className="p-6 space-y-4 text-right">
              {packageModalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{packageModalError}</span>
                </div>
              )}

              {/* 1. Package Name */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  اسم الباقة / العرض <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: باقة الليزر الذهبية (6 جلسات) أو عرض العلاج الطبيعي"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 transition-colors text-stone-800 font-medium"
                />
              </div>

              {/* 2. Sessions Count Input */}
              <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-purple-900">
                    عدد الجلسات الإجمالي (Sessions Count) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md">
                    نظام POS التلقائي
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  placeholder="6"
                  value={packageSessionsCount}
                  onChange={(e) => setPackageSessionsCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-purple-200 bg-white focus:outline-hidden focus:border-purple-600 transition-colors text-stone-800 font-bold"
                />
                <p className="text-[11px] text-purple-700 leading-relaxed">
                  عند حجز هذه الباقة للعميل، يقوم النظام بإنشاء رصيد باقة تلقائياً بعدد هذه الجلسات، واحتساب الجلسة الأولى، مع خصم الجلسات القادمة تلقائياً.
                </p>
              </div>

              {/* 3. Pricing: Fixed Price OR Discount % */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    السعر الثابت للباقة (ج.م)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="مثال: 1800"
                    value={packageFixedPrice}
                    onChange={(e) => setPackageFixedPrice(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 transition-colors text-stone-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    أو نسبة الخصم (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="مثال: 20"
                    value={packageDiscountPercentage}
                    onChange={(e) => setPackageDiscountPercentage(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:border-emerald-600 transition-colors text-stone-800 font-bold"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsPackageModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPackage}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-purple-700 hover:bg-purple-800 text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingPackage
                    ? 'جاري الحفظ...'
                    : editingPackageId
                    ? 'حفظ التعديلات'
                    : 'إضافة الباقة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
