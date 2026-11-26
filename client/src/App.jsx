import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import RequireAuth from './components/RequireAuth';
import ResidentLayout from './layouts/ResidentLayout';
import StaffLayout from './layouts/StaffLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import ResidentHome from './pages/ResidentHome';
import Placeholder from './pages/Placeholder';
import ReportIncident from './pages/ReportIncident';
import ResidentIncident from './pages/ResidentIncident';
import ResidentServices from './pages/ResidentServices';
import ResidentProfile from './pages/ResidentProfile';
import StaffDashboard from './pages/StaffDashboard';
import StaffUsers from './pages/StaffUsers';
import StaffMonitoring from './pages/StaffMonitoring';
import StaffProfile from './pages/StaffProfile';
import MdrrmcReports from './pages/MdrrmcReports';
import StaffReports from './pages/StaffReports';
import StaffReportDetail from './pages/StaffReportDetail';
import StaffDispatch from './pages/StaffDispatch';
import ResponderHome from './pages/ResponderHome';
import ResponderFunctions from './pages/ResponderFunctions';
import Notifications from './pages/Notifications';

// "Reports" means report management for barangay staff,
// generated reports for MDRRMC.
function ReportsEntry() {
  const { user } = useAuth();
  return user.role === 5 ? <MdrrmcReports /> : <StaffReports />;
}

// Responders get their own dashboard; captain, officials and MDRRMC share the summary dashboard.
function DashboardEntry() {
  const { user } = useAuth();
  return user.role === 4 ? <ResponderHome /> : <StaffDashboard />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/resident/login" replace />} />
          <Route path="/resident/login" element={<Login portal="resident" />} />
          <Route path="/resident/register" element={<Register />} />
          <Route path="/staff/login" element={<Login portal="staff" />} />

          <Route path="/resident" element={<RequireAuth roles={[1]}><ResidentLayout /></RequireAuth>}>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<ResidentHome />} />
            <Route path="report" element={<ReportIncident />} />
            <Route path="incident/:id" element={<ResidentIncident />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="services" element={<ResidentServices />} />
            <Route path="profile" element={<ResidentProfile />} />
          </Route>

          <Route path="/staff" element={<RequireAuth roles={[2, 3, 4, 5]}><StaffLayout /></RequireAuth>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardEntry />} />
            <Route path="reports" element={<ReportsEntry />} />
            <Route path="reports/:id" element={<StaffReportDetail />} />
            <Route path="users" element={<RequireAuth roles={[2]}><StaffUsers /></RequireAuth>} />
            <Route path="monitoring" element={<RequireAuth roles={[2, 3, 5]}><StaffMonitoring /></RequireAuth>} />
            <Route path="dispatch" element={<StaffDispatch />} />
            <Route path="functions" element={<RequireAuth roles={[4]}><ResponderFunctions /></RequireAuth>} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<StaffProfile />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}