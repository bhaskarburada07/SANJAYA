import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { Header } from './components/common/Header';
import { Sidebar, NavScreen } from './components/common/Sidebar';
import { MobileNav } from './components/common/MobileNav';

// Pages
import { DashboardPage } from './components/dashboard/DashboardPage';
import { AIBrainPage } from './components/ai/AIBrainPage';
import { LiveCameraPage } from './components/live/LiveCameraPage';
import { PeoplePage } from './components/people/PeoplePage';
import { CamerasPage } from './components/cameras/CamerasPage';
import { IncidentsPage } from './components/incidents/IncidentsPage';
import { IncidentDetailPage } from './components/incidents/IncidentDetailPage';
import { EmergencyContactsPage } from './components/emergency/EmergencyContactsPage';
import { NotificationsPage } from './components/notifications/NotificationsPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { ProfilePage } from './components/profile/ProfilePage';
import { AuthPage } from './components/auth/AuthPage';

// Modals & Overlays
import { DetectionAlertModal } from './components/modals/DetectionAlertModal';
import { PersonDetailsModal } from './components/modals/PersonDetailsModal';
import { SosOverlay } from './components/sos/SosOverlay';
import { EscalationNoticeModal } from './components/sos/EscalationNoticeModal';
import { AIAssistantModal } from './components/ai/AIAssistantModal';
import { AwaySummaryModal } from './components/dashboard/AwaySummaryModal';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { 
    activeAlertModal, 
    setActiveAlertModal,
    activeKnownModal,
    setActiveKnownModal,
    selectedIncident,
    settings
  } = useData();

  const [currentScreen, setCurrentScreen] = useState<NavScreen>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center text-zinc-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" />
          <span className="text-xs font-medium tracking-wide">Starting SANJAYA System...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className={`min-h-screen bg-[#f8f9fa] text-zinc-900 flex flex-col ${settings.indoor_monitor_mode ? 'indoor-monitor-active' : ''}`}>
      {/* Top Header */}
      <Header 
        currentScreen={currentScreen} 
        onNavigate={setCurrentScreen} 
      />

      {/* Main layout body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar on desktop */}
        <Sidebar 
          currentScreen={currentScreen} 
          onNavigate={setCurrentScreen} 
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 max-w-7xl mx-auto w-full">
          {currentScreen === 'dashboard' && (
            <DashboardPage onNavigate={setCurrentScreen} />
          )}
          {currentScreen === 'ai-brain' && (
            <AIBrainPage onNavigate={setCurrentScreen} />
          )}
          {currentScreen === 'live' && (
            <LiveCameraPage />
          )}
          {currentScreen === 'people' && (
            <PeoplePage />
          )}
          {currentScreen === 'cameras' && (
            <CamerasPage onNavigate={setCurrentScreen} />
          )}
          {currentScreen === 'incidents' && (
            <IncidentsPage onNavigate={setCurrentScreen} />
          )}
          {currentScreen === 'incident-detail' && (
            <IncidentDetailPage 
              incident={selectedIncident} 
              onBack={() => setCurrentScreen('incidents')}
              onNavigate={setCurrentScreen}
            />
          )}
          {currentScreen === 'emergency' && (
            <EmergencyContactsPage />
          )}
          {currentScreen === 'notifications' && (
            <NotificationsPage />
          )}
          {currentScreen === 'settings' && (
            <SettingsPage />
          )}
          {currentScreen === 'profile' && (
            <ProfilePage />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav 
        currentScreen={currentScreen} 
        onNavigate={setCurrentScreen} 
      />

      {/* Detection Alert Modal for Unknown Visitors */}
      {activeAlertModal && (
        <DetectionAlertModal
          detection={activeAlertModal}
          onClose={() => setActiveAlertModal(null)}
          onViewLive={() => {
            setCurrentScreen('live');
            setActiveAlertModal(null);
          }}
          onTalk={() => {
            setCurrentScreen('live');
            setActiveAlertModal(null);
          }}
        />
      )}

      {/* Known Person Arrival Modal */}
      {activeKnownModal && (
        <PersonDetailsModal
          detection={activeKnownModal}
          onClose={() => setActiveKnownModal(null)}
          onViewPeople={() => {
            setCurrentScreen('people');
            setActiveKnownModal(null);
          }}
        />
      )}

      {/* High-priority 30s SOS Countdown Screen */}
      <SosOverlay />

      {/* Escalation Notice Modal */}
      <EscalationNoticeModal />

      {/* AI Security Assistant Investigator */}
      <AIAssistantModal 
        onNavigateIncident={() => setCurrentScreen('incident-detail')} 
      />

      {/* Away Mode Security Summary upon return */}
      <AwaySummaryModal />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}
