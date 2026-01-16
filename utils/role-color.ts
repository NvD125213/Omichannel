const ROLE_COLORS = [
  "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20",
  "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20",
  "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20",
  "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20",
  "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20",
];

function hashString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function getRoleColor(role?: string) {
  if (!role) return ROLE_COLORS[0];

  const index = hashString(role.toLowerCase()) % ROLE_COLORS.length;
  return ROLE_COLORS[index];
}
