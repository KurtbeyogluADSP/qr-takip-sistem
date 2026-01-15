
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import AdminLayout from './layouts/AdminLayout';
import AssistantLayout from './layouts/AssistantLayout';
import KioskPage from './pages/KioskPage';
import LockedPage from './pages/LockedPage';
import AssistantScan from './pages/AssistantScan';

import AssistantTasks from './pages/AssistantTasks';

import Login from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';

import AdminReEntry from './pages/AdminReEntry';
import AdminUsers from './pages/AdminUsers';
import AdminAnalytics from './pages/AdminAnalytics';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public / Common */}
          <Route path="/login" element={<Login />} />

          {/* Kiosk Mode - Dedicated Layout/Page */}
          <Route path="/kiosk" element={<KioskPage />} />
          <Route path="/locked" element={<LockedPage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="re-entry" element={<AdminReEntry />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
          </Route>


          {/* Assistant Routes */}
          <Route path="/assistant" element={<AssistantLayout />}>
            <Route path="scan" element={<AssistantScan />} />
            <Route path="tasks" element={<AssistantTasks />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
