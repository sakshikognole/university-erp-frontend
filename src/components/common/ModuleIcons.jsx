import React from 'react';

const createIcon = (d) => {
  const IconComponent = ({ size = 20, className = 'nav-icon', ...props }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {d}
    </svg>
  );
  return IconComponent;
};

// 1. Superadmin Dashboard
export const SuperadminDashboardIcon = createIcon(
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="8" x2="21" y2="8" />
    <rect x="5.5" y="10.5" width="5.5" height="3.5" rx="0.5" />
    <rect x="13" y="10.5" width="5.5" height="3.5" rx="0.5" />
    <rect x="5.5" y="15.5" width="5.5" height="3.5" rx="0.5" />
    <rect x="13" y="15.5" width="5.5" height="3.5" rx="0.5" />
  </>
);

// 2. User Directory
export const UserDirectoryIcon = createIcon(
  <>
    <circle cx="12" cy="7" r="2.5" />
    <path d="M7.5 18a4.5 4.5 0 0 1 9 0" />
    <circle cx="6" cy="9.5" r="2.2" />
    <path d="M2 19a4 4 0 0 1 5.5-3.5" />
    <circle cx="18" cy="9.5" r="2.2" />
    <path d="M16.5 15.5A4 4 0 0 1 22 19" />
  </>
);

// 3. Students
export const StudentsIcon = createIcon(
  <>
    <polygon points="12 4 22 9 12 14 2 9 12 4" />
    <path d="M6 11.5v4c0 2 2.7 3.5 6 3.5s6-1.5 6-3.5v-4" />
    <line x1="20" y1="10" x2="20" y2="16" />
    <circle cx="20" cy="16.5" r="0.8" />
  </>
);

// 4. Staff
export const StaffIcon = createIcon(
  <>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 2h6v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V2z" />
    <circle cx="10" cy="10" r="2" />
    <path d="M7 15c0-1.7 1.3-3 3-3s3 1.3 3 3" />
    <line x1="14" y1="9" x2="17" y2="9" />
    <line x1="14" y1="12" x2="17" y2="12" />
  </>
);

// 5. Departments
export const DepartmentsIcon = createIcon(
  <>
    <line x1="3" y1="5" x2="21" y2="5" />
    <rect x="4" y="5" width="16" height="15" rx="1" />
    <rect x="6" y="8" width="2" height="2" />
    <rect x="9.5" y="8" width="2" height="2" />
    <rect x="13" y="8" width="2" height="2" />
    <rect x="16.5" y="8" width="2" height="2" />
    <rect x="6" y="13" width="2" height="2" />
    <rect x="9.5" y="13" width="2" height="2" />
    <rect x="13" y="13" width="2" height="2" />
    <rect x="16.5" y="13" width="2" height="2" />
  </>
);

// 6. Venues
export const VenuesIcon = createIcon(
  <>
    <polygon points="12 3 3 10 21 10" />
    <rect x="5" y="10" width="14" height="11" rx="0.5" />
    <rect x="7" y="12" width="2.5" height="2.5" />
    <rect x="14.5" y="12" width="2.5" height="2.5" />
    <path d="M10.5 21v-5h3v5" />
  </>
);

// 7. Books
export const BooksIcon = createIcon(
  <>
    <path d="M12 5c-2.5-1.5-6-1.5-8 0v13c2-1.5 5.5-1.5 8 0" />
    <path d="M12 5c2.5-1.5 6-1.5 8 0v13c-2-1.5-5.5-1.5-8 0" />
    <line x1="12" y1="5" x2="12" y2="18" />
    <line x1="7" y1="9" x2="7" y2="14" />
    <line x1="17" y1="9" x2="17" y2="14" />
  </>
);

// 8. Clubs
export const ClubsIcon = createIcon(
  <>
    <circle cx="12" cy="6" r="2.5" />
    <circle cx="7" cy="8" r="2.2" />
    <circle cx="17" cy="8" r="2.2" />
    <path d="M6 13l3.5 3 2.5-2 2.5 2 3.5-3" />
    <path d="M8 18l4 2 4-2" />
  </>
);

// 9. Sports
export const SportsIcon = createIcon(
  <>
    <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
    <path d="M7 6H4a2 2 0 0 0-2 2v1a3 3 0 0 0 3 3h2" />
    <path d="M17 6h3a2 2 0 0 1 2 2v1a3 3 0 0 1-3 3h-2" />
    <polygon points="12 6.5 12.8 8.2 14.6 8.4 13.2 9.7 13.6 11.5 12 10.6 10.4 11.5 10.8 9.7 9.4 8.4 11.2 8.2" />
    <line x1="12" y1="14" x2="12" y2="18" />
    <line x1="8" y1="18" x2="16" y2="18" />
    <line x1="7" y1="20" x2="17" y2="20" />
  </>
);

// 10. Sport Team
export const SportTeamIcon = createIcon(
  <>
    <path d="M9 3a3 3 0 0 0 6 0l4.5 3-2 3.5-2-1V20a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V8.5l-2 1-2-3.5L9 3z" />
    <line x1="12" y1="6" x2="12" y2="11" />
    <circle cx="12" cy="12.5" r="1.5" />
  </>
);

// 11. Venue Booking
export const VenueBookingIcon = createIcon(
  <>
    <line x1="8" y1="2" x2="8" y2="5" />
    <line x1="16" y1="2" x2="16" y2="5" />
    <rect x="4" y="4" width="16" height="17" rx="2" />
    <line x1="4" y1="8" x2="20" y2="8" />
    <rect x="6.5" y="11" width="2" height="2" />
    <rect x="11" y="11" width="2" height="2" />
    <rect x="15.5" y="11" width="2" height="2" />
    <rect x="6.5" y="15" width="2" height="2" />
    <rect x="11" y="15" width="2" height="2" />
    <rect x="15.5" y="15" width="2" height="2" />
  </>
);

// 12. Certificate
export const CertificateIcon = createIcon(
  <>
    <rect x="5" y="3" width="14" height="18" rx="1.5" />
    <rect x="7.5" y="5.5" width="9" height="6.5" rx="0.5" />
    <circle cx="12" cy="16" r="2.5" />
    <path d="M10.5 17.5l-1 3.5 2.5-1 2.5 1-1-3.5" />
  </>
);

// 13. Add Document
export const AddDocumentIcon = createIcon(
  <>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="8" x2="11" y2="8" />
    <line x1="8" y1="11" x2="16" y2="11" />
    <line x1="8" y1="14" x2="16" y2="14" />
    <line x1="8" y1="17" x2="16" y2="17" />
  </>
);

// 14. Handout
export const HandoutIcon = createIcon(
  <>
    <rect x="4" y="3" width="16" height="18" rx="1" />
    <line x1="7" y1="7" x2="17" y2="7" />
    <line x1="7" y1="10" x2="17" y2="10" />
    <line x1="7" y1="13" x2="17" y2="13" />
    <line x1="7" y1="16" x2="12" y2="16" />
    <rect x="14" y="14" width="4" height="4" />
  </>
);

// 15. Letterhead
export const LetterheadIcon = createIcon(
  <>
    <rect x="4" y="3" width="16" height="18" rx="1" />
    <rect x="6.5" y="5.5" width="4" height="4" />
    <line x1="12.5" y1="6.5" x2="17.5" y2="6.5" />
    <line x1="12.5" y1="8.5" x2="17.5" y2="8.5" />
    <line x1="6.5" y1="12.5" x2="17.5" y2="12.5" />
    <line x1="6.5" y1="15" x2="17.5" y2="15" />
    <line x1="6.5" y1="17.5" x2="17.5" y2="17.5" />
  </>
);

// 16. Upload Materials
export const UploadMaterialsIcon = createIcon(
  <>
    <path d="M4 14v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5" />
    <polygon points="12 4 6 11 10 11 10 16 14 16 14 11 18 11" />
  </>
);

// 17. Study Materials
export const StudyMaterialsIcon = createIcon(
  <>
    <path d="M12 5c-2.5-1.5-6-1.5-8 0v13c2-1.5 5.5-1.5 8 0" />
    <path d="M12 5c2.5-1.5 6-1.5 8 0v13c-2-1.5-5.5-1.5-8 0" />
    <line x1="12" y1="5" x2="12" y2="18" />
    <line x1="6" y1="9" x2="9" y2="9" />
    <line x1="6" y1="12" x2="9" y2="12" />
    <path d="M16 4v7l2-1.5 2 1.5V4" />
  </>
);

// 18. Payment Management
export const PaymentManagementIcon = createIcon(
  <>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <rect x="6" y="13" width="3.5" height="3" rx="0.5" />
    <line x1="12" y1="15" x2="18" y2="15" />
  </>
);

// 19. Hostel
export const HostelIcon = createIcon(
  <>
    <polygon points="12 3 3 11 21 11" />
    <rect x="4.5" y="11" width="15" height="10" rx="0.5" />
    <rect x="6.5" y="13" width="2" height="2" />
    <rect x="11" y="13" width="2" height="2" />
    <rect x="15.5" y="13" width="2" height="2" />
    <path d="M10.5 21v-3.5h3v3.5" />
  </>
);

// 20. Exams
export const ExamsIcon = createIcon(
  <>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <rect x="7" y="5.5" width="2" height="2" />
    <line x1="11" y1="6.5" x2="16.5" y2="6.5" />
    <rect x="7" y="9.5" width="2" height="2" />
    <line x1="11" y1="10.5" x2="16.5" y2="10.5" />
    <rect x="7" y="13.5" width="2" height="2" />
    <line x1="11" y1="14.5" x2="16.5" y2="14.5" />
    <rect x="7" y="17.5" width="2" height="2" />
    <line x1="11" y1="18.5" x2="16.5" y2="18.5" />
  </>
);

// 21. Subjects
export const SubjectsIcon = createIcon(
  <>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <circle cx="8" cy="7" r="1.5" />
    <line x1="12" y1="7" x2="16.5" y2="7" />
    <circle cx="8" cy="12" r="1.5" />
    <line x1="12" y1="12" x2="16.5" y2="12" />
    <circle cx="8" cy="17" r="1.5" />
    <line x1="12" y1="17" x2="16.5" y2="17" />
  </>
);

// 22. Schedule
export const ScheduleIcon = createIcon(
  <>
    <line x1="8" y1="2" x2="8" y2="5" />
    <line x1="16" y1="2" x2="16" y2="5" />
    <rect x="4" y="4" width="16" height="17" rx="2" />
    <line x1="4" y1="8" x2="20" y2="8" />
    <line x1="7" y1="11" x2="17" y2="11" />
    <line x1="7" y1="14" x2="17" y2="14" />
    <line x1="7" y1="17" x2="17" y2="17" />
  </>
);

// 23. Classrooms
export const ClassroomsIcon = createIcon(
  <>
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <line x1="6" y1="8" x2="14" y2="8" />
    <line x1="12" y1="16" x2="12" y2="20" />
    <line x1="8" y1="20" x2="16" y2="20" />
  </>
);

// 24. Transport
export const TransportIcon = createIcon(
  <>
    <rect x="4" y="4" width="16" height="13" rx="3" />
    <rect x="6" y="6" width="5" height="4" rx="0.5" />
    <rect x="13" y="6" width="5" height="4" rx="0.5" />
    <circle cx="7.5" cy="13.5" r="1.5" />
    <circle cx="16.5" cy="13.5" r="1.5" />
    <circle cx="7" cy="19" r="1.5" />
    <circle cx="17" cy="19" r="1.5" />
  </>
);

// 25. Fee Payment
export const FeePaymentIcon = createIcon(
  <>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="6" y1="14" x2="10" y2="14" />
    <line x1="6" y1="16.5" x2="10" y2="16.5" />
    <circle cx="15.5" cy="15" r="2.5" />
    <line x1="15.5" y1="13" x2="15.5" y2="17" />
    <line x1="13.5" y1="15" x2="17.5" y2="15" />
  </>
);

// 26. Event Notice
export const EventNoticeIcon = createIcon(
  <>
    <polygon points="5 8 13 4 13 18 5 14" />
    <rect x="3" y="9.5" width="2" height="3" rx="0.5" />
    <path d="M13 4c2-0.5 4-0.5 4 7s-2 7.5-4 7" />
    <path d="M9 14v4a1 1 0 0 1-1 1H7" />
  </>
);

// 27. Event Booking
export const EventBookingIcon = createIcon(
  <>
    <line x1="8" y1="2" x2="8" y2="5" />
    <line x1="16" y1="2" x2="16" y2="5" />
    <rect x="4" y="4" width="16" height="17" rx="2" />
    <line x1="4" y1="8" x2="20" y2="8" />
    <polygon points="12 10.5 13.2 13 16 13.3 14 15.2 14.5 18 12 16.5 9.5 18 10 15.2 8 13.3 10.8 13" />
  </>
);

// 28. Alumni Profiles
export const AlumniProfilesIcon = createIcon(
  <>
    <polygon points="12 4 21 8 12 12 3 8" />
    <path d="M6 9.5v3c0 1.5 2.7 2.5 6 2.5s6-1 6-2.5V9.5" />
    <path d="M21 8v4" />
    <line x1="12" y1="15" x2="12" y2="17" />
    <circle cx="12" cy="19.5" r="2.5" />
  </>
);

// 29. Alumni Jobs
export const AlumniJobsIcon = createIcon(
  <>
    <polygon points="12 4 21 8 12 12 3 8" />
    <path d="M6 9.5v3c0 1.5 2.7 2.5 6 2.5s6-1 6-2.5V9.5" />
    <path d="M21 8v4" />
    <line x1="12" y1="15" x2="12" y2="17.5" />
    <circle cx="12" cy="19.5" r="2" />
  </>
);

// 30. System Announcement
export const SystemAnnouncementIcon = createIcon(
  <>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <circle cx="12" cy="12" r="2.8" />
    <line x1="12" y1="6.5" x2="12" y2="8" />
    <line x1="12" y1="16" x2="12" y2="17.5" />
    <line x1="6.5" y1="12" x2="8" y2="12" />
    <line x1="16" y1="12" x2="17.5" y2="12" />
    <line x1="8" y1="8" x2="9.2" y2="9.2" />
    <line x1="14.8" y1="14.8" x2="16" y2="16" />
    <line x1="8" y1="16" x2="9.2" y2="14.8" />
    <line x1="14.8" y1="9.2" x2="16" y2="8" />
  </>
);

// 31. Attendance
export const AttendanceIcon = createIcon(
  <>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <line x1="4" y1="8" x2="20" y2="8" />
    <polygon points="7.5 15.5 14 13 8 11.5 9.5 13.5" />
    <line x1="14" y1="13" x2="17" y2="13" />
  </>
);

// 32. Email Communication
export const EmailCommunicationIcon = createIcon(
  <>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <polyline points="3 7 12 13 21 7" />
  </>
);

// 33. Announcement (same bullhorn)
export const AnnouncementIcon = EventNoticeIcon;

// 34. Academic Resource
export const AcademicResourceIcon = createIcon(
  <>
    <polygon points="12 3 21 7 12 11 3 7" />
    <path d="M6 8.5v3c0 1.5 2.7 2.5 6 2.5s6-1 6-2.5V8.5" />
    <path d="M21 7v4" />
    <rect x="7" y="15" width="10" height="6" rx="1" />
    <line x1="9.5" y1="18" x2="14.5" y2="18" />
  </>
);
