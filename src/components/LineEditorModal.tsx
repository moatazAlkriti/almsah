import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { getTranslation } from '../utils/translations';
import { AnnotationLine } from '../types';
import { PenTool, X, Save, Palette, Sliders } from 'lucide-react';

const PRESET_COLORS = [
  '#ef4444', // Red (Default clear contrast)
  '#f97316', // Orange
  '#eab308', // Yellow
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#ffffff', // White
  '#000000', // Black
];

interface LineEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  line: AnnotationLine | null; // Null if creating new after finishDrawingLine
  onSave: (config: { name: string; color: string; weight: number; dashArray?: string }) => void;
  onDelete?: () => void;
}

export const LineEditorModal: React.FC<LineEditorModalProps> = ({
  isOpen,
  onClose,
  line,
  onSave,
  onDelete,
}) => {
  const language = useStore((s) => s.language);
  const isAr = language === 'ar';

  const [name, setName] = useState('');
  const [color, setColor] = useState('#ef4444');
  const [weight, setWeight] = useState(3);
  const [isDashed, setIsDashed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (line) {
        setName(line.name);
        setColor(line.color || '#ef4444');
        setWeight(line.weight || 3);
        setIsDashed(Boolean(line.dashArray));
      } else {
        setName('');
        setColor('#ef4444');
        setWeight(3);
        setIsDashed(false);
      }
    }
  }, [isOpen, line]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: name.trim() || (isAr ? 'خط توضيحي' : 'Annotation Line'),
      color,
      weight,
      dashArray: isDashed ? '6, 8' : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                {line ? getTranslation(language, 'editAnnotation') : getTranslation(language, 'drawLine')}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isAr ? 'تخصيص لون وسماكة ونمط الخط التوضيحي' : 'Customize style and properties of line'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {getTranslation(language, 'lineName')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isAr ? 'مثال: حد العقد الشمالي' : 'e.g. Northern Property Boundary'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-rose-400" />
                {getTranslation(language, 'lineColor')}
              </span>
              <span className="text-[10px] text-slate-400 font-mono uppercase">{color}</span>
            </label>

            <div className="flex items-center gap-2 flex-wrap mb-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-xl border transition-all transform active:scale-90 ${
                    color === c ? 'scale-110 border-white shadow-lg shadow-black/50' : 'border-slate-700 opacity-80 hover:opacity-100'
                  }`}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-7 h-7 rounded-xl border border-slate-700 cursor-pointer bg-transparent"
              />
            </div>
          </div>

          {/* Width / Weight Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-rose-400" />
                {getTranslation(language, 'lineWidth')}
              </span>
              <span className="text-xs font-mono text-rose-400">{weight} px</span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              step="1"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full accent-rose-500 bg-slate-950 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* Line Style (Solid vs Dashed) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              {getTranslation(language, 'lineStyle')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsDashed(false)}
                className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                  !isDashed
                    ? 'bg-rose-500/15 border-rose-500/50 text-rose-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="w-8 h-0.5 bg-current" />
                <span>{getTranslation(language, 'solid')}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDashed(true)}
                className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                  isDashed
                    ? 'bg-rose-500/15 border-rose-500/50 text-rose-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="w-8 h-0.5 bg-current border-b border-dashed border-current" />
                <span>{getTranslation(language, 'dashed')}</span>
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between">
            <span className="text-xs text-slate-400">{isAr ? 'معاينة المظهر:' : 'Preview:'}</span>
            <div className="w-32 h-6 flex items-center justify-center">
              <div
                style={{
                  width: '100%',
                  height: `${weight}px`,
                  backgroundColor: color,
                  borderStyle: isDashed ? 'dashed' : 'solid',
                }}
                className="rounded-full shadow-sm"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            {line && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="py-2.5 px-3 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors"
                title={getTranslation(language, 'deleteAnnotation')}
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-800 text-xs font-medium text-slate-400 hover:bg-slate-800 transition-colors"
            >
              {getTranslation(language, 'cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-rose-500/20"
            >
              <Save className="w-4 h-4" />
              <span>{getTranslation(language, 'saveAnnotation')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
