import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { X, Check, Undo2, Trash2, PenTool, Type, Move, RotateCw } from 'lucide-react';
import { latLngToUTM } from '../utils/utm';

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#ffffff'];

export const AnnotationEditors: React.FC = () => {
  const language = useStore((s) => s.language);
  const isDrawingLineMode = useStore((s) => s.isDrawingLineMode);
  const isAddingTextMode = useStore((s) => s.isAddingTextMode);
  const drawingLinePoints = useStore((s) => s.drawingLinePoints);
  const pendingTextLocation = useStore((s) => s.pendingTextLocation);
  const selectedAnnotationId = useStore((s) => s.selectedAnnotationId);
  const movingAnnotationId = useStore((s) => s.movingAnnotationId);
  const annotations = useStore((s) => s.annotations);

  const [lineModalOpen, setLineModalOpen] = useState(false);
  const [lineName, setLineName] = useState('');
  const [lineColor, setLineColor] = useState('#ef4444');
  const [lineWeight, setLineWeight] = useState(3);
  const [lineDashed, setLineDashed] = useState(false);

  const [textContent, setTextContent] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState(16);

  const selected = annotations.find((a) => a.id === selectedAnnotationId) || null;
  const ar = language === 'ar';

  const saveLine = () => {
    useStore.getState().saveDrawingLine({
      name: lineName, color: lineColor, weight: lineWeight,
      dashArray: lineDashed ? '8, 8' : undefined,
    });
    setLineModalOpen(false); setLineName('');
  };

  const saveText = () => {
    if (!textContent.trim()) return;
    useStore.getState().saveTextLabel({ content: textContent, color: textColor, fontSize: textSize });
    setTextContent('');
  };

  const btn = 'px-3 py-2 rounded-xl text-[11px] font-bold transition-colors min-h-[40px]';

  return (
    <>
      {/* شريط رسم الخط العائم */}
      {isDrawingLineMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1200] pointer-events-none"
             onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
          <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/95 border border-rose-500/50 rounded-2xl px-4 py-2 shadow-2xl text-xs">
            <PenTool className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="text-slate-200">
              {ar ? 'انقر على الخريطة لرسم الخط — النقاط:' : 'Click map to draw — Points:'}
              <b className="text-rose-300 font-mono mx-1">{drawingLinePoints.length}</b>
            </span>
            <button onClick={() => useStore.getState().undoDrawingLinePoint()} disabled={!drawingLinePoints.length}
              className={`${btn} bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-40`}>
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => useStore.getState().cancelDrawingLine()} className={`${btn} bg-slate-800 text-rose-300 hover:bg-slate-700`}>
              {ar ? 'إلغاء' : 'Cancel'}
            </button>
            <button onClick={() => setLineModalOpen(true)} disabled={drawingLinePoints.length < 2}
              className={`${btn} bg-rose-500 text-slate-950 hover:bg-rose-400 disabled:opacity-40 flex items-center gap-1`}>
              <Check className="w-3.5 h-3.5" /> {ar ? 'إنهاء وحفظ' : 'Finish & Save'}
            </button>
          </div>
        </div>
      )}

      {/* شريط وضع النص */}
      {isAddingTextMode && !pendingTextLocation && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1200] pointer-events-none"
             onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
          <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/95 border border-sky-500/50 rounded-2xl px-4 py-2 shadow-2xl text-xs">
            <Type className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="text-slate-200">{ar ? 'انقر على الخريطة لوضع النص' : 'Click map to place text'}</span>
            <button onClick={() => useStore.getState().setIsAddingTextMode(false)} className={`${btn} bg-slate-800 text-rose-300 hover:bg-slate-700`}>
              {ar ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {/* نافذة حفظ الخط */}
      {lineModalOpen && (
        <div className="fixed inset-0 z-[3000] bg-black/60 flex items-center justify-center p-4"
             onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
          <div className="w-80 bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-3 text-xs">
            <h3 className="font-bold text-slate-100 text-sm">{ar ? 'حفظ الخط التوضيحي' : 'Save Line'}</h3>
            <input value={lineName} onChange={(e) => setLineName(e.target.value)}
              placeholder={ar ? 'اسم الخط (اختياري)' : 'Line name (optional)'}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-rose-500" />
            <div className="flex items-center gap-2">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setLineColor(c)}
                  className={`w-7 h-7 rounded-full border-2 ${lineColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">{ar ? 'السماكة' : 'Width'}</span>
              <input type="range" min={1} max={8} value={lineWeight} onChange={(e) => setLineWeight(+e.target.value)} />
              <b className="text-slate-200 font-mono">{lineWeight}</b>
            </div>
            <label className="flex items-center gap-2 text-slate-300">
              <input type="checkbox" checked={lineDashed} onChange={(e) => setLineDashed(e.target.checked)} />
              {ar ? 'خط متقطع' : 'Dashed'}
            </label>
            <div className="flex gap-2 pt-1">
              <button onClick={saveLine} className="flex-1 py-2 rounded-xl bg-rose-500 text-slate-950 font-bold hover:bg-rose-400">
                {ar ? 'حفظ' : 'Save'}
              </button>
              <button onClick={() => setLineModalOpen(false)} className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700">
                {ar ? 'رجوع' : 'Back'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة حفظ النص */}
      {pendingTextLocation && (
        <div className="fixed inset-0 z-[3000] bg-black/60 flex items-center justify-center p-4"
             onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
          <div className="w-80 bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-3 text-xs">
            <h3 className="font-bold text-slate-100 text-sm">{ar ? 'إضافة نص على الخريطة' : 'Add Text Label'}</h3>
            <input autoFocus value={textContent} onChange={(e) => setTextContent(e.target.value)}
              placeholder={ar ? 'اكتب النص هنا...' : 'Type text...'}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500" />
            <div className="flex items-center gap-2">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setTextColor(c)}
                  className={`w-7 h-7 rounded-full border-2 ${textColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">{ar ? 'الحجم' : 'Size'}</span>
              <input type="range" min={12} max={32} value={textSize} onChange={(e) => setTextSize(+e.target.value)} />
              <b className="text-slate-200 font-mono">{textSize}</b>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={saveText} disabled={!textContent.trim()}
                className="flex-1 py-2 rounded-xl bg-sky-500 text-slate-950 font-bold hover:bg-sky-400 disabled:opacity-40">
                {ar ? 'حفظ النص' : 'Save Text'}
              </button>
              <button onClick={() => useStore.getState().setPendingTextLocation(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700">
                {ar ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* شريط العنصر المحدد (حذف وتحريك) */}
      {selected && !movingAnnotationId && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[1200] pointer-events-none"
             onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
          <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/95 border border-amber-500/50 rounded-2xl px-4 py-2 shadow-2xl text-xs">
            <span className="text-slate-200 max-w-[120px] truncate" title={selected.type === 'line' ? selected.name : selected.content}>
              {selected.type === 'line' ? selected.name : selected.content}
            </span>
            <div className="w-px h-6 bg-slate-700 mx-1"></div>
            
            <button onClick={() => useStore.getState().setMovingAnnotationId(selected.id)}
              className={`${btn} bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 flex items-center gap-1`}>
              <Move className="w-3.5 h-3.5" /> {ar ? 'تحريك' : 'Move'}
            </button>

            {selected.type === 'text' && (
              <button 
                onClick={() => {
                  const currentRotation = selected.rotation || 0;
                  useStore.getState().updateAnnotation(selected.id, { rotation: (currentRotation + 45) % 360 });
                }}
                className={`${btn} bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 flex items-center gap-1`}>
                <RotateCw className="w-3.5 h-3.5" /> {ar ? 'تدوير' : 'Rotate'}
              </button>
            )}

            {selected.type === 'line' && (
              <button 
                onClick={() => {
                  const pts = selected.points;
                  if (pts.length < 2) return;
                  let avgLat = 0, avgLng = 0;
                  pts.forEach(p => { avgLat += p.lat; avgLng += p.lng; });
                  avgLat /= pts.length;
                  avgLng /= pts.length;
                  
                  const angle = 45 * (Math.PI / 180);
                  const cos = Math.cos(angle);
                  const sin = Math.sin(angle);

                  const newPoints = pts.map(p => {
                    const dx = p.lng - avgLng;
                    // Lat degrees are not equal to lng degrees in meters, but for a simple visual rotation it might suffice.
                    // A proper way is to project, but for simple UI rotation:
                    // We'll scale lat based on latitude to make it somewhat isotropic
                    const latScale = Math.cos(avgLat * Math.PI / 180);
                    const dy = (p.lat - avgLat) / latScale;
                    
                    const nx = dx * cos - dy * sin;
                    const ny = dx * sin + dy * cos;
                    
                    const nLng = avgLng + nx;
                    const nLat = avgLat + ny * latScale;
                    
                    return { lat: nLat, lng: nLng, utm: latLngToUTM(nLat, nLng, useStore.getState().manualZoneOverride) };
                  });
                  useStore.getState().updateAnnotation(selected.id, { points: newPoints });
                }}
                className={`${btn} bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 flex items-center gap-1`}>
                <RotateCw className="w-3.5 h-3.5" /> {ar ? 'تدوير' : 'Rotate'}
              </button>
            )}

            <button onClick={() => useStore.getState().deleteAnnotation(selected.id)}
              className={`${btn} bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 flex items-center gap-1`}>
              <Trash2 className="w-3.5 h-3.5" /> {ar ? 'حذف' : 'Delete'}
            </button>
            <div className="w-px h-6 bg-slate-700 mx-1"></div>
            <button onClick={() => useStore.getState().setSelectedAnnotationId(null)}
              className={`${btn} bg-slate-800 text-slate-300 hover:bg-slate-700`}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* شريط حالة التحريك */}
      {movingAnnotationId && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1200] pointer-events-none"
             onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
          <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/95 border border-sky-500/50 rounded-2xl px-4 py-2 shadow-2xl text-xs">
            <Move className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="text-slate-200">{ar ? 'انقر على الخريطة لتحديد الموقع الجديد' : 'Click map to set new location'}</span>
            <button onClick={() => useStore.getState().setMovingAnnotationId(null)} className={`${btn} bg-slate-800 text-rose-300 hover:bg-slate-700`}>
              {ar ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
