import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { formatUTMString, getMGRSBandFromLat, latLngToMGRS } from '../utils/utm';
import { fetchElevation } from '../utils/elevation';
import { getTranslation } from '../utils/translations';
import { Plus, Ruler, Copy, X, MapPin, Loader2 } from 'lucide-react';

export const QuickMapPopover: React.FC = () => {
  const quickMapPopover = useStore((s) => s.quickMapPopover);
  const language = useStore((s) => s.language);
  const autoFetchElevation = useStore((s) => s.autoFetchElevation);
  const setQuickMapPopover = useStore((s) => s.setQuickMapPopover);
  const setTempMapClickCoords = useStore((s) => s.setTempMapClickCoords);
  const setActiveModal = useStore((s) => s.setActiveModal);
  const addMeasurePoint = useStore((s) => s.addMeasurePoint);
  const setIsMeasuringMode = useStore((s) => s.setIsMeasuringMode);
  const showToast = useStore((s) => s.showToast);

  const [elevationVal, setElevationVal] = useState<number | null>(null);
  const [isFetchingElev, setIsFetchingElev] = useState(false);

  useEffect(() => {
    if (!quickMapPopover || !autoFetchElevation) {
      setElevationVal(null);
      setIsFetchingElev(false);
      return;
    }

    let isMounted = true;
    setIsFetchingElev(true);
    setElevationVal(null);

    fetchElevation(quickMapPopover.lat, quickMapPopover.lng)
      .then((elev) => {
        if (isMounted) {
          setElevationVal(elev);
          setIsFetchingElev(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsFetchingElev(false);
      });

    return () => {
      isMounted = false;
    };
  }, [quickMapPopover, autoFetchElevation]);

  if (!quickMapPopover) return null;

  const { lat, lng, utm, x, y } = quickMapPopover;
  const isAr = language === 'ar';

  const handleAddPoint = () => {
    setTempMapClickCoords({
      lat,
      lng,
      utm,
      elevation: elevationVal !== null ? elevationVal : undefined,
    });
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

  const handleCopyMGRS = () => {
    const text = latLngToMGRS(lat, lng);
    navigator.clipboard.writeText(text);
    showToast(isAr ? 'تم نسخ إحداثيات MGRS بنجاح 📋' : 'MGRS coordinates copied 📋', 'success');
    setQuickMapPopover(null);
  };

  // Adjust positioning so popover stays on screen
  const popoverStyle: React.CSSProperties = {
    top: Math.min(y, window.innerHeight - 200),
    left: Math.min(Math.max(x - 120, 10), window.innerWidth - 260),
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[3490] bg-transparent"
        onClick={(e) => {
          e.stopPropagation();
          setQuickMapPopover(null);
        }}
      />
      <div
        style={popoverStyle}
        className="fixed z-[3500] bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl p-3 w-64 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 space-y-2"
      >
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isAr ? 'إحداثيات الموقع المحدد' : 'Selected Location Coordinates'}</span>
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
          <span className="text-slate-400 font-sans">Zone:</span>{' '}
          <span className="text-amber-400 font-bold">
            {utm.zone}{getMGRSBandFromLat(lat)} ({utm.hemisphere === 'N' ? (isAr ? 'شمال' : 'North') : (isAr ? 'جنوب' : 'South')})
          </span>
        </div>
        <div>
          <span className="text-slate-400 font-sans">Easting (X):</span>{' '}
          <span className="text-emerald-400 font-semibold">{utm.easting.toFixed(2)} m</span>
        </div>
        <div>
          <span className="text-slate-400 font-sans">Northing (Y):</span>{' '}
          <span className="text-sky-400 font-semibold">{utm.northing.toFixed(2)} m</span>
        </div>
        <div>
          <span className="text-slate-400 font-sans">Elev (Z):</span>{' '}
          {isFetchingElev ? (
            <span className="text-purple-400 inline-flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin inline" />
              <span className="font-sans text-[10px]">{getTranslation(language, 'fetchingElevation')}</span>
            </span>
          ) : elevationVal !== null ? (
            <span className="text-purple-300 font-bold">{elevationVal.toFixed(1)} m</span>
          ) : (
            <span className="text-slate-500">—</span>
          )}
        </div>
        <div className="border-t border-slate-800/80 pt-1 mt-1 text-[10px]">
          <span className="text-slate-400 font-sans">MGRS:</span>{' '}
          <span className="text-amber-400 font-semibold">{latLngToMGRS(lat, lng)}</span>
        </div>
      </div>

      <div className="space-y-1 pt-1 text-xs font-medium">
        <button
          onClick={handleAddPoint}
          className="w-full py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>{isAr ? 'إضافة نقطة هنا' : 'Add Survey Point Here'}</span>
        </button>

        <button
          onClick={handleStartMeasure}
          className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 flex items-center gap-2 transition-colors"
        >
          <Ruler className="w-4 h-4 text-amber-400" />
          <span>{isAr ? 'بدء القياس الحي المستمر من هنا' : 'Start Live Measurement From Here'}</span>
        </button>

        <button
          onClick={handleCopyUTM}
          className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 flex items-center gap-2 transition-colors"
        >
          <Copy className="w-4 h-4 text-sky-400" />
          <span>{isAr ? 'نسخ إحداثيات UTM' : 'Copy UTM Coordinates'}</span>
        </button>

        <button
          onClick={handleCopyMGRS}
          className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 flex items-center gap-2 transition-colors"
        >
          <Copy className="w-4 h-4 text-amber-400" />
          <span>{isAr ? 'نسخ إحداثيات MGRS' : 'Copy MGRS Coordinates'}</span>
        </button>
      </div>
    </div>
  </>
  );
};
