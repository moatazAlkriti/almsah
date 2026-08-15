import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { getTranslation } from '../utils/translations';
import {
  Wrench,
  ArrowLeftRight,
  Compass,
  PenTool,
  Type,
  Route,
  Mountain,
  Ruler,
  BoxSelect,
  Eraser,
  X,
  ChevronRight,
  Sparkles,
  Layers,
} from 'lucide-react';

export const ExtraToolsModal: React.FC = () => {
  const activeModal = useStore((s) => s.activeModal);
  const setActiveModal = useStore((s) => s.setActiveModal);
  const language = useStore((s) => s.language);
  const isAr = language === 'ar';

  const isDrawingLineMode = useStore((s) => s.isDrawingLineMode);
  const setIsDrawingLineMode = useStore((s) => s.setIsDrawingLineMode);
  const isAddingTextMode = useStore((s) => s.isAddingTextMode);
  const setIsAddingTextMode = useStore((s) => s.setIsAddingTextMode);
  const setIsAddingPointMode = useStore((s) => s.setIsAddingPointMode);
  const setIsMeasuringMode = useStore((s) => s.setIsMeasuringMode);
  const setIsSelectionMode = useStore((s) => s.setIsSelectionMode);
  const setIsEraserMode = useStore((s) => s.setIsEraserMode);
  const setIsEraserChoiceModalOpen = useStore((s) => s.setIsEraserChoiceModalOpen);
  const openElevationProfile = useStore((s) => s.openElevationProfile);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeModal === 'extra_tools') {
        setActiveModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, setActiveModal]);

  if (activeModal !== 'extra_tools') return null;

  const resetInteractiveModes = () => {
    setIsDrawingLineMode(false);
    setIsAddingTextMode(false);
    setIsAddingPointMode(false);
    setIsMeasuringMode(false);
    setIsSelectionMode(false);
    setIsEraserMode(false);
  };

  const handleOpenConverter = () => {
    setActiveModal('converter');
  };

  const handleOpenTwoPointMeasure = () => {
    setActiveModal('two_point_measure');
  };

  const handleOpenStationing = () => {
    setActiveModal('line_stationing');
  };

  const handleOpenElevationProfile = () => {
    setActiveModal(null);
    openElevationProfile({ sourceMode: 'sequence' });
  };

  const handleStartDrawLine = () => {
    resetInteractiveModes();
    setIsDrawingLineMode(true);
    setActiveModal(null);
  };

  const handleStartAddText = () => {
    resetInteractiveModes();
    setIsAddingTextMode(true);
    setActiveModal(null);
  };

  const handleStartContinuousMeasure = () => {
    resetInteractiveModes();
    setIsMeasuringMode(true);
    setActiveModal(null);
  };

  const handleOpenEraser = () => {
    setActiveModal(null);
    setIsEraserChoiceModalOpen(true);
  };

  const handleStartBoxSelect = () => {
    resetInteractiveModes();
    setIsSelectionMode(true);
    setActiveModal(null);
  };

  const tools = [
    {
      id: 'converter',
      title: isAr ? 'محول الإحداثيات الشامل' : 'Universal Coordinate Converter',
      badge: 'UTM / Lat-Lng / MGRS',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      icon: ArrowLeftRight,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/15 border-purple-500/30',
      description: isAr
        ? 'تحويل فوري ودقيق بين أنظمة UTM و WGS84 و MGRS والدرجات العشرية والدقائق والثواني مع كشف رقم النطاق (Zone).'
        : 'Convert coordinates between UTM, WGS84 (Lat/Lng), MGRS, and DMS with automatic UTM zone detection.',
      action: handleOpenConverter,
      btnText: isAr ? 'فتح المحول' : 'Open Converter',
      btnColor: 'bg-purple-600 hover:bg-purple-500 text-white',
    },
    {
      id: 'two_point_measure',
      title: isAr ? 'قياس المسافة والسمت بين نقطتين' : 'Two-Point Measure & Bearing',
      badge: isAr ? 'مسافة + زاوية انحراف' : 'Distance + Azimuth',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      icon: Compass,
      iconColor: 'text-sky-400',
      iconBg: 'bg-sky-500/15 border-sky-500/30',
      description: isAr
        ? 'حساب المسافة الأفقية المباشرة والمسافة المائلة (Slope Distance) والسمت الجغرافي وفرق المنسوب (ΔH) بين أي نقطتين.'
        : 'Calculate direct horizontal distance, 3D slope distance, geographic bearing (Azimuth), and height difference (ΔH).',
      action: handleOpenTwoPointMeasure,
      btnText: isAr ? 'بدء القياس' : 'Open Measure',
      btnColor: 'bg-sky-600 hover:bg-sky-500 text-white',
    },
    {
      id: 'draw_line',
      title: isAr ? 'رسم خطوط ومسارات توضيحية' : 'Draw Lines & Polylines',
      badge: isAr ? 'تخطيط ورسم حر' : 'Interactive Sketch',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      icon: PenTool,
      iconColor: 'text-rose-400',
      iconBg: 'bg-rose-500/15 border-rose-500/30',
      description: isAr
        ? 'رسم خطوط حرة ومسارات هندسية متعددة النقاط على الخريطة بألوان وسماكات مخصصة مع إمكانية تعديلها أو حذفها.'
        : 'Draw multi-point lines and paths directly on the map with custom colors, stroke widths, and dash styles.',
      action: handleStartDrawLine,
      btnText: isAr ? 'تفعيل وضع الرسم' : 'Start Drawing',
      btnColor: 'bg-rose-600 hover:bg-rose-500 text-white',
    },
    {
      id: 'add_text',
      title: isAr ? 'إضافة نصوص وملاحظات على الخريطة' : 'Add Map Text & Labels',
      badge: isAr ? 'ملصقات وملاحظات' : 'Map Annotations',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      icon: Type,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/15 border-amber-500/30',
      description: isAr
        ? 'إضافة عناوين، ملصقات توضيحية، وملاحظات هندسية بنصوص وألوان قابلة للتخصيص فوق معالم الخريطة.'
        : 'Place customizable text notes, title banners, and engineering annotations anywhere on the map.',
      action: handleStartAddText,
      btnText: isAr ? 'إضافة نص' : 'Place Text',
      btnColor: 'bg-amber-600 hover:bg-amber-500 text-white',
    },
    {
      id: 'stationing',
      title: isAr ? 'تثبيت وحساب محطات مسار' : 'Road & Line Stationing',
      badge: 'Chainage / K0+000',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: Route,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/15 border-emerald-500/30',
      description: isAr
        ? 'توليد محطات كيلومترية منتظمة (مثل K0+025، K0+050) على طول مسار مساحي محدد مع حساب الإزاحات (Offsets).'
        : 'Generate regular chainage station points along survey lines with customizable intervals and offsets.',
      action: handleOpenStationing,
      btnText: isAr ? 'فتح أداة المحطات' : 'Open Stationing',
      btnColor: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    },
    {
      id: 'elevation_profile',
      title: isAr ? 'بروفايل الارتفاع والمقطع التضاريسي' : 'Elevation Profile & Terrain',
      badge: isAr ? 'مقطع طولي + طباعة' : 'Profile & Print',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      icon: Mountain,
      iconColor: 'text-teal-400',
      iconBg: 'bg-teal-500/15 border-teal-500/30',
      description: isAr
        ? 'عرض المقطع الطولي لتضاريس ومناسيب النقاط مع حساب الصعود والهبوط الإجمالي وإمكانية التخصيص والطباعة.'
        : 'Generate high-resolution longitudinal elevation profile charts with climb/descent stats and export.',
      action: handleOpenElevationProfile,
      btnText: isAr ? 'عرض البروفايل' : 'View Profile',
      btnColor: 'bg-teal-600 hover:bg-teal-500 text-white',
    },
  ];

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="extra-tools-modal"
        dir={isAr ? 'rtl' : 'ltr'}
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-900 border border-purple-500/40 rounded-3xl shadow-2xl shadow-purple-950/40 overflow-hidden text-slate-100 animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-purple-950/50 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-inner">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  {isAr ? 'الأدوات المساحية والهندسية الإضافية' : 'Survey & Engineering Toolbox'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 hidden sm:inline-block">
                  {isAr ? 'مجموعة الأدوات المتقدمة' : 'Advanced Suite'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr
                  ? 'اختر الأداة المطلوبة للبدء بالتحويلات أو الحسابات الهندسية أو الرسم على الخريطة'
                  : 'Select an engineering tool to start calculations, conversions, or annotations'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all border border-slate-700/60"
            title={isAr ? 'إغلاق (Esc)' : 'Close (Esc)'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Tools Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.id}
                  className="group relative flex flex-col justify-between p-4 sm:p-4.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-purple-500/50 hover:bg-slate-950 transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-purple-950/20"
                >
                  <div className="space-y-2.5">
                    {/* Top Row: Icon + Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl ${tool.iconBg} flex items-center justify-center ${tool.iconColor} shrink-0 shadow-sm transition-transform group-hover:scale-105`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-100 group-hover:text-white transition-colors">
                            {tool.title}
                          </h3>
                          <span
                            className={`inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${tool.badgeColor}`}
                          >
                            {tool.badge}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                      {tool.description}
                    </p>
                  </div>

                  {/* Action Button */}
                  <div className="pt-3 mt-1 border-t border-slate-900 flex justify-end">
                    <button
                      onClick={tool.action}
                      className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${tool.btnColor}`}
                    >
                      <span>{tool.btnText}</span>
                      <ChevronRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Shortcuts Bar */}
          <div className="p-3.5 bg-slate-950/90 border border-slate-800/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="font-medium text-slate-300">
                {isAr ? 'أدوات مساعدة سريعة:' : 'Quick Utility Shortcuts:'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleStartContinuousMeasure}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-300 border border-slate-700/60 hover:border-sky-500/40 text-xs font-medium flex items-center gap-1.5 transition-all"
              >
                <Ruler className="w-3.5 h-3.5 text-sky-400" />
                <span>{isAr ? 'قياس مسافات مستمر' : 'Continuous Measure'}</span>
              </button>

              <button
                onClick={handleStartBoxSelect}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-700/60 hover:border-indigo-500/40 text-xs font-medium flex items-center gap-1.5 transition-all"
              >
                <BoxSelect className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isAr ? 'تحديد مربع ماوس' : 'Box Select'}</span>
              </button>

              <button
                onClick={handleOpenEraser}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-300 border border-slate-700/60 hover:border-rose-500/40 text-xs font-medium flex items-center gap-1.5 transition-all"
              >
                <Eraser className="w-3.5 h-3.5 text-rose-400" />
                <span>{isAr ? 'الممحاة والحذف' : 'Eraser Tool'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3 bg-slate-950 border-t border-slate-800 text-xs text-slate-500">
          <span>
            {isAr
              ? 'تطبيق المساح الذكي - منصة الرفع والجيوماتكس المتكاملة'
              : 'Al-Mussah Professional GIS & Survey Suite'}
          </span>
          <button
            onClick={() => setActiveModal(null)}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
