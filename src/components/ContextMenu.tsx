import React from 'react';
import { useStore } from '../store/useStore';
import { formatUTMString, utmToLatLng, latLngToMGRS } from '../utils/utm';
import { Lock, Unlock, Edit3, Copy, Navigation, Trash2, X, ShieldAlert, Ruler } from 'lucide-react';

export const ContextMenu: React.FC = () => {
  const contextMenu = useStore((s) => s.contextMenu);
  const points = useStore((s) => s.points);
  const language = useStore((s) => s.language);

  const setContextMenu = useStore((s) => s.setContextMenu);
  const togglePointLock = useStore((s) => s.togglePointLock);
  const setEditingPoint = useStore((s) => s.setEditingPoint);
  const setActiveModal = useStore((s) => s.setActiveModal);
  const setSelectedPointId = useStore((s) => s.setSelectedPointId);
  const setPointToPointMeasure = useStore((s) => s.setPointToPointMeasure);
  const deletePoint = useStore((s) => s.deletePoint);
  const showToast = useStore((s) => s.showToast);

  if (!contextMenu) return null;

  const point = points.find((p) => p.id === contextMenu.pointId);
  if (!point) return null;

  const isAr = language === 'ar';

  const handleCopy = () => {
    const text = formatUTMString(point.utm, language);
    navigator.clipboard.writeText(text);
    showToast(isAr ? 'تم نسخ إحداثيات النقطة 📋' : 'Point UTM copied 📋', 'success');
    setContextMenu(null);
  };

  const handleCopyMGRS = () => {
    const { lat, lng } = utmToLatLng(point.utm);
    const text = latLngToMGRS(lat, lng);
    navigator.clipboard.writeText(text);
    showToast(isAr ? 'تم نسخ إحداثيات MGRS العسكرية 📋' : 'MGRS coordinates copied 📋', 'success');
    setContextMenu(null);
  };

  const handleToggleLock = () => {
    togglePointLock(point.id);
    setContextMenu(null);
  };

  const handleEdit = () => {
    setEditingPoint(point);
    setActiveModal('edit_point');
    setContextMenu(null);
  };

  const handleZoom = () => {
    setSelectedPointId(point.id);
    setContextMenu(null);
  };

  const handleMeasureToPoint = () => {
    setPointToPointMeasure(point.id, null);
    showToast(isAr ? 'اختر النقطة الثانية من الخريطة للقياس' : 'Pick second point on map to measure', 'info');
    setContextMenu(null);
  };

  const handleDelete = () => {
    if (point.isLocked) {
      showToast(
        isAr ? 'النقطة مقفلة! يجب فك القفل أولاً لتمكين الحذف' : 'Point is locked! Unlock first to delete',
        'error'
      );
      return;
    }

    deletePoint(point.id);
    setContextMenu(null);
  };

  const popoverStyle: React.CSSProperties = {
    top: Math.min(contextMenu.y, window.innerHeight - 260),
    left: Math.min(Math.max(contextMenu.x - 120, 10), window.innerWidth - 260),
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[3490] bg-transparent"
        onClick={(e) => {
          e.stopPropagation();
          setContextMenu(null);
        }}
      />
      <div
        style={popoverStyle}
        className="fixed z-[3500] bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl p-3 w-64 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 space-y-2"
      >
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: point.color || '#10b981' }}
          />
          <h4 className="font-bold text-slate-100 text-xs truncate">{point.name}</h4>
        </div>
        <button
          onClick={() => setContextMenu(null)}
          className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {point.isLocked && (
        <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-[11px] flex items-center gap-1.5 font-semibold">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span>{isAr ? 'النقطة مقفلة ومحمية من التعديل/الحذف' : 'Point is locked and protected'}</span>
        </div>
      )}

      <div className="space-y-1 text-xs font-medium">
        <button
          onClick={handleToggleLock}
          className={`w-full py-2 px-3 rounded-xl border flex items-center gap-2 transition-colors ${
            point.isLocked
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
          }`}
        >
          {point.isLocked ? (
            <>
              <Unlock className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'إلغاء قفل النقطة' : 'Unlock Point'}</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 text-slate-400" />
              <span>{isAr ? 'قفل النقطة (منع التحريك/الحذف)' : 'Lock Point'}</span>
            </>
          )}
        </button>

        <button
          onClick={handleZoom}
          className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2 transition-colors"
        >
          <Navigation className="w-4 h-4 text-emerald-400" />
          <span>{isAr ? 'التركيز والانتقال المباشر' : 'Zoom To Point'}</span>
        </button>

        <button
          onClick={handleMeasureToPoint}
          className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 flex items-center gap-2 transition-colors"
        >
          <Ruler className="w-4 h-4 text-amber-400" />
          <span>{isAr ? 'قياس المسافة إلى نقطة أخرى' : 'Measure To Another Point'}</span>
        </button>

        <button
          onClick={handleEdit}
          className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2 transition-colors"
        >
          <Edit3 className="w-4 h-4 text-sky-400" />
          <span>{isAr ? 'تعديل البيانات والتصنيف' : 'Edit Details'}</span>
        </button>

        <button
          onClick={handleCopy}
          className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2 transition-colors"
        >
          <Copy className="w-4 h-4 text-emerald-400" />
          <span>{isAr ? 'نسخ إحداثيات UTM' : 'Copy UTM Coords'}</span>
        </button>

        <button
          onClick={handleCopyMGRS}
          className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2 transition-colors"
        >
          <Copy className="w-4 h-4 text-amber-400" />
          <span>{isAr ? 'نسخ إحداثيات MGRS' : 'Copy MGRS Coords'}</span>
        </button>

        <button
          onClick={handleDelete}
          disabled={point.isLocked}
          className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-40 text-rose-300 border border-rose-500/30 flex items-center gap-2 transition-colors"
        >
          <Trash2 className="w-4 h-4 text-rose-400" />
          <span>{isAr ? 'حذف النقطة' : 'Delete Point'}</span>
        </button>
      </div>
    </div>
  </>
  );
};
