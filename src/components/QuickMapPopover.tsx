import React from 'react';
import { useStore } from '../store/useStore';
import { formatUTMString } from '../utils/utm';
import { Plus, Ruler, Copy, X, MapPin } from 'lucide-react';

export const QuickMapPopover: React.FC = () => {
  const quickMapPopover = useStore((s) => s.quickMapPopover);
  const language = useStore((s) => s.language);
  const setQuickMapPopover = useStore((s) => s.setQuickMapPopover);
  const setTempMapClickCoords = useStore((s) => s.setTempMapClickCoords);
  const setActiveModal = useStore((s) => s.setActiveModal);
  const addMeasurePoint = useStore((s) => s.addMeasurePoint);
  const setIsMeasuringMode = useStore((s) => s.setIsMeasuringMode);
  const showToast = useStore((s) => s.showToast);

  if (!quickMapPopover) return null;

  const { lat, lng, utm, x, y } = quickMapPopover;
  const isAr = language === 'ar';

  const handleAddPoint = () => {
    setTempMapClickCoords({ lat, lng, utm });
    setActiveModal('add_point');
    setQuickMapPopover(null);
  };

  const handleStartMeasure = () => {
    setIsMeasuringMode(true);
    addMeasurePoint({
      id: `m_${Date.now()}`,
      lat,
      lng,
      utm,
    });
    setQuickMapPopover(null);
  };

  const handleCopyUTM = () => {
    const text = formatUTMString(utm, language);
    navigator.clipboard.writeText(text);
    showToast(isAr ? 'تم نسخ إحداثيات UTM بنجاح 📋' : 'UTM coordinates copied 📋', 'success');
    setQuickMapPopover(null);
  };

  // Adjust positioning so popover stays on screen
  const popoverStyle: React.CSSProperties = {
    top: Math.min(y, window.innerHeight - 200),
    left: Math.min(Math.max(x - 120, 10), window.innerWidth - 260),
  };

  return (
    <div
      style={popoverStyle}
      className="fixed z-[3500] bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl p-3 w-64 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 space-y-2"
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isAr ? 'موقع خريطة UTM' : 'UTM Map Location'}</span>
        </div>
        <button
          onClick={() => setQuickMapPopover(null)}
          className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="bg-slate-950 p-2 rounded-xl text-[11px] font-mono text-slate-300 space-y-0.5 border border-slate-800">
        <div>
          <span className="text-slate-400">Zone:</span>{' '}
          <span className="text-amber-400 font-bold">{utm.zone}{utm.hemisphere}</span>
        </div>
        <div>
          <span className="text-slate-400">Easting (X):</span>{' '}
          <span className="text-emerald-400 font-semibold">{utm.easting.toFixed(2)} m</span>
        </div>
        <div>
          <span className="text-slate-400">Northing (Y):</span>{' '}
          <span className="text-sky-400 font-semibold">{utm.northing.toFixed(2)} m</span>
        </div>
      </div>

      <div className="space-y-1 pt-1 text-xs font-medium">
        <button
          onClick={handleAddPoint}
          className="w-full py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>{isAr ? 'إضافة نقطة مساحية هنا' : 'Add Survey Point Here'}</span>
        </button>

        <button
          onClick={handleStartMeasure}
          className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 flex items-center gap-2 transition-colors"
        >
          <Ruler className="w-4 h-4 text-amber-400" />
          <span>{isAr ? 'بدء قياس المسافة من هنا' : 'Measure Distance From Here'}</span>
        </button>

        <button
          onClick={handleCopyUTM}
          className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2 transition-colors"
        >
          <Copy className="w-4 h-4 text-sky-400" />
          <span>{isAr ? 'نسخ إحداثيات UTM' : 'Copy UTM Coordinates'}</span>
        </button>
      </div>
    </div>
  );
};
