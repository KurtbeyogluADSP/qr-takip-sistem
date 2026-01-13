
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import AdminLayout from './layouts/AdminLayout';
import AssistantLayout from './layouts/AssistantLayout';
import KioskPage from './pages/KioskPage';
import AssistantScan from './pages/AssistantScan';

import AssistantTasks from './pages/AssistantTasks';

// Placeholders for now
const Login = () => <div className="p-10 text-center">Login Page (Coming Soon)</div>;
const AdminDashboard = () => <div className="p-10">Admin Dashboard (Coming Soon)</div>;

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public / Common */}
          <Route path="/login" element={<Login />} />

          {/* Kiosk Mode - Dedicated Layout/Page */}
          <Route path="/kiosk" element={<KioskPage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
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
