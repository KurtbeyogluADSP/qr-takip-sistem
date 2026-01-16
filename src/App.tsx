
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import AdminLayout from './layouts/AdminLayout';
import AssistantLayout from './layouts/AssistantLayout';

import LockedPage from './pages/LockedPage';
import AssistantScan from './pages/AssistantScan';
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
          {/* Giriş */}
          <Route path="/login" element={<Login />} />



          {/* Kilitli hesap sayfası */}
          <Route path="/locked" element={<LockedPage />} />

          {/* Admin Panel */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="re-entry" element={<AdminReEntry />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="analytics" element={<AdminAnalytics />} />
          </Route>

          {/* Çalışan Sayfaları */}
          <Route path="/assistant" element={<AssistantLayout />}>
            <Route path="scan" element={<AssistantScan />} />
          </Route>

          {/* Ana sayfa -> Login'e yönlendir */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
