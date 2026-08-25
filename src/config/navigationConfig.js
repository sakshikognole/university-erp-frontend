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
    { label: 'Sport Teams',           path: '/sport-teams',            icon: ShieldHalf },
    { label: 'Certificates',          path: '/select-student',         icon: FileText },
    { label: 'Add Document',          path: '/add-document',           icon: FilePlus },
    { label: 'Handout',               path: '/handout',                icon: Send },
    { label: 'Letterhead',            path: '/letterhead',             icon: LayoutTemplate },
  ],

  // ── Sub Admin ────────────────────────────────────────────────────────────
  SUB_ADMIN: [
    { label: 'Dashboard',    path: '/dashboard',   icon: LayoutDashboard },
    { label: 'Departments',  path: '/departments', icon: Building2 },
    { label: 'Students',     path: '/students',    icon: GraduationCap },
    { label: 'Staff',        path: '/staff',       icon: UserCheck },
    { label: 'Venues',       path: '/venues',      icon: MapPin },
    { label: 'Sports',       path: '/sports',      icon: Dumbbell },
    { label: 'Sport Teams',  path: '/sport-teams', icon: ShieldHalf },
  ],

  // ── Faculty / Professor ──────────────────────────────────────────────────
  FACULTY: [
    { label: 'Dashboard',    path: '/dashboard',      icon: LayoutDashboard },
    { label: 'Departments',  path: '/departments',    icon: Building2 },
    { label: 'Books',        path: '/books',          icon: BookOpen },
    { label: 'Clubs',        path: '/clubs',          icon: UsersRound },
    { label: 'Sports',       path: '/sports',         icon: Dumbbell },
    { label: 'Sport Teams',  path: '/sport-teams',    icon: ShieldHalf },
    { label: 'Certificates', path: '/select-student', icon: FileText },
    { label: 'Handout',      path: '/handout',        icon: Send },
  ],

  // ── Finance Officer ──────────────────────────────────────────────────────
  FINANCE: [
    { label: 'Dashboard',   path: '/dashboard',   icon: LayoutDashboard },
    { label: 'Departments', path: '/departments', icon: Building2 },
  ],

  // ── Student ──────────────────────────────────────────────────────────────
  STUDENT: [
    { label: 'Dashboard',   path: '/dashboard',      icon: LayoutDashboard },
    { label: 'Books',       path: '/books',           icon: BookOpen },
    { label: 'Clubs',       path: '/clubs',           icon: UsersRound },
    { label: 'Sports',      path: '/sports',          icon: Dumbbell },
    { label: 'Sport Teams', path: '/sport-teams',     icon: ShieldHalf },
    { label: 'Certificates',path: '/select-student',  icon: FileText },
  ],

  // ── Teacher ──────────────────────────────────────────────────────────────
  TEACHER: [
    { label: 'Dashboard',    path: '/dashboard',      icon: LayoutDashboard },
    { label: 'Departments',  path: '/departments',    icon: Building2 },
    { label: 'Books',        path: '/books',          icon: BookOpen },
    { label: 'Clubs',        path: '/clubs',          icon: UsersRound },
    { label: 'Sports',       path: '/sports',         icon: Dumbbell },
    { label: 'Sport Teams',  path: '/sport-teams',    icon: ShieldHalf },
    { label: 'Certificates', path: '/select-student', icon: FileText },
    { label: 'Handout',      path: '/handout',        icon: Send },
  ],
};
