# المساح | UTM GIS Collector & Surveying Tool 🗺️

<p align="center">
  <b>أداة احترافية ميدانية لجمع نقاط الرفع المساحي بنظام الإحداثيات العالمي UTM وتصدير البيانات إلى Excel</b><br/>
  <i>Professional UTM survey point collector & field GIS tool with real-time coordinate transformations and offline PWA support.</i>
</p>

---

## 📖 جدول المحتويات (Table of Contents)
- [نبذة عن التطبيق (Overview)](#-نبذة-عن-التطبيق-overview)
- [الميزات الرئيسية (Key Features)](#-الميزات-الرئيسية-key-features)
- [تعليمات تثبيت التطبيق كمُثبَّت PWA (PWA Installation)](#-تعليمات-تثبيت-التطبيق-كمثبت-pwa-pwa-installation)
- [اختصارات لوحة المفاتيح (Keyboard Shortcuts)](#-اختصارات-لوحة-المفاتيح-keyboard-shortcuts)
- [التقنيات المستخدمة (Tech Stack)](#-التقنيات-المستخدمة-tech-stack)
- [التثبيت والتشغيل المحلي (Getting Started)](#-التثبيت-والتشغيل-المحلي-getting-started)
- [دليل النشر على المنصات (Deployment Guide)](#-دليل-النشر-على-المنصات-deployment-guide)
- [قائمة تحقق اختبار التطبيق (Testing Checklist)](#-قائمة-تحقق-اختبار-التطبيق-testing-checklist)
- [الترخيص (License)](#-الترخيص-license)

---

## 🌟 نبذة عن التطبيق (Overview)

تطبيق **المساح** هو منصة جغرافية مساحية متكاملة تعمل على المتصفح والأجهزة المحمولة (PWA). تم تصميمه خصيصاً للمهندسين المساحيين وجامعي البيانات الميدانية وفنيي نظم المعلومات الجغرافية (GIS) لجمع ونقل وإدارة نقاط الرفع المساحي الميدانية بنظام إحداثيات **UTM (Universal Transverse Mercator)** بدقة متناهية.

---

## 🚀 الميزات الرئيسية (Key Features)

### 1. عرض وخرائط تفاعلية احترافية (GIS Map Viewer):
* **طبقات خرائط متعددة:** أقمار صناعية عالية الدقة (**Esri World Imagery**)، خريطة هجينة أسماء وحدود (Hybrid)، شوارع (OpenStreetMap)، وتضاريس (OpenTopoMap).
* **شريط إحداثيات حي:** عرض مباشر لإحداثيات UTM (Easting, Northing, Zone, Hemisphere) والارتفاع تحت المؤشر بالدقة والمتر.

### 2. إدارة نقاط الرفع المساحي (Survey Points Engine):
* **إضافة متتالية سريعة ⚡:** وضع إضافة النقاط النقري الفوري المتتابعة دون إغلاق النافذة.
* **سحب العلامات مع Tooltip حي:** سحب وإسقاط النقاط مع ظهور نافذة UTM حية شفافة تتبع المؤشر وتحسب المسافة المقطوعة لحظياً.
* **قفل حماية النقاط 🔒:** خيار قفل النقاط الهامة لمنع تحريكها أو حذفها بالخطأ.
* **تراجع سريع (MoveToast & Ctrl+Z):** إمكانية التراجع اللحظي عن تحريك أي نقطة بضغطة زر أو باختصار الكيبورد.
* **تصنيف وارتفاع Z:** دعم تصنيفات مساحية شائعة (نقاط ضبط GCP، حدود، ارتفاعات، بنية تحتية، معالم) مع إمكانية التعديل السريع Direct Inline Edit.

### 3. استيراد وتصدير إكسل احترافي (Excel (.xlsx) I/O):
* تصدير جميع النقاط بزر واحد إلى ملف إكسل مفرز الأعمدة شامل بيانات UTM والتاريخ والتصنيفات.
* استيراد ملفات إكسل سابقة مع معاينة جدولية حية واكتشاف تلقائي لأعمدة الإحداثيات.

### 4. أداة قياس المسافات الجيوديسية (Geodesic Measurement):
* رسم مسارات متعددة النقاط وحساب المسافة المقطوعة بالمتر والكيلومتر بدقة جيوديسية.

---

## 📱 تعليمات تثبيت التطبيق كمُثبَّت PWA (PWA Installation)

تطبيق **المساح** يدعم معيار **Progressive Web App (PWA)** بالكامل، ويمكن تثبيته كـ أداة مستقلة تعمل بدون شريط المتصفح وتدعم العمل الأوفلاين:

### على هواتف آيفون و iPad (iOS Safari):
1. افتح رابط التطبيق في متصفح **Safari**.
2. اضغط على زر **المشاركة (Share Button)** أسفل الشاشة.
3. اختر **إضافة إلى الشاشة الرئيسية (Add to Home Screen)**.
4. اضغط **إضافة (Add)** وسيظهر أيقونة "المساح" على شاشتك الرئيسية.

### على أجهزة أندرويد (Android Chrome):
1. افتح رابط التطبيق في متصفح **Google Chrome**.
2. انقر على القائمة (النقاط الثلاث 🎨 في الزاوية العلوية).
3. اختر **تثبيت التطبيق (Install App)** أو **إضافة إلى الشاشة الرئيسية**.

### على أجهزة الكومبيوتر (Desktop Chrome / Edge / Brave):
1. افتح التطبيق في المتصفح.
2. انقر على أيقونة التثبيت 💻 العلوية في شريط العنوان (Address Bar) أو اختر **Install Al-Mussah**.

---

## ⌨️ اختصارات لوحة المفاتيح (Keyboard Shortcuts)

تم تزويد التطبيق باختصارات سريعة للرفع الميداني (يتم تعطيلها تلقائياً أثناء الكتابة داخل الحقول النصية لمنع التداخل):

| الاختصار (Shortcut) | الوظيفة (Action) |
|---|---|
| `Ctrl + Z` / `Cmd + Z` | التراجع عن آخر عملية تحريك لنقطة على الخريطة (Undo Move). |
| `A` | تفعيل / إلغاء تفعيل وضع إضافة النقاط السريع (Toggle Add Mode). |
| `M` | تفعيل / إلغاء تفعيل أداة قياس المسافات (Toggle Measurement Tool). |
| `Escape` | إغلاق النوافذ المنبثقة أو إلغاء الوضع النشط. |
| `Delete` / `Backspace` | حذف النقطة المحددة (عند عدم التواجد داخل حقل كتابة). |

---

## 🛠️ التقنيات المستخدمة (Tech Stack)

* **React 19** + **TypeScript 5.8**
* **Vite** + **vite-plugin-pwa** للـ Progressive Web App
* **Leaflet** لإدارة طبقات الخرائط والـ Canvas Renderers
* **Proj4** للتحويل الرياضي بين WGS84 و إحداثيات UTM
* **SheetJS (xlsx)** لتوليد واستيراد شيتات الإكسل
* **Zustand** لإدارة الحالة والتخزين المحلي المحفوظ تلقائياً
* **Tailwind CSS v4** للتصميم التكيفي الفاخر

---

## 💻 التثبيت والتشغيل المحلي (Getting Started)

```bash
# 1. استنساخ المشروع أو فتح المجلد
cd al-mussah

# 2. تثبيت الحزم والمكتبات
npm install

# 3. تشغيل سيرفر التطوير المحلي
npm run dev

# 4. فحص الأخطاء والـ TypeScript
npm run lint

# 5. بناء النسخة الإنتاجية
npm run build
```

---

## 🚀 دليل النشر على المنصات (Deployment Guide)

### النشر على Vercel:

هذا المشروع مهيأ بالكامل للنشر على Vercel مع دعم التوجيه (Routing) والـ PWA (من خلال ملف `vercel.json` المرفق).

**الطريقة الأولى: النشر عبر GitHub (موصى بها):**
1. ارفع الكود إلى مستودع GitHub.
2. اذهب إلى [Vercel](https://vercel.com) وقم باستيراد المستودع.
3. الإعدادات التلقائية (Framework: Vite, Build: `npm run build`, Output: `dist`) ستكون جاهزة.
4. اضغط Deploy.

**الطريقة الثانية: النشر عبر Vercel CLI:**
```bash
# تسجيل الدخول وربط المشروع
npx vercel

# النشر لبيئة الإنتاج (Production)
npx vercel --prod
```

### النشر على Netlify:
```bash
npx netlify-cli deploy --prod --dir=dist
```

### النشر على Cloud Run / Docker:
التطبيق مجهز للعمل عبر سيرفر Node/Express خفيف يعرض ملفات `dist` الساكنة على البورت 3000.

---

## 📋 قائمة تحقق اختبار التطبيق (Testing Checklist)

| # | الوظيفة / Feature | وصف الاختبار (Arabic) | Test Description (English) |
|---|---|---|---|
| **1** | **إضافة نقطة خريطة** | انقر على الخريطة بالماوس أو اللمس لفتح نافذة إضافة نقطة مع جلب إحداثيات UTM تلقائياً. | Click map or touch to open add modal with auto-captured UTM coords. |
| **2** | **وضع الإضافة المتتالية ⚡** | فعّل وضع "إضافة متتالية" وانقر عدة مرات متتالية على الخريطة لإضافة نقاط فورية دون إغلاق الوضع. | Activate Continuous Add Mode and click repeatedly to quickly plot points. |
| **3** | **سحب العلامات & Live Tooltip** | اسحب أي علامة غير مقفلة؛ لاحظ ظهور Tooltip حي شفاف يعرض UTM أثناء السحب وحساب المسافة المقطوعة. | Drag any unlocked marker; verify floating Live UTM tooltip during drag. |
| **4** | **التراجع عن التحريك (MoveToast)** | بعد نقل أي نقطة، يظهر شريط MoveToast أسفل الشاشة. اضغط "تراجع" أو استخدم `Ctrl+Z` لإعادة النقطة لموقعها. | After moving a point, click "Revert" on MoveToast or press `Ctrl+Z` to undo move. |
| **5** | **قفل النقاط 🔒** | اضغط قفل لنقطة؛ تأكد من عدم إمكانية سحبها أو حذفها حتى يتم فك القفل. | Lock a point; confirm it cannot be dragged or deleted until unlocked. |
| **6** | **التعديل السريع (Inline Edit)** | اضغط تعديل في كارت النقطة، وغير التصنيف أو الارتفاع Z واحفظ التغييرات مباشرة. | Click Edit in point card, change category or elevation Z and save instantly. |
| **7** | **تصدير الإكسل (.xlsx)** | اضغط تصدير Excel، وافتح الملف للتأكد من تنسيق الأعمدة ودقة إحداثيات UTM. | Click Export Excel; open file to verify column headers and UTM precision. |
| **8** | **استيراد الإكسل مع معاينة** | ارفع ملف إكسل يحتوي نقاط مساحية، وافحص جدول المعاينة واكتشاف الأعمدة قبل الاعتماد. | Upload an Excel file with coordinates; inspect preview table before importing. |
| **9** | **قياس المسافات الجيوديسية** | شغل أداة القياس وانقر عدة نقاط لحساب المسافة التراكمية بالمتر والكيلومتر. | Toggle Measure distance tool, click points to compute total path distance in meters/km. |
| **10** | **إيماءات الموبايل & Bottom Sheet** | في الموبايل، اضغط مطولاً على الخريطة لفتح القائمة السريعة واسحب Bottom Sheet للأعلى والأسفل. | On mobile, long press map for context menu and swipe Bottom Sheet up/down. |
| **11** | **حماية الحقول من الاختصارات** | جرب الكتابة في حقل نصي واضغط `Ctrl+Z` أو `Delete`؛ تأكد من أن الاختصارات لا تؤثر على النقاط. | Type inside form text fields and press `Ctrl+Z` or `Delete`; ensure points are unaffected. |

---

## 📄 الترخيص (License)

تطبيق **المساح** مرخص بموجب ترخيص **MIT License** المفتوح المصدر.
