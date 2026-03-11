import { Routes, Route, Navigate } from 'react-router';
import { AppShell } from './components/layout/AppShell';
import { EmployeesPage } from './pages/EmployeesPage';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

export default function App() {
  return (
    <AppShell>
      <ErrorBoundary fallbackMessage="An unexpected application error occurred.">
        <Routes>
          <Route path="/" element={<Navigate to="/employees" replace />} />
          <Route path="/employees" element={<EmployeesPage />} />
        </Routes>
      </ErrorBoundary>
    </AppShell>
  );
}
