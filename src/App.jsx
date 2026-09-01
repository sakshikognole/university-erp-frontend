import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/routes/ProtectedRoute';
import SuperAdminRoute from './components/routes/SuperAdminRoute';
import DashboardLayout from './components/layout/DashboardLayout';

// --- Auth Pages ---
import Login from './pages/Login';
import StudentLogin from './pages/StudentLogin';
import ForgotPassword from './pages/ForgotPassword';

// --- Core Dashboard ---
import Dashboard from './pages/Dashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import Users from './pages/Users';

// --- Department Management (friend's feature) ---
import Departments from './pages/Departments';
import DepartmentForm from './pages/DepartmentForm';

// --- Student Management (friend's feature) ---
import Students from './pages/Students';
import StudentForm from './pages/StudentForm';
import AddStudent from './pages/AddStudent';
import BulkUploadStudents from './pages/BulkUploadStudents';

// --- Staff Management (friend's feature) ---
import Staff from './pages/Staff';
import StaffForm from './pages/StaffForm';
import AddStaff from './pages/AddStaff';

// --- Venue Management (friend's feature) ---
import Venues from './pages/Venues';
import VenueForm from './pages/VenueForm';
import BulkUploadVenues from './pages/BulkUploadVenues';

// --- Book Management (your feature) ---
import BooksPage from './pages/BooksPage';

// --- Club Management (your feature) ---
import ClubsPage from './pages/ClubsPage';

// --- Sport Management (your feature) ---
import SportsPage from './pages/SportsPage';

// --- Sport Team Management (your feature) ---
import SportTeamsPage from './pages/SportTeamsPage';
import SportTeamPage  from './pages/SportTeamPage';

// --- Venue Booking (your feature) ---
import VenueBookingPage from './pages/VenueBookingPage';

// --- Study Materials (your feature) ---
import UploadMaterialsPage  from './pages/UploadMaterialsPage';
import DisplayMaterialsPage from './pages/DisplayMaterialsPage';

// --- Payment Management (your feature) ---
import PaymentPage from './pages/PaymentPage';

// --- Hostel Management (your feature) ---
import HostelPage from './pages/HostelPage';

// --- Student Certificate (your feature) ---
import SelectStudent from './pages/SelectStudent';
import StudentDetails from './pages/StudentDetails';
import CertificatePreviewPage from './pages/CertificatePreviewPage';
import AddDocumentPage from './pages/AddDocumentPage';
import HandoutPage from './pages/HandoutPage';
import LetterHeadEditorPage from './pages/LetterHeadEditorPage';

import './index.css';

function AppRoutes() {
  return (
    <Routes>
      {/* ── Public Auth Routes ── */}
      <Route path="/login"            element={<Login />} />
      <Route path="/login/student"    element={<StudentLogin />} />
      <Route path="/forgot-password"  element={<ForgotPassword />} />

      {/* ── Protected Dashboard Shell ── */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* Core */}
        <Route path="dashboard" element={<Dashboard />} />

        {/* Super-Admin only pages */}
        <Route path="super-admin/dashboard" element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>} />
        <Route path="users"                 element={<SuperAdminRoute><Users /></SuperAdminRoute>} />

        {/* Departments */}
        <Route path="departments"            element={<Departments />} />
        <Route path="departments/add"        element={<SuperAdminRoute><DepartmentForm /></SuperAdminRoute>} />
        <Route path="departments/edit/:id"   element={<SuperAdminRoute><DepartmentForm /></SuperAdminRoute>} />

        {/* Students */}
        <Route path="students"               element={<SuperAdminRoute><Students /></SuperAdminRoute>} />
        <Route path="students/add"           element={<SuperAdminRoute><StudentForm /></SuperAdminRoute>} />
        <Route path="students/edit/:id"      element={<SuperAdminRoute><StudentForm /></SuperAdminRoute>} />
        <Route path="add-student"            element={<SuperAdminRoute><StudentForm /></SuperAdminRoute>} />
        <Route path="bulk-upload-students"   element={<SuperAdminRoute><BulkUploadStudents /></SuperAdminRoute>} />

        {/* Staff */}
        <Route path="staff"                  element={<SuperAdminRoute><Staff /></SuperAdminRoute>} />
        <Route path="staff/add"              element={<SuperAdminRoute><StaffForm /></SuperAdminRoute>} />
        <Route path="staff/edit/:id"         element={<SuperAdminRoute><StaffForm /></SuperAdminRoute>} />
        <Route path="add-staff"              element={<SuperAdminRoute><StaffForm /></SuperAdminRoute>} />

        {/* Venues */}
        <Route path="venues"                 element={<SuperAdminRoute><Venues /></SuperAdminRoute>} />
        <Route path="venues/add"             element={<SuperAdminRoute><VenueForm /></SuperAdminRoute>} />
        <Route path="venues/edit/:id"        element={<SuperAdminRoute><VenueForm /></SuperAdminRoute>} />
        <Route path="bulk-upload-venues"     element={<SuperAdminRoute><BulkUploadVenues /></SuperAdminRoute>} />

        {/* ── YOUR FEATURES ── */}

        {/* Book Management */}
        <Route path="books" element={<BooksPage />} />

        {/* Club Management */}
        <Route path="clubs" element={<ClubsPage />} />

        {/* Sport Management */}
        <Route path="sports"       element={<SportsPage />} />
        <Route path="sport-teams"  element={<SportTeamsPage />} />
        <Route path="sport-team-v2" element={<SportTeamPage />} />

        {/* Venue Booking */}
        <Route path="venue-booking" element={<VenueBookingPage />} />

        {/* Study Materials */}
        <Route path="upload-materials"  element={<UploadMaterialsPage />} />
        <Route path="display-materials" element={<DisplayMaterialsPage />} />

        {/* Payment Management */}
        <Route path="payment" element={<PaymentPage />} />

        {/* Hostel Management */}
        <Route path="hostel" element={<HostelPage />} />

        {/* Student Certificate */}
        <Route path="select-student"      element={<SelectStudent />} />
        <Route path="student-details"     element={<StudentDetails />} />
        <Route path="certificate-preview" element={<CertificatePreviewPage />} />
        <Route path="add-document"        element={<AddDocumentPage />} />
        <Route path="handout"             element={<HandoutPage />} />
        <Route path="letterhead"          element={<LetterHeadEditorPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
