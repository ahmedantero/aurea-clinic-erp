const fs = require('fs');
const modalPath = 'C:/Users/DELL/.gemini/antigravity/scratch/clinic-spa-prisma/frontend/src/components/NewAppointmentModal.tsx';
let content = fs.readFileSync(modalPath, 'utf8');

// 1. Add SelectedBookingService interface before NewAppointmentModal
const interfaceDef = `export interface SelectedBookingService {
  compositeId: string;
  type: 'service' | 'package';
  rawId: string;
  name: string;
  price: number;
  durationMinutes: number;
  categoryName: string;
  sessionsCount?: number;
  isPackageSession?: boolean;
  clientPackageId?: string | null;
}
`;

if (!content.includes('export interface SelectedBookingService')) {
  const insertBefore = 'export const NewAppointmentModal: React.FC<NewAppointmentModalProps>';
  content = content.replace(insertBefore, `${interfaceDef}\n${insertBefore}`);
}

// 2. Add selectedServices state
const oldStateTarget = `  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedItemCompositeId, setSelectedItemCompositeId] = useState<string>('');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');`;

const newStateTarget = `  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedItemCompositeId, setSelectedItemCompositeId] = useState<string>('');
  const [selectedServices, setSelectedServices] = useState<SelectedBookingService[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');`;

content = content.replace(oldStateTarget, newStateTarget);

// 3. Update handleCategoryChange and handleServiceSelect
const oldHandlerTarget = `  const handleCategoryChange = (newCat: string) => {
    setSelectedCategory(newCat);
    setSelectedItemCompositeId('');
    setServiceSearchTerm('');
    setErrorMsg('');
  };

  const handleServiceSelect = (compositeId: string) => {
    setSelectedItemCompositeId(compositeId);
    setErrorMsg('');
  };`;

const newHandlerTarget = `  const handleCategoryChange = (newCat: string) => {
    setSelectedCategory(newCat);
    setServiceSearchTerm('');
    setErrorMsg('');
  };

  const handleServiceSelect = (compositeId: string) => {
    setErrorMsg('');
    const existingIndex = selectedServices.findIndex((s) => s.compositeId === compositeId);
    if (existingIndex > -1) {
      // Toggle off / unselect
      setSelectedServices((prev) => prev.filter((s) => s.compositeId !== compositeId));
      return;
    }

    setSelectedItemCompositeId(compositeId);
    const idx = compositeId.indexOf('_');
    if (idx === -1) return;
    const type = compositeId.slice(0, idx) as 'service' | 'package';
    const rawId = compositeId.slice(idx + 1);

    if (type === 'service') {
      const srv = services.find((s) => s.id === rawId);
      if (!srv) return;

      let effectivePrice = srv.minPrice ?? 0;
      let isPkgSession = false;
      let matchedClientPkgId = null;

      if (currentClient && clientMode === 'existing') {
        const activeClientPkgs = (currentClient.clientPackages || []).filter(
          (cp) => cp.status === 'ACTIVE' && cp.usedSessions < cp.totalSessions
        );
        const match = activeClientPkgs.find((cp) => {
          if (cp.serviceId === srv.id) return true;
          const pkgDef = packages.find((p) => p.id === cp.packageId);
          return pkgDef && pkgDef.name === srv.name;
        });
        if (match) {
          effectivePrice = 0;
          isPkgSession = true;
          matchedClientPkgId = match.id;
        }
      }

      setSelectedServices((prev) => [
        ...prev,
        {
          compositeId,
          type: 'service',
          rawId: srv.id,
          name: srv.name,
          price: effectivePrice,
          durationMinutes: srv.durationMinutes || 45,
          categoryName: srv.category || selectedCategory || 'عام',
          sessionsCount: srv.sessionsCount || 1,
          isPackageSession: isPkgSession,
          clientPackageId: matchedClientPkgId,
        },
      ]);
    } else if (type === 'package') {
      const pkg = packages.find((p) => p.id === rawId);
      if (!pkg) return;

      let effectivePrice = pkg.fixedPrice ?? 0;
      let isPkgSession = false;
      let matchedClientPkgId = null;

      if (currentClient && clientMode === 'existing') {
        const activeClientPkgs = (currentClient.clientPackages || []).filter(
          (cp) => cp.status === 'ACTIVE' && cp.usedSessions < cp.totalSessions
        );
        const match = activeClientPkgs.find((cp) => cp.packageId === pkg.id);
        if (match) {
          effectivePrice = 0;
          isPkgSession = true;
          matchedClientPkgId = match.id;
        }
      }

      setSelectedServices((prev) => [
        ...prev,
        {
          compositeId,
          type: 'package',
          rawId: pkg.id,
          name: pkg.name,
          price: effectivePrice,
          durationMinutes: 60,
          categoryName: 'عروض وباقات',
          sessionsCount: pkg.sessionsCount || 1,
          isPackageSession: isPkgSession,
          clientPackageId: matchedClientPkgId,
        },
      ]);
    }
  };

  const handleRemoveService = (compositeId: string) => {
    setSelectedServices((prev) => prev.filter((s) => s.compositeId !== compositeId));
  };`;

content = content.replace(oldHandlerTarget, newHandlerTarget);

// 4. Update Financial Totals & Duration calculations
const oldTotalsTarget = `  const grossTotal = useMemo(() => {
    const base = Number(displayPrice) || 0;
    return base + consumablesTotal;
  }, [displayPrice, consumablesTotal]);

  const discountAmount = useMemo(() => {
    if (discountValue <= 0) return 0;
    if (discountType === 'percentage') {
      return Math.round(((grossTotal * Math.min(100, discountValue)) / 100) * 100) / 100;
    }
    return Math.min(grossTotal, discountValue);
  }, [grossTotal, discountType, discountValue]);

  const netTotal = useMemo(() => Math.max(0, grossTotal - discountAmount), [grossTotal, discountAmount]);

  useEffect(() => {
    if (displayPrice === '' && consumablesTotal === 0) {
      setFinalPrice('');
    } else {
      setFinalPrice(netTotal.toString());
    }
  }, [netTotal, displayPrice, consumablesTotal]);

  const selectedStaff = useMemo(
    () => staffList.find((s) => s.id === selectedStaffId) || staffList[0] || null,
    [staffList, selectedStaffId]
  );

  const baseSessionPrice = useMemo(() => Number(displayPrice) || 0, [displayPrice]);

  const estimatedDoctorCommission = useMemo(() => {
    if (!selectedStaff) return 0;
    const isPercentage =
      !selectedStaff.commissionType ||
      selectedStaff.commissionType === 'نسبة' ||
      selectedStaff.commissionType.includes('%');
    const commVal = Number(selectedStaff.commissionValue) || 0;
    if (isPercentage) {
      return Math.round(((baseSessionPrice * commVal) / 100) * 100) / 100;
    }
    return baseSessionPrice;
  }, [selectedStaff, baseSessionPrice]);`;

const newTotalsTarget = `  const servicesBaseTotal = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.price, 0);
  }, [selectedServices]);

  const totalDurationMinutes = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
  }, [selectedServices]);

  const baseSessionPrice = servicesBaseTotal;

  const grossTotal = useMemo(() => {
    return servicesBaseTotal + consumablesTotal;
  }, [servicesBaseTotal, consumablesTotal]);

  const discountAmount = useMemo(() => {
    if (discountValue <= 0) return 0;
    if (discountType === 'percentage') {
      return Math.round(((grossTotal * Math.min(100, discountValue)) / 100) * 100) / 100;
    }
    return Math.min(grossTotal, discountValue);
  }, [grossTotal, discountType, discountValue]);

  const netTotal = useMemo(() => Math.max(0, grossTotal - discountAmount), [grossTotal, discountAmount]);

  useEffect(() => {
    if (selectedServices.length === 0 && consumablesTotal === 0) {
      setFinalPrice('');
    } else {
      setFinalPrice(netTotal.toString());
    }
  }, [netTotal, selectedServices, consumablesTotal]);

  const selectedStaff = useMemo(
    () => staffList.find((s) => s.id === selectedStaffId) || staffList[0] || null,
    [staffList, selectedStaffId]
  );

  const estimatedDoctorCommission = useMemo(() => {
    if (!selectedStaff || selectedServices.length === 0) return 0;
    const isPercentage =
      !selectedStaff.commissionType ||
      selectedStaff.commissionType === 'نسبة' ||
      selectedStaff.commissionType.includes('%');
    const commVal = Number(selectedStaff.commissionValue) || 0;
    if (isPercentage) {
      return Math.round(((servicesBaseTotal * commVal) / 100) * 100) / 100;
    }
    return servicesBaseTotal;
  }, [selectedStaff, servicesBaseTotal, selectedServices]);`;

content = content.replace(oldTotalsTarget, newTotalsTarget);

// 5. Update resetForm
const oldResetTarget = `    setSelectedItemCompositeId('');
    setSelectedStaffId(staffList[0]?.id || '');`;

const newResetTarget = `    setSelectedItemCompositeId('');
    setSelectedServices([]);
    setSelectedStaffId(staffList[0]?.id || '');`;

content = content.replace(oldResetTarget, newResetTarget);

// 6. Update handleSubmit validation & payload
const oldSubmitValTarget = `    if (!selectedItemCompositeId || !itemType || !itemRawId) {
      setErrorMsg('يرجى اختيار الخدمة أو الباقة المطلوبة');
      return;
    }`;

const newSubmitValTarget = `    if (selectedServices.length === 0) {
      setErrorMsg('يرجى اختيار خدمة أو باقة واحدة على الأقل');
      return;
    }`;

content = content.replace(oldSubmitValTarget, newSubmitValTarget);

// 7. Update payload body in handleSubmit
const oldBodyTarget = `        body: JSON.stringify({
          clientId: clientMode === 'existing' ? selectedClientId : null,
          clientName: clientMode === 'existing' ? currentClient?.name : null,
          clientPhone: clientMode === 'existing' ? currentClient?.phone : null,
          newClientName: clientMode === 'new' ? newClientName.trim() : null,
          newClientPhone: clientMode === 'new' ? newClientPhone.trim() : null,
          staffId: selectedStaffId || staffList[0]?.id || null,
          categoryName: selectedCategory || (isPkg ? 'عروض وباقات' : 'عام'),
          packageId: cleanPackageId,
          serviceId: cleanServiceId,
          itemType: isPkg ? 'package' : 'service',
          itemId: itemRawId,
          itemCompositeId: selectedItemCompositeId,
          appointmentDate,
          time: appointmentTime,
          status,
          paymentMethod,
          notes: notes.trim() || undefined,
          finalPrice: Number(finalPrice) || 0,
          totalAmount: grossTotal,
          discountApplied: discountAmount,
          discountType,
          discountValue,
          netAmount: Number(finalPrice) || 0,
          consumables: selectedConsumables.map((c) => ({
            productId: c.productId,
            quantity: c.quantity,
            isBilledToClient: c.isBilledToClient,
          })),
        }),`;

const newBodyTarget = `        body: JSON.stringify({
          clientId: clientMode === 'existing' ? selectedClientId : null,
          clientName: clientMode === 'existing' ? currentClient?.name : null,
          clientPhone: clientMode === 'existing' ? currentClient?.phone : null,
          newClientName: clientMode === 'new' ? newClientName.trim() : null,
          newClientPhone: clientMode === 'new' ? newClientPhone.trim() : null,
          staffId: selectedStaffId || staffList[0]?.id || null,
          services: selectedServices.map((s) => ({
            serviceId: s.type === 'service' ? s.rawId : null,
            packageId: s.type === 'package' ? s.rawId : null,
            itemType: s.type,
            itemId: s.rawId,
            itemCompositeId: s.compositeId,
            name: s.name,
            price: s.price,
            durationMinutes: s.durationMinutes,
            staffId: selectedStaffId,
          })),
          appointmentDate,
          time: appointmentTime,
          status,
          paymentMethod,
          notes: notes.trim() || undefined,
          finalPrice: Number(finalPrice) || 0,
          totalAmount: grossTotal,
          discountApplied: discountAmount,
          discountType,
          discountValue,
          netAmount: Number(finalPrice) || 0,
          consumables: selectedConsumables.map((c) => ({
            productId: c.productId,
            quantity: c.quantity,
            isBilledToClient: c.isBilledToClient,
          })),
        }),`;

content = content.replace(oldBodyTarget, newBodyTarget);

// 8. Update printReceipt call in handleSubmit
const oldPrintCallTarget = `      if (shouldPrint) {
        await printReceipt({
          invoiceNumber: invNum,
          clientName: clientObj?.name || 'عميل مسجل',
          clientPhone: rawTargetPhone,
          serviceName: serviceObj?.name || packageObj?.name || 'جلسة علاجية / سبا',
          categoryName: selectedCategory,
          packageName: packageObj?.name,
          staffName: staffObj?.name || 'الكادر الطبي المختص',
          appointmentDate,
          time: appointmentTime,
          basePrice: baseSessionPrice,
          totalAmount: grossTotal,
          discountApplied: discountAmount,
          discountType,
          discountValue,
          finalPrice: Number(finalPrice) || 0,
          paymentMethod,
          consumables: selectedConsumables.map((c) => {
            const p = inventoryItems.find((i) => i.id === c.productId);
            const { sellingPrice } = getProductPricing(p);
            return {
              name: p?.name,
              quantity: c.quantity,
              price: c.isBilledToClient ? sellingPrice * c.quantity : 0,
            };
          }),
          createdByName: user?.name || user?.username,
        });
      }`;

const newPrintCallTarget = `      if (shouldPrint) {
        await printReceipt({
          invoiceNumber: invNum,
          clientName: clientObj?.name || 'عميل مسجل',
          clientPhone: rawTargetPhone,
          serviceName: selectedServices.map((s) => s.name).join(' + '),
          categoryName: Array.from(new Set(selectedServices.map((s) => s.categoryName))).join(' / '),
          staffName: staffObj?.name || 'الكادر الطبي المختص',
          appointmentDate,
          time: appointmentTime,
          basePrice: servicesBaseTotal,
          totalAmount: grossTotal,
          discountApplied: discountAmount,
          discountType,
          discountValue,
          finalPrice: Number(finalPrice) || 0,
          paymentMethod,
          items: selectedServices.map((s) => ({
            name: s.name,
            price: s.price,
            durationMinutes: s.durationMinutes,
            categoryName: s.categoryName,
            staffName: staffObj?.name,
          })),
          consumables: selectedConsumables.map((c) => {
            const p = inventoryItems.find((i) => i.id === c.productId);
            const { sellingPrice } = getProductPricing(p);
            return {
              name: p?.name,
              quantity: c.quantity,
              price: c.isBilledToClient ? sellingPrice * c.quantity : 0,
            };
          }),
          createdByName: user?.name || user?.username,
        });
      }`;

content = content.replace(oldPrintCallTarget, newPrintCallTarget);

// 9. Update Cards Grid in Right Canvas to check isSelected from selectedServices
const oldPkgCardCheck = `                          const isSelected = selectedItemCompositeId === compositeId;`;
const newPkgCardCheck = `                          const isSelected = selectedServices.some((s) => s.compositeId === compositeId);`;
content = content.replace(oldPkgCardCheck, newPkgCardCheck);

const oldSrvCardCheck = `                        const isSelected = selectedItemCompositeId === compositeId;`;
const newSrvCardCheck = `                        const isSelected = selectedServices.some((s) => s.compositeId === compositeId);`;
content = content.replace(oldSrvCardCheck, newSrvCardCheck);

// 10. Update Left Canvas (Live Folio) Services section to render the list of selected services!
const oldFolioServicesSection = `                {/* Selected Item Breakdown */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-stone-400 font-bold">الخدمة / الباقة المطلوبة</span>
                    {selectedCategory && (
                      <span className="text-[10px] font-bold text-stone-500 bg-stone-100 dark:bg-stone-700 px-1.5 py-0.5 rounded">
                        {selectedCategory}
                      </span>
                    )}
                  </div>
                  {selectedItemCompositeId ? (
                    <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-500/20 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-[#0f3b2c] dark:text-emerald-200">
                          {selectedServiceItem?.name || selectedPackageItem?.name}
                        </span>
                        <span className="text-xs font-black text-stone-900 dark:text-stone-100">
                          {baseSessionPrice} ج.م
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                        <span>الأخصائي: {selectedStaff?.name || 'الكادر المختص'}</span>
                        <span>{serviceDuration} دقيقة</span>
                      </div>
                      {matchingActivePackage && (
                        <div className="mt-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-[10px] font-extrabold">
                          مخصوم من باقة العميل النشطة (تكلفة الخدمة 0 ج.م)
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-xs text-stone-400 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-dashed border-stone-200 dark:border-stone-700">
                      اختر خدمة أو باقة من القائمة لعرض تفاصيلها
                    </div>
                  )}
                </div>`;

const newFolioServicesSection = `                {/* Selected Items Breakdown (Multi-Service Support) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-stone-500 font-bold flex items-center gap-1.5">
                      <span>الخدمات المطلوبة</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-700 text-white text-[9px] font-black">
                        {selectedServices.length}
                      </span>
                    </span>
                    {totalDurationMinutes > 0 && (
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                        ⏱️ {Math.floor(totalDurationMinutes / 60) > 0 ? \`\${Math.floor(totalDurationMinutes / 60)} س \` : ''}{totalDurationMinutes % 60} دقيقة
                      </span>
                    )}
                  </div>

                  {selectedServices.length > 0 ? (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto silk-scrollbar pr-0.5">
                      {selectedServices.map((item) => (
                        <div
                          key={item.compositeId}
                          className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-500/25 flex items-center justify-between gap-2 shadow-2xs"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-[#0f3b2c] dark:text-emerald-200 truncate">
                                {item.name}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                                {item.categoryName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
                              <span>⏱️ {item.durationMinutes} دقيقة</span>
                              {item.isPackageSession && (
                                <span className="text-emerald-700 dark:text-emerald-300 font-extrabold bg-emerald-500/15 px-1 rounded">
                                  🎁 باقة نشطة
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-black text-stone-900 dark:text-stone-100">
                              {item.price > 0 ? \`\${item.price} ج.م\` : '0 ج.م'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveService(item.compositeId)}
                              className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="حذف الخدمة"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-xs text-stone-400 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-dashed border-stone-200 dark:border-stone-700">
                      انقر على خدمة أو باقة من القائمة اليمنى لإضافتها إلى الحجز
                    </div>
                  )}
                </div>`;

content = content.replace(oldFolioServicesSection, newFolioServicesSection);

// 11. Update action buttons disabled condition
const oldBtnDisabled = `disabled={isSubmitting || !selectedItemCompositeId}`;
const newBtnDisabled = `disabled={isSubmitting || selectedServices.length === 0}`;
content = content.replaceAll(oldBtnDisabled, newBtnDisabled);

fs.writeFileSync(modalPath, content, 'utf8');
console.log('Successfully updated NewAppointmentModal with Multi-Service Cart!');
