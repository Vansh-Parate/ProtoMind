import type React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PageShell } from './components/layout/PageShell';
import { CasesOverviewPage } from './pages/CasesOverviewPage';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { SarEditorPage } from './pages/SarEditorPage';
import { AuditTimelinePage } from './pages/AuditTimelinePage';

const App: React.FC = () => {
  return (
    <PageShell>
      <Routes>
        <Route path="/" element={<CasesOverviewPage />} />
        <Route path="/cases/:id" element={<CaseDetailPage />} />
        <Route path="/editor/:id" element={<SarEditorPage />} />
        <Route path="/audit" element={<AuditTimelinePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PageShell>
  );
};

export default App;

