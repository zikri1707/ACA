import React from 'react';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Toast } from './components/Toast';

// Page Imports
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ConsultationWizard } from './pages/ConsultationWizard';
import { CoAIndex } from './pages/CoAIndex';
import { RuleBaseIndex } from './pages/RuleBaseIndex';
import { HistoryIndex } from './pages/HistoryIndex';
import { ReportsIndex } from './pages/ReportsIndex';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';

function AppContent() {
  const { currentPage, user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--background)'
      }}>
        <div className="spinner" />
      </div>
    );
  }

  // 1. Pages without layout (Landing, Login, Register)
  if (['landing', 'login', 'register'].includes(currentPage) || !user) {
    let pageContent;
    switch (currentPage) {
      case 'login':
        pageContent = <LoginPage />;
        break;
      case 'register':
        pageContent = <RegisterPage />;
        break;
      case 'landing':
      default:
        pageContent = <LandingPage />;
        break;
    }
    return (
      <>
        {pageContent}
        <Toast />
      </>
    );
  }

  // 2. Protected pages inside ERP dashboard layout
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'consultation':
        return <ConsultationWizard />;
      case 'coa':
        return <CoAIndex />;
      case 'rules':
        return <RuleBaseIndex />;
      case 'history':
        return <HistoryIndex />;
      case 'reports':
        return <ReportsIndex />;
      case 'profile':
        return <ProfilePage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Panel Content Area */}
      <main className="main-content">
        <Navbar />
        {renderCurrentPage()}
      </main>

      {/* Global Slide-In Toast Notification */}
      <Toast />
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;
