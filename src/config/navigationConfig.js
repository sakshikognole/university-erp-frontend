import {
  LayoutDashboard,
  Users,
  Building2,
  BookOpen,
  FileText,
  FilePlus,
  Send,
  LayoutTemplate,
  UsersRound,
  Dumbbell,
  ShieldHalf,
  CalendarDays,
  Upload,
  MonitorPlay,
  CreditCard,
  BedDouble,
  GraduationCap,
  MapPin,
  UserCheck,
} from 'lucide-react';

export const navigationConfig = {

  // ── Super Admin sees everything ──────────────────────────────────────────
  SUPER_ADMIN: [
    { label: 'Super Admin Dashboard', path: '/super-admin/dashboard', icon: LayoutDashboard },
    { label: 'User Directory',        path: '/users',                  icon: Users },
    { label: 'Departments',           path: '/departments',            icon: Building2 },
    { label: 'Students',              path: '/students',               icon: GraduationCap },
    { label: 'Staff',                 path: '/staff',                  icon: UserCheck },
    { label: 'Venues',                path: '/venues',                 icon: MapPin },
    { label: 'Books',                 path: '/books',                  icon: BookOpen },
    { label: 'Clubs',                 path: '/clubs',                  icon: UsersRound },
    { label: 'Sports',                path: '/sports',                 icon: Dumbbell },
    { label: 'Sport Teams',           path: '/sport-team-v2',          icon: ShieldHalf },
    { label: 'Venue Booking',         path: '/venue-booking',          icon: CalendarDays },
    { label: 'Upload Materials',      path: '/upload-materials',       icon: Upload },
    { label: 'Study Materials',       path: '/display-materials',      icon: MonitorPlay },
    { label: 'Payment',               path: '/payment',                icon: CreditCard },
    { label: 'Hostel',                path: '/hostel',                 icon: BedDouble },
    { label: 'Certificates',          path: '/select-student',         icon: FileText },
    { label: 'Add Document',          path: '/add-document',           icon: FilePlus },
    { label: 'Handout',               path: '/handout',                icon: Send },
    { label: 'Letterhead',            path: '/letterhead',             icon: LayoutTemplate },
  ],

  // ── Sub Admin ────────────────────────────────────────────────────────────
  SUB_ADMIN: [
    { label: 'Dashboard',        path: '/dashboard',        icon: LayoutDashboard },
    { label: 'Departments',      path: '/departments',      icon: Building2 },
    { label: 'Students',         path: '/students',         icon: GraduationCap },
    { label: 'Staff',            path: '/staff',            icon: UserCheck },
    { label: 'Venues',           path: '/venues',           icon: MapPin },
    { label: 'Sports',           path: '/sports',           icon: Dumbbell },
    { label: 'Sport Teams',      path: '/sport-team-v2',    icon: ShieldHalf },
    { label: 'Venue Booking',    path: '/venue-booking',    icon: CalendarDays },
    { label: 'Payment',          path: '/payment',          icon: CreditCard },
    { label: 'Hostel',           path: '/hostel',           icon: BedDouble },
  ],

  // ── Faculty / Professor ──────────────────────────────────────────────────
  FACULTY: [
    { label: 'Dashboard',        path: '/dashboard',        icon: LayoutDashboard },
    { label: 'Departments',      path: '/departments',      icon: Building2 },
    { label: 'Books',            path: '/books',            icon: BookOpen },
    { label: 'Clubs',            path: '/clubs',            icon: UsersRound },
    { label: 'Sports',           path: '/sports',           icon: Dumbbell },
    { label: 'Sport Teams',      path: '/sport-team-v2',    icon: ShieldHalf },
    { label: 'Venue Booking',    path: '/venue-booking',    icon: CalendarDays },
    { label: 'Upload Materials', path: '/upload-materials', icon: Upload },
    { label: 'Certificates',     path: '/select-student',   icon: FileText },
    { label: 'Handout',          path: '/handout',          icon: Send },
  ],

  // ── Finance Officer ──────────────────────────────────────────────────────
  FINANCE: [
    { label: 'Dashboard',   path: '/dashboard',   icon: LayoutDashboard },
    { label: 'Departments', path: '/departments', icon: Building2 },
    { label: 'Payment',     path: '/payment',     icon: CreditCard },
  ],

  // ── Student ──────────────────────────────────────────────────────────────
  STUDENT: [
    { label: 'Dashboard',      path: '/dashboard',       icon: LayoutDashboard },
    { label: 'Books',          path: '/books',            icon: BookOpen },
    { label: 'Clubs',          path: '/clubs',            icon: UsersRound },
    { label: 'Sports',         path: '/sports',           icon: Dumbbell },
    { label: 'Sport Teams',    path: '/sport-team-v2',    icon: ShieldHalf },
    { label: 'Study Materials',path: '/display-materials',icon: MonitorPlay },
    { label: 'Venue Booking',  path: '/venue-booking',    icon: CalendarDays },
    { label: 'Certificates',   path: '/select-student',   icon: FileText },
  ],

  // ── Teacher ──────────────────────────────────────────────────────────────
  TEACHER: [
    { label: 'Dashboard',        path: '/dashboard',        icon: LayoutDashboard },
    { label: 'Departments',      path: '/departments',      icon: Building2 },
    { label: 'Books',            path: '/books',            icon: BookOpen },
    { label: 'Clubs',            path: '/clubs',            icon: UsersRound },
    { label: 'Sports',           path: '/sports',           icon: Dumbbell },
    { label: 'Sport Teams',      path: '/sport-team-v2',    icon: ShieldHalf },
    { label: 'Venue Booking',    path: '/venue-booking',    icon: CalendarDays },
    { label: 'Upload Materials', path: '/upload-materials', icon: Upload },
    { label: 'Study Materials',  path: '/display-materials',icon: MonitorPlay },
    { label: 'Certificates',     path: '/select-student',   icon: FileText },
    { label: 'Handout',          path: '/handout',          icon: Send },
  ],
};
