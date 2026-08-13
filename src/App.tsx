import React from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MapContainer } from './components/MapContainer';
import { PointModal } from './components/PointModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { ExportExcelModal } from './components/ExportExcelModal';
import { ExportPreviewModal } from './components/ExportPreviewModal';
import { ImportOptionsModal } from './components/ImportOptionsModal';
import { ImportResultModal } from './components/ImportResultModal';
import { SettingsModal } from './components/SettingsModal';
import { CoordinateConverterModal } from './components/CoordinateConverterModal';
import { PointToPointMeasureModal } from './components/PointToPointMeasureModal';
import { LineStationingModal } from './components/LineStationingModal';
import { OnMapMeasureHUD } from './components/OnMapMeasureHUD';
import { DistanceMeasurePanel } from './components/DistanceMeasurePanel';
import { ToastContainer } from './components/ToastContainer';
import { MoveToast } from './components/MoveToast';
import { QuickMapPopover } from './components/QuickMapPopover';
import { ContextMenu } from './components/ContextMenu';
import { MobileBottomSheet } from './components/MobileBottomSheet';

import { AnnotationEditors } from './components/AnnotationEditors';

export default function App() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 selection:bg-emerald-500/30">
      {/* Top Navigation Header */}
      <Header />

      {/* Main App Workspace */}
      <div className="flex flex-1 relative overflow-hidden z-10">
        {/* Main Map Canvas Stage */}
        <main className="flex-1 h-full relative z-0 overflow-hidden">
          <MapContainer />
          <OnMapMeasureHUD />
          <AnnotationEditors />
          <DistanceMeasurePanel />
        </main>

        {/* Desktop Sidebar */}
        <Sidebar />
      </div>

      {/* Mobile Bottom Sheet Drawer */}
      <MobileBottomSheet />

      {/* Popovers, Context Menus & Toasts */}
      <QuickMapPopover />
      <ContextMenu />
      <ToastContainer />
      <MoveToast />

      {/* Global Dialog Modals */}
      <PointModal />
      <ExcelImportModal />
      <ExportExcelModal />
      <ExportPreviewModal />
      <ImportOptionsModal />
      <ImportResultModal />
      <SettingsModal />
      <CoordinateConverterModal />
      <PointToPointMeasureModal />
      <LineStationingModal />
    </div>
  );
}
