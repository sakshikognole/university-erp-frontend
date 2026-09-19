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

// --- Department Management ---
import Departments from './pages/Departments';
import DepartmentForm from './pages/DepartmentForm';

// --- Student Management ---
import Students from './pages/Students';
import StudentForm from './pages/StudentForm';
import AddStudent from './pages/AddStudent';
import BulkUploadStudents from './pages/BulkUploadStudents';

// --- Staff Management ---
import Staff from './pages/Staff';
import StaffForm from './pages/StaffForm';
import AddStaff from './pages/AddStaff';

// --- Venue Management ---
import Venues from './pages/Venues';
import VenueForm from './pages/VenueForm';
import BulkUploadVenues from './pages/BulkUploadVenues';

// --- Events & Notices ---
import Events from './pages/Events';
import EventForm from './pages/EventForm';
import EventDetails from './pages/EventDetails';
import EventNotices from './pages/EventNotices';
import EventNoticeForm from './pages/EventNoticeForm';
import EventNoticeView from './pages/EventNoticeView';

// --- Payment Management ---
import FeePayment from './pages/FeePayment';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailure from './pages/PaymentFailure';
import PaymentPage from './pages/PaymentPage';

// --- Book Management ---
import BooksPage from './pages/BooksPage';

// --- Club Management ---
import ClubsPage from './pages/ClubsPage';

// --- Sports Management ---
import SportsPage from './pages/SportsPage';
import SportTeamsPage from './pages/SportTeamsPage';
import SportTeamPage from './pages/SportTeamPage';

// --- Venue Booking ---
import VenueBookingPage from './pages/VenueBookingPage';

// --- Exam Management ---
import ExamsPage from './pages/ExamsPage';
import ExamMarksPage from './pages/ExamMarksPage';

// --- Study Materials ---
import UploadMaterialsPage from './pages/UploadMaterialsPage';
import DisplayMaterialsPage from './pages/DisplayMaterialsPage';

// --- Hostel Management ---
import HostelPage from './pages/HostelPage';

// --- Student Certificate ---
import SelectStudent from './pages/SelectStudent';
import StudentDetails from './pages/StudentDetails';
import CertificatePreviewPage from './pages/CertificatePreviewPage';
import AddDocumentPage from './pages/AddDocumentPage';
import HandoutPage from './pages/HandoutPage';
import LetterHeadEditorPage from './pages/LetterHeadEditorPage';

// --- Transport Management ---
import Transport from './pages/Transport';
import AddBusRoute from './pages/AddBusRoute';
import AddDriver from './pages/AddDriver';
import AddVehicle from './pages/AddVehicle';
import AddBusPass from './pages/AddBusPass';

// --- Alumni Management ---
import Alumni from './pages/Alumni';
import AlumniForm from './pages/AlumniForm';
import BulkUploadAlumni from './pages/BulkUploadAlumni';
import AlumniJobs from './pages/AlumniJobs';
import AlumniJobForm from './pages/AlumniJobForm';

// --- System Announcements ---
import SystemAnnouncements from './pages/SystemAnnouncements';
import SystemAnnouncementForm from './pages/SystemAnnouncementForm';
import SystemAnnouncementView from './pages/SystemAnnouncementView';

// --- Password Management ---
import PasswordManagementPage from './pages/PasswordManagement/PasswordManagementPage';
import PmOtpPage from './pages/PasswordManagement/PmOtpPage';
import PmTestLogin from './pages/PasswordManagement/PmTestLogin';

import './index.css';

function AppRoutes() {
  return (
    <Routes>
      {/* ==================== PUBLIC AUTH ROUTES ==================== */}
      <Route path="/login" element={<Login />} />
      <Route path="/login/teacher" element={<Login />} />
      <Route path="/login/admin" element={<Login />} />
      <Route path="/login/student" element={<StudentLogin />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Password Management demo module — public and isolated */}
      <Route path="/password-management" element={<PasswordManagementPage />} />
      <Route path="/password-management/otp" element={<PmOtpPage />} />
      <Route path="/password-management/test-login" element={<PmTestLogin />} />

      {/* ==================== PROTECTED DASHBOARD SHELL ==================== */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* ==================== CORE ==================== */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="teacher/dashboard" element={<Dashboard />} />
        <Route path="teacher-dashboard" element={<Dashboard />} />
        <Route
          path="admin/dashboard"
          element={<Navigate to="/super-admin/dashboard" replace />}
        />

        {/* ==================== SUPER ADMIN ==================== */}
        <Route
          path="super-admin/dashboard"
          element={
            <SuperAdminRoute>
              <SuperAdminDashboard />
            </SuperAdminRoute>
          }
        />
        <Route
          path="users"
          element={
            <SuperAdminRoute>
              <Users />
            </SuperAdminRoute>
          }
        />

        {/* ==================== DEPARTMENTS ==================== */}
        <Route path="departments" element={<Departments />} />
        <Route
          path="departments/add"
          element={
            <SuperAdminRoute>
              <DepartmentForm />
            </SuperAdminRoute>
          }
        />
        <Route
          path="departments/edit/:id"
          element={
            <SuperAdminRoute>
              <DepartmentForm />
            </SuperAdminRoute>
          }
        />

        {/* ==================== STUDENTS ==================== */}
        <Route
          path="students"
          element={
            <SuperAdminRoute>
              <Students />
            </SuperAdminRoute>
          }
        />
        <Route
          path="students/add"
          element={
            <SuperAdminRoute>
              <StudentForm />
            </SuperAdminRoute>
          }
        />
        <Route
          path="students/edit/:id"
          element={
            <SuperAdminRoute>
              <StudentForm />
            </SuperAdminRoute>
          }
        />
        <Route
          path="add-student"
          element={
            <SuperAdminRoute>
              <StudentForm />
            </SuperAdminRoute>
          }
        />
        <Route
          path="bulk-upload-students"
          element={
            <SuperAdminRoute>
              <BulkUploadStudents />
            </SuperAdminRoute>
          }
        />

        {/* ==================== STAFF ==================== */}
        <Route
          path="staff"
          element={
            <SuperAdminRoute>
              <Staff />
            </SuperAdminRoute>
          }
        />
        <Route
          path="staff/add"
          element={
            <SuperAdminRoute>
              <StaffForm />
            </SuperAdminRoute>
          }
        />
        <Route
          path="staff/edit/:id"
          element={
            <SuperAdminRoute>
              <StaffForm />
            </SuperAdminRoute>
          }
        />
        <Route
          path="add-staff"
          element={
            <SuperAdminRoute>
              <StaffForm />
            </SuperAdminRoute>
          }
        />

        {/* ==================== VENUES ==================== */}
        <Route
          path="venues"
          element={
            <SuperAdminRoute>
              <Venues />
            </SuperAdminRoute>
          }
        />
        <Route
          path="venues/add"
          element={
            <SuperAdminRoute>
              <VenueForm />
            </SuperAdminRoute>
          }
        />
        <Route
          path="venues/edit/:id"
          element={
            <SuperAdminRoute>
              <VenueForm />
            </SuperAdminRoute>
          }
        />
        <Route
          path="bulk-upload-venues"
          element={
            <SuperAdminRoute>
              <BulkUploadVenues />
            </SuperAdminRoute>
          }
        />

        {/* ==================== BOOKS ==================== */}
        <Route path="books" element={<BooksPage />} />

        {/* ==================== CLUBS ==================== */}
        <Route
          path="clubs"
          element={
            <SuperAdminRoute>
              <ClubsPage />
            </SuperAdminRoute>
          }
        />

        {/* ==================== SPORTS ==================== */}
        <Route path="sports" element={<SportsPage />} />
        <Route path="sport-teams" element={<SportTeamsPage />} />
        <Route path="sport-team-v2" element={<SportTeamPage />} />

        {/* ==================== VENUE BOOKING ==================== */}
        <Route path="venue-booking" element={<VenueBookingPage />} />

        {/* ==================== EXAMS ==================== */}
        <Route path="exams" element={<ExamsPage />} />
        <Route path="exam-marks" element={<ExamMarksPage />} />

        {/* ==================== STUDY MATERIALS ==================== */}
        <Route path="upload-materials" element={<UploadMaterialsPage />} />
        <Route path="display-materials" element={<DisplayMaterialsPage />} />

        {/* ==================== EVENTS ==================== */}
        <Route
          path="events"
          element={
            <SuperAdminRoute>
              <Events />
            </SuperAdminRoute>
          }
        />
        <Route
          path="event-booking"
          element={
            <SuperAdminRoute>
              <Events />
            </SuperAdminRoute>
          }
        />
        <Route
          path="events/view/:id"
          element={
            <SuperAdminRoute>
              <EventDetails />
            </SuperAdminRoute>
          }
        />
        <Route
          path="event-booking/view/:id"
          element={
            <SuperAdminRoute>
              <EventDetails />
            </SuperAdminRoute>
          }
        />
        <Route
          path="events/add"
          element={
            <SuperAdminRoute>
              <EventForm />
            </SuperAdminRoute>
          }
        />
        <Route
          path="event-booking/add"
          element={
            <SuperAdminRoute>
              <EventForm />
            </SuperAdminRoute>
          }
        />
        <Route
          path="events/edit/:id"
          element={
            <SuperAdminRoute>
              <EventForm />
            </SuperAdminRoute>
          }
        />
        <Route
          path="event-booking/edit/:id"
          element={
            <SuperAdminRoute>
              <EventForm />
            </SuperAdminRoute>
          }
        />

        {/* ==================== EVENT NOTICES ==================== */}
        <Route
          path="event-notices"
          element={
            <SuperAdminRoute>
              <EventNotices />
            </SuperAdminRoute>
          }
        />
        <Route
          path="event-notices/add"
          element={
            <SuperAdminRoute>
              <EventNoticeForm />
            </SuperAdminRoute>
          }
        />
        <Route
          path="event-notices/edit/:id"
          element={
            <SuperAdminRoute>
              <EventNoticeForm />
            </SuperAdminRoute>
          }
        />
        <Route
          path="event-notices/view/:id"
          element={
            <SuperAdminRoute>
              <EventNoticeView />
            </SuperAdminRoute>
          }
        />

        {/* ==================== FEE PAYMENT ==================== */}
        <Route path="fee-payment" element={<FeePayment />} />
        <Route path="fee-payments" element={<FeePayment />} />
        <Route path="fee-payment/success" element={<PaymentSuccess />} />
        <Route path="fee-payment/failure" element={<PaymentFailure />} />
        <Route path="fee-payment/receipt/:id" element={<PaymentSuccess />} />

        {/* Payment Management — admin fee/combination management */}
        <Route
          path="payment-management"
          element={
            <SuperAdminRoute>
              <PaymentPage />
            </SuperAdminRoute>
          }
        />
        <Route path="payment" element={<PaymentPage />} />

        {/* ==================== HOSTEL ==================== */}
        <Route path="hostel" element={<HostelPage />} />

        {/* ==================== STUDENT CERTIFICATE ==================== */}
        <Route path="select-student" element={<SelectStudent />} />
        <Route path="student-details" element={<StudentDetails />} />
        <Route path="certificate-preview" element={<CertificatePreviewPage />} />
        <Route path="add-document" element={<AddDocumentPage />} />
        <Route path="handout" element={<HandoutPage />} />
        <Route path="letterhead" element={<LetterHeadEditorPage />} />

        {/* ==================== TRANSPORT ==================== */}
        <Route
          path="transport"
          element={
            <SuperAdminRoute>
              <Transport />
            </SuperAdminRoute>
          }
        />
        <Route
          path="transport/add-route"
          element={
            <SuperAdminRoute>
              <AddBusRoute />
            </SuperAdminRoute>
          }
        />
        <Route
          path="transport/edit-route/:id"
          element={
            <SuperAdminRoute>
              <AddBusRoute />
            </SuperAdminRoute>
          }
        />
        <Route
          path="transport/add-driver"
          element={
            <SuperAdminRoute>
              <AddDriver />
            </SuperAdminRoute>
          }
        />
        <Route
          path="transport/edit-driver/:id"
          element={
            <SuperAdminRoute>
              <AddDriver />
            </SuperAdminRoute>
          }
        />
        <Route
          path="transport/add-vehicle"
          element={
            <SuperAdminRoute>
              <AddVehicle />
            </SuperAdminRoute>
          }
        />
        <Route
          path="transport/edit-vehicle/:id"
          element={
            <SuperAdminRoute>
              <AddVehicle />
            </SuperAdminRoute>
          }
        />
        <Route
          path="transport/add-bus-pass"
          element={
            <SuperAdminRoute>
              <AddBusPass />
            </SuperAdminRoute>
          }
        />
        <Route
          path="transport/edit-bus-pass/:id"
          element={
            <SuperAdminRoute>
              <AddBusPass />
            </SuperAdminRoute>
          }
        />

        {/* ==================== ALUMNI ==================== */}
        <Route
          path="alumni"
          element={
            <SuperAdminRoute>
              <Alumni />
            </SuperAdminRoute>
          }
        />
        <Route
          path="alumni/add"
          element={
            <SuperAdminRoute>
              <AlumniForm />
            </SuperAdminRoute>
          }
        />
        <Route
          path="alumni/edit/:id"
          element={
            <SuperAdminRoute>
              <AlumniForm />
            </SuperAdminRoute>
          }
        />
        <Route
          path="alumni/bulk-upload"
          element={
            <SuperAdminRoute>
              <BulkUploadAlumni />
            </SuperAdminRoute>
          }
        />

        {/* ==================== ALUMNI JOBS ==================== */}
        <Route
          path="alumni-jobs"
          element={
            <SuperAdminRoute>
              <AlumniJobs />
            </SuperAdminRoute>
          }
        />
        <Route
          path="alumni-jobs/add"
          element={
            <SuperAdminRoute>
              <AlumniJobForm />
            </SuperAdminRoute>
          }
        />
        <Route
          path="alumni-jobs/edit/:id"
          element={
            <SuperAdminRoute>
              <AlumniJobForm />
            </SuperAdminRoute>
          }
        />

        {/* ==================== SYSTEM ANNOUNCEMENTS ==================== */}
        <Route path="system-announcements" element={<SystemAnnouncements />} />
        <Route
          path="system-announcements/view/:id"
          element={<SystemAnnouncementView />}
        />
        <Route
          path="system-announcements/add"
          element={<SystemAnnouncementForm />}
        />
        <Route
          path="system-announcements/edit/:id"
          element={<SystemAnnouncementForm />}
        />
      </Route>

      {/* Catch-all fallback */}
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
