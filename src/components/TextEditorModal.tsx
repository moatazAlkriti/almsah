import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { getTranslation } from '../utils/translations';
import { AnnotationText } from '../types';
import { Type, X, Save, Palette, Type as TypeIcon } from 'lucide-react';

const PRESET_COLORS = [
  '#ffffff', // White
  '#000000', // Black
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#ec4899', // Pink
];

interface TextEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  textAnnotation: AnnotationText | null;
  onSave: (config: { content: string; color: string; fontSize: number; backgroundColor?: string; rotation?: number }) => void;
  onDelete?: () => void;
}

export const TextEditorModal: React.FC<TextEditorModalProps> = ({
  isOpen,
  onClose,
  textAnnotation,
  onSave,
  onDelete,
}) => {
  const language = useStore((s) => s.language);
  const isAr = language === 'ar';

  const [content, setContent] = useState('');
  const [color, setColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState(16);
  const [backgroundColor, setBackgroundColor] = useState('');
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (isOpen) {
      if (textAnnotation) {
        setContent(textAnnotation.content);
        setColor(textAnnotation.color || '#ffffff');
        setFontSize(textAnnotation.fontSize || 16);
        setBackgroundColor(textAnnotation.backgroundColor || '');
        setRotation(textAnnotation.rotation || 0);
      } else {
        setContent('');
        setColor('#ffffff');
        setFontSize(16);
        setBackgroundColor('');
        setRotation(0);
      }
    }
  }, [isOpen, textAnnotation]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    onSave({
      content: content.trim(),
      color,
      fontSize,
      backgroundColor: backgroundColor || undefined,
      rotation,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                {textAnnotation ? getTranslation(language, 'editAnnotation') : getTranslation(language, 'addText')}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isAr ? 'إضافة وتنسيق نص توضيحي على الخريطة' : 'Add and format text label on the map'}
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
          {/* Content */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {getTranslation(language, 'textContent')}
            </label>
            <input
              type="text"
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={isAr ? 'أدخل النص هنا...' : 'Enter text here...'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Font Size */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <TypeIcon className="w-3.5 h-3.5 text-amber-400" />
                {getTranslation(language, 'fontSize')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="12"
                  max="32"
                  step="1"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-amber-500 bg-slate-950 h-2 rounded-lg cursor-pointer"
                />
                <span className="text-xs font-mono text-amber-400 w-6">{fontSize}</span>
              </div>
            </div>

            {/* Rotation */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {getTranslation(language, 'rotation')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full accent-amber-500 bg-slate-950 h-2 rounded-lg cursor-pointer"
                />
                <span className="text-xs font-mono text-amber-400 w-6">{rotation}°</span>
              </div>
            </div>
          </div>

          {/* Text Color Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                {getTranslation(language, 'textColor')}
              </span>
            </label>

            <div className="flex items-center gap-2 flex-wrap mb-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-xl border transition-all transform active:scale-90 ${
                    color === c ? 'scale-110 border-amber-500 shadow-lg shadow-black/50' : 'border-slate-700 opacity-80 hover:opacity-100'
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

          {/* Background Color */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              {getTranslation(language, 'backgroundColor')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={backgroundColor || '#000000'}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className={`w-7 h-7 rounded-xl border border-slate-700 cursor-pointer bg-transparent ${!backgroundColor ? 'opacity-50' : ''}`}
              />
              <button
                type="button"
                onClick={() => setBackgroundColor(backgroundColor ? '' : '#00000080')} // 50% opacity black as default
                className="text-xs px-2 py-1 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 transition-colors"
              >
                {backgroundColor ? (isAr ? 'إزالة الخلفية' : 'Remove Background') : (isAr ? 'إضافة خلفية' : 'Add Background')}
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="p-3 bg-slate-800/50 border border-slate-800 rounded-2xl flex flex-col items-center justify-center min-h-[80px] overflow-hidden relative"
            style={{ backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)', backgroundSize: '10px 10px' }}
          >
            <div
              style={{
                color: color,
                fontSize: `${fontSize}px`,
                backgroundColor: backgroundColor || 'transparent',
                transform: `rotate(${rotation}deg)`,
                padding: backgroundColor ? '4px 8px' : '0',
                borderRadius: '4px',
                textShadow: !backgroundColor ? '0px 0px 3px rgba(0,0,0,0.8), 1px 1px 2px rgba(0,0,0,0.8)' : 'none',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
              }}
            >
              {content || (isAr ? 'نص معاينة' : 'Preview Text')}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            {textAnnotation && onDelete && (
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
              disabled={!content.trim()}
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-amber-500/20"
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
