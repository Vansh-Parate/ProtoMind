import type React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PageShell } from './components/layout/PageShell';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DashboardPage } from './pages/DashboardPage';
import { CasesOverviewPage } from './pages/CasesOverviewPage';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { SarEditorPage } from './pages/SarEditorPage';
import { AuditTimelinePage } from './pages/AuditTimelinePage';

const App: React.FC = () => {
  return (
    <PageShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/cases" element={<CasesOverviewPage />} />
        <Route path="/cases/:id" element={<ErrorBoundary><CaseDetailPage /></ErrorBoundary>} />
        <Route path="/editor/:id" element={<ErrorBoundary><SarEditorPage /></ErrorBoundary>} />
        <Route path="/audit" element={<AuditTimelinePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PageShell>
  );
};

export default App;
