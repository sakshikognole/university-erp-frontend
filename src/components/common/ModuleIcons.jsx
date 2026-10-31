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
    <rect x="2.8" y="2.2" width="7.4" height="8.6" rx="2.8" strokeWidth="2.2" />
    <rect x="13.8" y="2.2" width="7.4" height="8.6" rx="2.8" strokeWidth="2.2" />
    <rect x="2.8" y="13.2" width="7.4" height="8.6" rx="2.8" strokeWidth="2.2" />
    <rect x="13.8" y="13.2" width="7.4" height="8.6" rx="2.8" strokeWidth="2.2" />
  </>
);
export const DashboardIcon = SuperadminDashboardIcon;

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
export const StaffIcon = ({ size = 20, className = 'nav-icon', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Right Person */}
    <circle cx="16.2" cy="5" r="2.6" />
    <path d="M11.6 12.8c.8-2.6 2.5-4 4.6-4.1 2.5.1 4.5 1.7 5.2 4.4v6.6a1.4 1.4 0 0 1-1.4 1.4h-7.6a1.4 1.4 0 0 1-1.4-1.4v-3" />
    <path d="M14.2 9.5l1 2.3 1.2-1.6" />
    <path d="M18.2 9.5l-1 2.3-1.2-1.6" />
    <path d="M15.8 11.5h1l-.2 1h-.6z" />
    <path d="M16 12.4l-.5 4.8 1 1.6 1-1.6-.5-4.8" />
    <line x1="13.2" y1="13.8" x2="13.2" y2="19.2" />
    <line x1="19.4" y1="13.8" x2="19.4" y2="19.2" />

    {/* Left Person */}
    <circle cx="7.6" cy="6.2" r="2.5" />
    <path d="M2.5 19.8v-5.8c.6-2.5 2.4-4 4.8-4.2 2.4.2 4.2 1.7 4.8 4.2v5.8a1.4 1.4 0 0 1-1.4 1.4H3.9a1.4 1.4 0 0 1-1.4-1.4z" />
    <path d="M5.6 10.6l1 2.2 1.2-1.5" />
    <path d="M9.6 10.6l-1 2.2-1.2-1.5" />
    <path d="M7.2 12.5h1l-.2 1h-.6z" />
    <path d="M7.4 13.4l-.5 4.5 1 1.5 1-1.5-.5-4.5" />
    <line x1="4.3" y1="14.6" x2="4.3" y2="19.6" />
    <line x1="10.1" y1="14.6" x2="10.1" y2="19.6" />
  </svg>
);

// 5. Departments
export const DepartmentsIcon = ({ size = 20, className = 'nav-icon', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Roof */}
    <path d="M4.5 7.2L12 1.8l7.5 5.4" strokeWidth="1.5" />
    {/* Building walls with open bottom base */}
    <path d="M6.5 6.8v8.7h2.3m6.4 0h2.3V6.8" />
    {/* Round window */}
    <circle cx="12" cy="5.8" r="1.1" />
    {/* Classical Entrance Portico */}
    <rect x="9.5" y="8.2" width="5" height="1.4" rx="0.3" />
    <line x1="10.8" y1="9.6" x2="10.8" y2="12.4" />
    <line x1="13.2" y1="9.6" x2="13.2" y2="12.4" />
    <rect x="9.8" y="12.4" width="4.4" height="1.2" rx="0.2" />
    <rect x="8.8" y="13.6" width="6.4" height="1.2" rx="0.2" />
    {/* Side notches */}
    <path d="M6.5 10.5h1.2v1.4H6.5" />
    <path d="M17.5 10.5h-1.2v1.4h1.2" />
    {/* Branching hierarchy lines */}
    <path d="M12 15v2.5" />
    <path d="M3.8 19.5v-1.2a1 1 0 0 1 1-1h14.4a1 1 0 0 1 1 1v1.2" />
    <path d="M12 17.5v2" />
    {/* Three Department Node Boxes */}
    <rect x="1.5" y="19.5" width="4.6" height="3.2" rx="0.8" />
    <rect x="9.7" y="19.5" width="4.6" height="3.2" rx="0.8" />
    <rect x="17.9" y="19.5" width="4.6" height="3.2" rx="0.8" />
  </svg>
);

// 6. Venues
export const VenuesIcon = createIcon(
  <>
    <path d="M6.5 16C6.5 19.5 9.5 21 12 21s5.5-1.5 5.5-5" />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      fill="currentColor"
      stroke="none"
      d="M12 18.5C12 18.5 5.8 12.8 5.8 7.8a6.2 6.2 0 1 1 12.4 0c0 5-6.2 10.7-6.2 10.7zM12 11a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zm0-2a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4z"
    />
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
export const SportTeamIcon = ({ size = 20, className = 'nav-icon', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Trophy Cup */}
    <path d="M10 2.2h4v1.8c0 1.2-.9 2.2-2 2.2s-2-1-2-2.2v-1.8z" />
    <path d="M10 2.8H9c-.8 0-1.5.6-1.5 1.3s.7 1.3 1.5 1.3h1" />
    <path d="M14 2.8h1c.8 0 1.5.6 1.5 1.3s-.7 1.3-1.5 1.3h-1" />
    <path d="M8.2 5.5l-.7 1.5" />
    <path d="M15.8 5.5l.7 1.5" />
    <line x1="12" y1="6.2" x2="12" y2="7.2" />
    <rect x="10.8" y="7.2" width="2.4" height="1.4" rx="0.2" />
    <line x1="9.5" y1="8.6" x2="14.5" y2="8.6" />

    {/* Team Members Heads */}
    <circle cx="4" cy="13" r="2.2" />
    <path d="M3.2 11.6c.6.8 1.4 1.4 2.4 1.4" />
    <circle cx="12" cy="13" r="2.2" />
    <path d="M10.4 13c1-.6 2.2-.6 3.2 0" />
    <circle cx="20" cy="13" r="2.2" />
    <path d="M18.2 11.2c.6.4 1.4.4 2.2-.2" />

    {/* Team Members Torsos */}
    <rect x="1.8" y="17.5" width="4.4" height="5" rx="0.3" />
    <rect x="9.8" y="17.5" width="4.4" height="5" rx="0.3" />
    <rect x="17.8" y="17.5" width="4.4" height="5" rx="0.3" />

    {/* High-five Raised Arms */}
    <path d="M6.2 17.5l1.3-4.5v-2.5a.5.5 0 0 1 1 0v2.5l1.3 4.5" />
    <path d="M14.2 17.5l1.3-4.5v-2.5a.5.5 0 0 1 1 0v2.5l1.3 4.5" />
  </svg>
);

// 11. Venue Booking
export const VenueBookingIcon = createIcon(
  <>
    <rect x="6" y="1.5" width="2" height="3.5" rx="1" />
    <rect x="11" y="1.5" width="2" height="3.5" rx="1" />
    <rect x="16" y="1.5" width="2" height="3.5" rx="1" />
    <rect x="3" y="4" width="18" height="17" rx="2.5" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <rect x="5.5" y="11" width="3" height="3" rx="0.6" />
    <rect x="10.5" y="11" width="3" height="3" rx="0.6" />
    <rect x="15.5" y="11" width="3" height="3" rx="0.6" />
    <rect x="5.5" y="16" width="3" height="3" rx="0.6" />
    <path d="M10.2 17.2l1.6 2 2.6-3.4" />
    <rect x="15.5" y="16" width="3" height="3" rx="0.6" />
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
    {/* Back book */}
    <path d="M5 7.5A2 2 0 0 0 3 9.5V19a2 2 0 0 0 2 2h14" />
    <line x1="5.5" y1="18.5" x2="19" y2="18.5" />
    {/* Front book pages */}
    <line x1="7" y1="16.5" x2="19" y2="16.5" />
    {/* Front book spine */}
    <path d="M18.5 3.5H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2" />
    {/* Front book cover */}
    <path d="M7.5 3.5v10a1.5 1.5 0 0 0 1.5 1.5H19V5a1.5 1.5 0 0 0-1.5-1.5z" />
    {/* Front cover text lines */}
    <line x1="10.5" y1="7" x2="16.5" y2="7" />
    <line x1="10.5" y1="9" x2="16.5" y2="9" />
    <line x1="10.5" y1="11" x2="13.5" y2="11" />
    <line x1="16.5" y1="13" x2="19" y2="13" />
    <line x1="17.5" y1="14.5" x2="19" y2="14.5" />
  </>
);

// 22. Schedule
export const ScheduleIcon = ({ size = 20, className = 'nav-icon', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Calendar border */}
    <path d="M12.6 20H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1.2" />
    <line x1="6.8" y1="4" x2="13.2" y2="4" />
    <path d="M14.8 4H18a2 2 0 0 1 2 2v5.3" />

    {/* Binder loops */}
    <rect x="5.2" y="1.8" width="1.6" height="4" rx="0.8" fill="currentColor" stroke="none" />
    <rect x="13.2" y="1.8" width="1.6" height="4" rx="0.8" fill="currentColor" stroke="none" />

    {/* Header line */}
    <line x1="2" y1="8.5" x2="19.8" y2="8.5" />

    {/* Date pill dashes (2 cols x 3 rows + 1 extra in row 1) */}
    <line x1="4.5" y1="11.5" x2="6.8" y2="11.5" strokeWidth="1.8" />
    <line x1="8.8" y1="11.5" x2="11.1" y2="11.5" strokeWidth="1.8" />
    <line x1="13.1" y1="11.5" x2="15.4" y2="11.5" strokeWidth="1.8" />

    <line x1="4.5" y1="14.8" x2="6.8" y2="14.8" strokeWidth="1.8" />
    <line x1="8.8" y1="14.8" x2="11.1" y2="14.8" strokeWidth="1.8" />

    <line x1="4.5" y1="18" x2="6.8" y2="18" strokeWidth="1.8" />
    <line x1="8.8" y1="18" x2="11.1" y2="18" strokeWidth="1.8" />

    {/* Clock */}
    <circle cx="17" cy="16.5" r="5.2" />
    <path d="M17 13.5v3l2 1.5" />
  </svg>
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
export const TransportIcon = ({ size = 20, className = 'nav-icon', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Container / Cargo Box */}
    <path d="M16.5 4.5H3.5a1 1 0 0 0-1 1v8.5" />
    <path d="M16.5 4.5v9.5" />

    {/* Big Checkmark */}
    <path d="M7.2 11.2l2.2 2.6 4-4.8" strokeWidth="1.6" />

    {/* Speed Lines on left */}
    <line x1="1.5" y1="15.2" x2="6.5" y2="15.2" />
    <line x1="0.8" y1="17.4" x2="4.8" y2="17.4" />

    {/* Rear underbody bumper */}
    <path d="M2.2 17.4v2.2h2.6" />

    {/* Cab Roof & Windshield */}
    <path d="M16.5 6.8h3.2a1.8 1.8 0 0 1 1.7 1.2l1.1 4.5H16.5" />
    <path d="M17 8.8h2.6a1 1 0 0 1 .9.7l.7 2.8H17" />

    {/* Cab Front, Headlight & Bumper */}
    <path d="M22.5 12.5h.4a1.2 1.2 0 0 1 1.2 1.2v.3a1 1 0 0 0-.9 1 1 1 0 0 0 .9 1v.5a1.2 1.2 0 0 1-1.2 1.2H21.5" />
    <line x1="16.5" y1="14.8" x2="16.5" y2="19.2" />

    {/* Chassis middle bar */}
    <line x1="9.8" y1="17.4" x2="15.5" y2="17.4" />

    {/* Rear Wheel */}
    <circle cx="7.2" cy="19.5" r="2.2" />
    <circle cx="7.2" cy="19.5" r="0.8" fill="currentColor" stroke="none" />

    {/* Front Wheel */}
    <circle cx="19.4" cy="19.5" r="2.2" />
    <circle cx="19.4" cy="19.5" r="0.8" fill="currentColor" stroke="none" />
  </svg>
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

// 26. Event Notice (Notice paper with NOTICE text held by hand)
export const EventNoticeIcon = ({ size = 20, className = 'nav-icon', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Notice Paper */}
    <rect x="15" y="4" width="41" height="38" rx="2" strokeWidth="3.4" />
    <text
      x="35.5"
      y="17"
      textAnchor="middle"
      fontSize="10"
      fontWeight="900"
      fontFamily="'Arial Black', Arial, Impact, sans-serif"
      letterSpacing="0.5"
      fill="currentColor"
      stroke="none"
    >
      NOTICE
    </text>
    {/* 3 Horizontal Lines */}
    <line x1="20" y1="22.5" x2="51" y2="22.5" strokeWidth="3.2" />
    <line x1="20" y1="28.5" x2="51" y2="28.5" strokeWidth="3.2" />
    <line x1="20" y1="34.5" x2="51" y2="34.5" strokeWidth="3.2" />

    {/* Sleeve Cuff (bottom left) */}
    <path d="M4 51 L14 62 L20 57 L10 46 Z" strokeWidth="3.4" />
    <line x1="8" y1="48" x2="18" y2="58.5" strokeWidth="2.4" />

    {/* Hand holding paper */}
    {/* Palm and Finger pointing up-right */}
    <path
      d="M19 56 C26 56 36 51 44 45 L 57 37 C 59.5 35 62 38.5 59.5 41 L 46 50 C 40 55 30 58.5 19 57"
      strokeWidth="3.4"
    />

    {/* Thumb resting along the paper bottom */}
    <path
      d="M11 45 C15 40 20 40 28 42 L 41 43 C 43.5 43 44 47 41.5 47.5 L 29 47"
      strokeWidth="3.4"
    />
  </svg>
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

// 28. Alumni Profiles (Three graduates with mortarboard caps, neckties, and open book)
export const AlumniProfilesIcon = ({ size = 20, className = 'nav-icon', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="currentColor"
    className={className}
    {...props}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M 0.68 61.96 L 0.68 62.64 0.82 62.91 1.36 63.32 28.40 63.32 32.07 61.83 33.43 62.51 34.51 62.78 35.60 63.32 62.64 63.32 62.91 63.18 63.32 62.64 63.32 61.96 62.78 61.01 62.64 60.33 61.83 58.70 61.28 57.07 60.74 56.12 59.52 52.86 58.84 51.63 58.70 50.96 58.16 49.87 57.34 49.46 55.30 48.92 54.22 48.78 53.67 48.37 53.54 47.69 52.99 47.01 51.23 46.61 50.28 46.20 50.14 48.24 51.50 48.65 51.91 49.05 52.45 50.68 53.13 52.04 53.13 52.45 53.81 53.81 54.22 55.17 54.62 55.85 54.49 56.25 51.36 55.58 50.82 55.30 45.25 54.35 43.89 54.22 39.13 54.22 36.14 54.76 34.92 55.17 33.02 56.12 32.88 56.39 31.93 56.93 30.71 55.98 29.08 55.17 27.18 54.62 24.73 54.22 19.97 54.22 13.72 55.17 12.64 55.58 9.92 56.12 9.78 56.25 9.38 56.12 9.38 55.85 9.78 55.17 9.92 54.49 10.60 53.13 10.87 52.04 11.55 50.68 12.09 49.05 12.50 48.65 13.32 48.51 13.86 48.24 13.86 46.20 11.28 46.88 10.60 47.42 10.46 48.10 10.06 48.65 6.66 49.46 5.84 49.87 5.30 50.96 5.03 51.91 4.48 52.86 4.08 54.22 2.45 57.75 2.31 58.43 Z M 3.26 61.01 L 4.35 58.70 4.76 57.34 5.44 56.12 5.57 55.44 6.11 54.49 6.52 53.13 7.20 51.63 7.75 51.23 8.70 50.96 9.10 51.09 9.10 51.36 7.88 54.22 7.75 54.90 7.07 56.25 6.66 57.75 6.66 58.43 6.79 58.70 7.34 58.97 7.75 58.97 9.92 58.16 12.50 57.48 18.21 56.39 19.70 56.25 25.14 56.25 26.77 56.53 29.08 57.34 30.30 58.16 31.12 59.11 31.66 59.52 32.48 59.52 33.70 58.16 35.19 57.21 36.28 56.80 38.86 56.25 44.30 56.25 45.66 56.39 50.96 57.34 51.91 57.75 54.08 58.16 56.25 58.97 56.66 58.97 57.21 58.70 57.48 57.89 56.93 56.25 56.25 54.90 56.12 54.22 54.76 51.09 55.30 50.96 56.53 51.36 56.80 51.63 58.56 56.12 59.24 57.34 59.65 58.70 60.20 59.65 60.60 61.28 35.87 61.28 34.38 60.60 32.61 60.06 32.20 59.79 30.71 60.20 28.13 61.28 Z M 16.03 39.81 L 15.90 40.22 15.90 51.09 16.31 51.50 16.99 51.63 17.53 51.36 17.80 50.96 17.80 40.90 18.07 40.22 19.30 39.00 20.11 38.45 22.28 37.37 23.24 37.10 24.46 36.42 25.41 36.14 27.31 35.19 27.86 35.33 29.62 36.96 30.57 37.64 30.44 38.59 29.62 40.76 29.35 42.12 28.13 45.52 28.13 46.47 31.39 50.00 32.07 50.14 32.61 50.00 35.87 46.47 35.87 45.52 35.60 45.11 35.33 43.75 33.56 38.59 33.43 37.64 36.14 35.33 37.37 35.46 37.91 35.87 39.54 36.42 40.76 37.10 41.72 37.37 42.26 37.77 43.62 38.32 44.98 39.27 45.79 40.08 46.20 41.04 46.20 50.96 46.47 51.36 47.15 51.63 47.69 51.50 48.10 51.09 48.10 40.22 47.83 39.54 47.29 38.73 46.20 37.64 45.25 36.96 43.21 35.87 41.04 35.06 39.54 34.24 38.59 33.97 36.69 33.02 35.74 33.02 32.61 35.74 31.93 36.14 28.40 33.15 28.13 33.02 27.31 33.02 19.16 36.69 17.94 37.50 16.71 38.73 Z M 32.20 40.49 L 32.20 40.90 33.83 45.66 33.70 45.93 31.93 47.56 30.57 46.06 30.30 45.93 30.17 45.52 30.85 43.89 31.66 41.31 31.66 40.90 Z M 41.04 23.92 L 41.04 24.46 40.76 25.27 40.76 26.23 42.12 25.55 42.80 25.41 45.79 27.99 45.66 28.67 45.25 29.49 44.84 31.25 43.89 33.83 44.03 34.24 44.84 34.51 45.38 34.92 45.66 34.92 46.06 33.97 46.61 31.80 46.88 31.39 46.88 30.98 47.15 30.57 47.42 30.85 47.83 32.61 48.24 33.43 48.92 35.74 48.92 36.01 48.37 36.55 48.24 37.10 49.32 38.45 49.60 38.32 50.96 36.82 51.09 36.01 48.51 27.99 51.50 25.41 51.91 25.41 53.40 26.23 54.35 26.50 55.30 27.04 57.75 27.99 59.65 29.08 60.33 29.62 61.28 30.85 61.28 40.90 61.42 41.31 61.83 41.72 62.78 41.72 63.05 41.58 63.32 41.17 63.32 30.71 62.64 29.21 61.83 28.26 60.60 27.31 58.97 26.36 57.75 25.95 56.53 25.27 55.58 25.00 54.35 24.32 53.40 24.05 51.77 23.24 50.96 23.24 50.68 23.37 47.29 26.36 47.01 26.36 43.35 23.24 42.39 23.24 Z M 22.96 23.92 L 21.47 23.24 20.65 23.24 18.89 24.59 17.26 26.09 16.71 26.36 13.04 23.24 12.09 23.24 8.70 24.87 5.30 26.23 2.58 27.86 1.49 28.94 0.68 30.57 0.68 41.17 0.82 41.44 1.22 41.72 2.17 41.72 2.58 41.31 2.72 40.90 2.72 30.85 3.13 30.17 3.80 29.49 5.16 28.54 7.75 27.31 8.42 27.18 12.09 25.41 12.50 25.41 14.81 27.31 15.49 28.13 15.22 28.54 14.81 30.30 14.27 31.52 14.13 32.48 13.45 34.11 12.91 36.01 13.04 36.82 14.40 38.32 14.81 38.18 15.76 36.82 15.08 36.01 15.08 35.74 15.35 35.19 15.76 33.43 16.17 32.61 16.58 30.85 16.85 30.57 17.53 32.20 17.94 33.97 18.34 34.92 18.62 34.92 19.16 34.51 19.97 34.24 20.11 33.97 19.70 32.48 18.21 28.26 18.34 27.72 21.20 25.41 21.88 25.55 23.10 26.23 23.24 25.27 22.96 24.46 Z M 31.66 10.46 L 29.76 11.28 28.67 11.55 27.58 12.09 25.68 12.64 24.59 13.18 21.33 14.27 20.93 14.54 20.65 14.95 20.65 19.30 21.20 19.84 22.01 19.84 22.42 19.57 22.56 19.30 22.69 16.58 24.05 16.99 24.19 22.01 24.87 22.96 25.27 26.50 25.82 28.13 26.77 29.89 27.99 31.12 29.35 31.93 30.98 32.48 33.02 32.48 34.38 32.07 35.87 31.25 36.82 30.44 37.37 29.49 37.77 29.08 38.73 26.50 39.13 22.96 39.81 22.15 39.95 16.99 42.94 16.03 43.21 15.63 43.21 14.81 42.94 14.40 41.58 14.00 40.90 13.59 39.00 13.04 38.32 12.64 36.42 12.09 32.75 10.60 Z M 27.18 23.24 L 28.13 23.51 29.49 23.64 34.65 23.64 37.10 23.37 36.69 26.36 35.74 28.54 35.33 29.08 34.51 29.76 33.02 30.44 31.80 30.57 30.98 30.44 29.76 29.89 28.26 28.54 27.45 26.90 27.04 25.00 27.04 24.19 26.90 24.05 Z M 26.23 17.66 L 28.94 18.34 31.80 19.30 33.29 19.02 35.06 18.34 37.10 17.80 37.91 17.80 37.77 18.07 37.91 20.65 37.64 21.06 36.82 21.33 33.15 21.74 29.08 21.61 26.63 21.20 26.23 20.93 26.09 20.52 26.23 19.97 Z M 25.14 15.08 L 28.13 13.86 30.03 13.32 30.71 12.91 31.80 12.64 33.29 12.91 33.97 13.32 35.87 13.86 36.96 14.40 38.45 14.81 38.86 15.08 38.45 15.35 36.82 15.90 35.87 16.03 32.20 17.26 31.80 17.26 28.13 16.03 26.23 15.63 Z M 46.88 0.68 L 36.28 4.62 36.01 4.89 35.74 5.57 35.74 9.24 36.14 9.92 36.55 10.06 37.37 9.92 37.77 9.38 38.18 6.93 39.27 7.20 39.54 11.14 43.07 12.37 43.89 12.77 44.70 13.72 45.11 13.86 49.60 13.86 52.31 13.59 51.91 16.44 51.36 17.94 50.68 19.02 49.87 19.84 48.92 20.38 47.15 20.79 45.38 20.38 44.30 19.70 43.48 18.75 43.21 18.21 42.67 18.07 41.99 18.34 41.72 18.62 41.85 19.97 42.39 20.65 43.48 21.61 44.84 22.28 46.20 22.69 47.97 22.69 49.60 22.28 50.68 21.74 52.31 20.25 52.99 19.16 53.67 17.39 54.08 15.76 54.35 13.04 55.03 12.23 55.17 7.20 57.89 6.39 58.43 5.71 58.43 5.16 57.89 4.48 56.39 4.08 47.42 0.68 Z M 41.44 7.88 L 43.21 8.29 46.88 9.51 47.42 9.51 48.37 9.10 49.32 8.97 52.18 8.02 52.99 8.02 52.86 11.28 51.09 11.69 48.65 11.96 45.66 11.96 41.72 11.41 41.44 11.28 Z M 40.36 5.30 L 41.44 4.76 42.94 4.35 44.03 3.80 47.29 2.72 48.78 3.40 50.28 3.80 51.36 4.35 53.27 4.89 53.81 5.16 53.81 5.57 53.40 5.57 49.73 6.79 47.83 7.20 47.42 7.47 46.88 7.47 46.47 7.20 44.57 6.79 42.80 6.11 40.63 5.57 Z M 16.44 0.68 L 15.76 1.09 13.86 1.63 13.18 2.04 11.28 2.58 10.19 3.13 8.70 3.53 8.02 3.94 5.98 4.62 5.57 5.03 5.44 5.44 5.44 9.38 5.57 9.65 6.11 10.06 6.79 10.06 7.07 9.92 7.34 9.51 7.34 7.34 7.88 6.93 8.83 7.20 8.97 12.23 9.10 12.50 9.51 12.77 10.06 16.44 10.87 18.89 12.09 20.65 13.18 21.61 15.35 22.56 16.03 22.69 17.66 22.69 18.89 22.42 20.25 21.74 20.38 21.47 19.97 21.33 19.16 20.38 18.75 20.25 17.66 20.65 15.90 20.65 14.13 19.84 13.04 18.62 12.50 17.53 11.82 15.08 11.69 14.00 11.82 13.45 14.54 13.86 19.02 13.86 19.30 13.72 20.11 12.77 22.28 11.82 23.51 11.55 24.19 11.14 24.59 11.14 24.73 7.20 25.82 6.93 26.63 6.52 27.58 6.39 27.99 5.98 28.13 5.30 27.99 4.89 27.18 4.35 23.51 3.13 22.42 2.58 22.01 2.58 17.12 0.68 Z M 11.28 7.88 L 16.58 9.51 17.12 9.51 22.28 7.88 22.69 8.02 22.56 11.28 20.79 11.69 18.34 11.96 15.08 11.96 11.55 11.41 11.01 11.14 Z M 10.06 5.30 L 11.14 4.76 12.64 4.35 16.71 2.72 16.99 2.72 17.39 2.99 17.80 2.99 18.48 3.40 21.06 4.35 22.56 4.76 23.64 5.30 23.37 5.57 21.20 6.11 19.43 6.79 16.99 7.47 16.58 7.47 15.22 6.93 10.33 5.57 Z"
    />
  </svg>
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
export const SystemAnnouncementIcon = ({ size = 20, className = 'nav-icon', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Megaphone back mouthpiece */}
    <path d="M2.2 12.2l1.6-1.2 1.8 2.4-1.6 1.2z" />

    {/* Megaphone cylinder body */}
    <rect x="3.8" y="8.2" width="5.2" height="6.5" rx="1.2" transform="rotate(-38 6.4 11.45)" />

    {/* Megaphone handle */}
    <path d="M6.2 15.5l1.2 4.5a1.2 1.2 0 0 0 2.3-.6l-1.1-4.2" />

    {/* Trigger button */}
    <path d="M8.8 15.5c.7.4 1 1.2.7 1.8" />

    {/* Megaphone cone */}
    <path d="M7.6 8.2L13.6 2a1.2 1.2 0 0 1 1.4.1l.8.7" />
    <path d="M15.8 6.2c1.8.8 2.3 2.3 1.4 3.8" />
    <path d="M17.2 10l1.3 4.2" />
    <path d="M9.8 13.8l4.4 2.4" />

    {/* Speech Bubble */}
    <path d="M15.5 14.5h5a1.5 1.5 0 0 1 1.5 1.5v4.5a1.5 1.5 0 0 1-1.5 1.5h-4l-2.3 1.8v-1.8h-.2a1.5 1.5 0 0 1-1.5-1.5V16a1.5 1.5 0 0 1 1.5-1.5z" />

    {/* Message text lines */}
    <line x1="16.5" y1="17.2" x2="20.5" y2="17.2" />
    <line x1="16.5" y1="19.2" x2="20.5" y2="19.2" />
  </svg>
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

// 33. Announcement (bullhorn)
export const AnnouncementIcon = createIcon(
  <>
    <polygon points="5 8 13 4 13 18 5 14" />
    <rect x="3" y="9.5" width="2" height="3" rx="0.5" />
    <path d="M13 4c2-0.5 4-0.5 4 7s-2 7.5-4 7" />
    <path d="M9 14v4a1 1 0 0 1-1 1H7" />
  </>
);

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
