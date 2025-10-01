// Master lists for role assignment
export const DEVELOPER_EMAILS = [
  'hedrichdev@gmail.com',
  'developer@softballstats.com',
  // Add more developer emails here
];

export const ADMIN_EMAILS = [
  'admin@example.com',
  'coach@team1.com',
  'manager@league.com',
  'admin@softballstats.com',
  // Add more admin emails here
];

export const ROLE_HIERARCHY = {
  developer: 4,
  admin: 3,
  player: 2,
  visitor: 1,
} as const;

export const PERMISSIONS = {
  VIEW_STATS: ['developer', 'admin', 'player', 'visitor'],
  MANAGE_PLAYERS: ['developer', 'admin'],
  MANAGE_TEAMS: ['developer', 'admin'],
  MANAGE_GAMES: ['developer', 'admin'],
  MANAGE_STATS: ['developer', 'admin'],
  CHANGE_ROLES: ['developer'],
  ACCESS_ADMIN: ['developer', 'admin'],
  VIEW_DASHBOARD: ['developer', 'admin', 'player', 'visitor'],
  EXPORT_DATA: ['developer', 'admin'],
  DELETE_DATA: ['developer'],
  SYSTEM_CONFIG: ['developer'],
} as const;

export type Role = keyof typeof ROLE_HIERARCHY;
export type Permission = keyof typeof PERMISSIONS;

export function determineRole(email: string): Role {
  const normalizedEmail = email.toLowerCase().trim();
  
  if (DEVELOPER_EMAILS.includes(normalizedEmail)) {
    return 'developer';
  }
  if (ADMIN_EMAILS.includes(normalizedEmail)) {
    return 'admin';
  }
  return 'player';
}

export function generatePlayerId(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString().slice(2, 6);
  return `P${timestamp}${random}`; // Format: P123456789
}

export function hasPermission(userRole: string, permission: Permission): boolean {
  return PERMISSIONS[permission].includes(userRole as Role);
}

export function canManageRole(currentUserRole: Role, targetRole: Role): boolean {
  return ROLE_HIERARCHY[currentUserRole] > ROLE_HIERARCHY[targetRole];
}

export function getRoleColor(role: Role): string {
  switch (role) {
    case 'developer':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'admin':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'player':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'visitor':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function getRoleDescription(role: Role): string {
  switch (role) {
    case 'developer':
      return 'Full system access, user management, and development features';
    case 'admin':
      return 'League management, team and player administration';
    case 'player':
      return 'View statistics and personal profile management';
    case 'visitor':
      return 'Read-only access to public statistics';
    default:
      return 'Basic access';
  }
}