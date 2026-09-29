import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Navigation, DesktopTabBar } from './components/Navigation';
import { ClubTab } from './components/ClubTab';
import { AdminTab } from './components/AdminTab';
import { AthletesTab } from './components/AthletesTab';
import { CoachesTab } from './components/CoachesTab';
import { TrainingPlansTab } from './components/TrainingPlansTab';
import { CalendarTab } from './components/CalendarTab';
import { ResultsTab } from './components/ResultsTab';
import { NotificationsTab } from './components/NotificationsTab';
import { ParentsAreaTab } from './components/ParentsAreaTab';
import { GuardiansTab } from './components/GuardiansTab';
import { PermissionsModal } from './components/PermissionsModal';
import { PdfViewerModal } from './components/PdfViewerModal';
import { AuthScreen } from './components/AuthScreen';
import { PendingApprovalScreen } from './components/PendingApprovalScreen';
import { RejectedAccountScreen } from './components/RejectedAccountScreen';
import { PendingApprovalsModal } from './components/PendingApprovalsModal';
import { SupabaseModal } from './components/SupabaseModal';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    activeTab,
    isAuthenticated,
    isCurrentUserAdmin,
    currentUser,
    isApprovalsModalOpen,
    setIsApprovalsModalOpen,
    isSupabaseModalOpen,
    setIsSupabaseModalOpen,
    toast
  } = useApp();

  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Permissions Modal state
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);

  // PDF Viewer Modal state
  const [pdfModalData, setPdfModalData] = useState<{
    isOpen: boolean;
    title: string;
    pdfUrl: string;
  }>({
    isOpen: false,
    title: '',
    pdfUrl: ''
  });

  const handleOpenPdf = (title: string, url: string) => {
    setPdfModalData({
      isOpen: true,
      title,
      pdfUrl: url
    });
  };

  const handleClosePdf = () => {
    setPdfModalData((prev) => ({ ...prev, isOpen: false }));
  };

  // 1. If not authenticated, render Auth screen (login / register)
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // 2. If authenticated, check status
  if (currentUser.status === 'pendente_aprovacao') {
    return <PendingApprovalScreen />;
  }

  if (currentUser.status === 'rejeitado') {
    return <RejectedAccountScreen />;
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'administrador':
        return isCurrentUserAdmin ? <AdminTab /> : <ClubTab onOpenPdf={handleOpenPdf} />;
      case 'clube':
        return <ClubTab onOpenPdf={handleOpenPdf} />;
      case 'atletas':
        return <AthletesTab />;
      case 'treinadores':
        return <CoachesTab onOpenPdf={handleOpenPdf} />;
      case 'planos_treino':
      case 'planos':
        return <TrainingPlansTab />;
      case 'calendario':
        return <CalendarTab onOpenPdf={handleOpenPdf} />;
      case 'resultados':
        return <ResultsTab onOpenPdf={handleOpenPdf} />;
      case 'notificacoes':
        return <NotificationsTab />;
      case 'encarregados':
        return <GuardiansTab onOpenPdf={handleOpenPdf} />;
      case 'pais':
        return <ParentsAreaTab onOpenPdf={handleOpenPdf} />;
      default:
        return <ClubTab onOpenPdf={handleOpenPdf} />;
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#F8FAFC] font-sans text-slate-800 antialiased selection:bg-blue-500 selection:text-white">
      {/* Sleek Dark Navy Sidebar (Desktop & Mobile Drawer) */}
      <Sidebar
        onOpenPermissions={() => setIsPermissionsOpen(true)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          onOpenPermissions={() => setIsPermissionsOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Tab & Page Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-28 lg:pb-8 max-w-7xl w-full mx-auto">
          {/* Horizontal Tab Bar for Tablet View */}
          <div className="hidden md:block lg:hidden mb-6">
            <DesktopTabBar />
          </div>
          {renderActiveTab()}
        </main>
      </div>

      {/* Mobile Bottom Navigation (for fast thumb access on phones) */}
      <Navigation />

      {/* Role Permissions Matrix Modal */}
      <PermissionsModal
        isOpen={isPermissionsOpen}
        onClose={() => setIsPermissionsOpen(false)}
      />

      {/* Coach Pending Approvals Management Modal */}
      <PendingApprovalsModal
        isOpen={isApprovalsModalOpen}
        onClose={() => setIsApprovalsModalOpen(false)}
      />

      {/* Supabase Database Connection & Sync Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

      {/* Official PDF Document Viewer Modal */}
      <PdfViewerModal
        isOpen={pdfModalData.isOpen}
        onClose={handleClosePdf}
        title={pdfModalData.title}
        pdfUrl={pdfModalData.pdfUrl}
      />

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-bold ${
              toast.type === 'error'
                ? 'bg-red-600 text-white border-red-700'
                : toast.type === 'info'
                ? 'bg-slate-900 text-amber-400 border-slate-800'
                : 'bg-emerald-600 text-white border-emerald-700'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : toast.type === 'info' ? (
              <Info className="w-4 h-4 shrink-0 text-amber-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
