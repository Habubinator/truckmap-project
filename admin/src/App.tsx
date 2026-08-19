import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactElement } from 'react';
import { getAccessToken } from './lib/api';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { CompaniesPage } from './pages/CompaniesPage';
import { PointsPage } from './pages/PointsPage';
import { InstructionsPage } from './pages/InstructionsPage';
import { QuestionsPage } from './pages/QuestionsPage';
import { ReportsPage } from './pages/ReportsPage';
import { TariffsPage } from './pages/TariffsPage';
import { ChatsPage } from './pages/ChatsPage';

function Private({ children }: { children: ReactElement }) {
  if (!getAccessToken()) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <Private>
            <Layout />
          </Private>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="companies" element={<CompaniesPage />} />
        <Route path="points" element={<PointsPage />} />
        <Route path="instructions" element={<InstructionsPage />} />
        <Route path="questions" element={<QuestionsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="tariffs" element={<TariffsPage />} />
        <Route path="chats" element={<ChatsPage />} />
      </Route>
    </Routes>
  );
}
