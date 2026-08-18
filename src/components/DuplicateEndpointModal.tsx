import React from 'react';
import { useStore } from '../store/useStore';
import {
  AlertTriangle,
  CheckCircle2,
  Trash2,
  MapPin,
  X,
  Layers,
  ArrowRightLeft,
  Mountain,
  Compass,
} from 'lucide-react';

export const DuplicateEndpointModal: React.FC = () => {
  const activeModal = useStore((s) => s.activeModal);
  const duplicateEndpointCheck = useStore((s) => s.duplicateEndpointCheck);
  const resolveDuplicateEndpoints = useStore((s) => s.resolveDuplicateEndpoints);
  const language = useStore((s) => s.language);

  const isAr = language === 'ar';

  if (activeModal !== 'duplicate_endpoint_check' || !duplicateEndpointCheck) {
    return null;
  }

  const { firstPoint, lastPoint, distanceMeters } = duplicateEndpointCheck;

  return (
    <div
      id="duplicate-endpoint-modal"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800 bg-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-inner shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>
                  {isAr
                    ? 'تطابق إحداثيات نقطة البداية والنهاية'
                    : 'Duplicate Endpoint Coordinates Detected'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {distanceMeters <= 0.05
                    ? isAr
                      ? 'تطابق تام 0.00م'
                      : '0.00m Exact'
                    : `${distanceMeters.toFixed(2)} ${isAr ? 'متر' : 'm'}`}
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {isAr
                  ? 'تم رصد وجود نقطتين في نفس الموقع الجغرافي عند بداية ونهاية السلسلة. يرجى اختيار النقطة التي تود الاحتفاظ بها:'
                  : 'The start and end points in this sequence share the same location. Please choose which point you would like to keep:'}
              </p>
            </div>
          </div>

          <button
            onClick={() => resolveDuplicateEndpoints('keep_both')}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors shrink-0"
            title={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Point Card */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border-2 border-emerald-500/40 space-y-3 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 left-0 h-1 bg-emerald-500" />
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {isAr ? 'النقطة الأولى (البداية)' : 'First Point (Start)'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(firstPoint.timestamp).toLocaleTimeString(
                      isAr ? 'ar-EG' : 'en-US',
                      { hour: '2-digit', minute: '2-digit' }
                    )}
                  </span>
                </div>

                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{isAr ? 'اسم النقطة:' : 'Point Name:'}</span>
                    <span className="font-bold text-sm text-emerald-300 font-mono">
                      {firstPoint.name}
                    </span>
                  </div>

                  {firstPoint.category && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{isAr ? 'التصنيف:' : 'Category:'}</span>
                      <span className="text-xs text-slate-200">{firstPoint.category}</span>
                    </div>
                  )}

                  {firstPoint.elevation !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{isAr ? 'المنسوب (Z):' : 'Elevation (Z):'}</span>
                      <span className="text-xs font-mono text-amber-300">
                        {firstPoint.elevation.toFixed(2)} {isAr ? 'م' : 'm'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Coordinates */}
                <div className="mt-2 text-[11px] font-mono text-slate-400 space-y-0.5 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between">
                    <span>E (X):</span>
                    <span className="text-slate-200">{firstPoint.utm.easting.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>N (Y):</span>
                    <span className="text-slate-200">{firstPoint.utm.northing.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>UTM Zone:</span>
                    <span className="text-slate-200">{firstPoint.utm.zone}{firstPoint.utm.hemisphere}</span>
                  </div>
                </div>
              </div>

              {/* Action Button for First Point */}
              <button
                onClick={() => resolveDuplicateEndpoints('keep_first')}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isAr
                    ? `الاحتفاظ بالنقطة الأولى [${firstPoint.name}]`
                    : `Keep First Point [${firstPoint.name}]`}
                </span>
              </button>
            </div>

            {/* Last Point Card */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border-2 border-sky-500/40 space-y-3 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 left-0 h-1 bg-sky-500" />
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {isAr ? 'النقطة الأخيرة (النهاية)' : 'Last Point (End)'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(lastPoint.timestamp).toLocaleTimeString(
                      isAr ? 'ar-EG' : 'en-US',
                      { hour: '2-digit', minute: '2-digit' }
                    )}
                  </span>
                </div>

                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{isAr ? 'اسم النقطة:' : 'Point Name:'}</span>
                    <span className="font-bold text-sm text-sky-300 font-mono">
                      {lastPoint.name}
                    </span>
                  </div>

                  {lastPoint.category && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{isAr ? 'التصنيف:' : 'Category:'}</span>
                      <span className="text-xs text-slate-200">{lastPoint.category}</span>
                    </div>
                  )}

                  {lastPoint.elevation !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{isAr ? 'المنسوب (Z):' : 'Elevation (Z):'}</span>
                      <span className="text-xs font-mono text-amber-300">
                        {lastPoint.elevation.toFixed(2)} {isAr ? 'م' : 'm'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Coordinates */}
                <div className="mt-2 text-[11px] font-mono text-slate-400 space-y-0.5 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between">
                    <span>E (X):</span>
                    <span className="text-slate-200">{lastPoint.utm.easting.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>N (Y):</span>
                    <span className="text-slate-200">{lastPoint.utm.northing.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>UTM Zone:</span>
                    <span className="text-slate-200">{lastPoint.utm.zone}{lastPoint.utm.hemisphere}</span>
                  </div>
                </div>
              </div>

              {/* Action Button for Last Point */}
              <button
                onClick={() => resolveDuplicateEndpoints('keep_last')}
                className="w-full py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-sky-500/20 transition-all active:scale-[0.98]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isAr
                    ? `الاحتفاظ بالنقطة الأخيرة [${lastPoint.name}]`
                    : `Keep Last Point [${lastPoint.name}]`}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400 hidden sm:inline">
            {isAr
              ? 'اختيار إحدى النقطتين سيقوم بحذف النقطة المكررة تلقائياً.'
              : 'Selecting one point will automatically delete the duplicate point.'}
          </span>
          <button
            onClick={() => resolveDuplicateEndpoints('keep_both')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            {isAr ? 'الإبقاء على كلا النقطتين معاً' : 'Keep Both Points'}
          </button>
        </div>
      </div>
    </div>
  );
};
