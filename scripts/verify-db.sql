-- Basic Phase 2 database verification.
-- This script intentionally avoids exposing application secrets.

SELECT 'users' AS table_name, COUNT(*)::bigint AS row_count FROM users
UNION ALL
SELECT 'roles', COUNT(*)::bigint FROM roles
UNION ALL
SELECT 'permissions', COUNT(*)::bigint FROM permissions
UNION ALL
SELECT 'settings', COUNT(*)::bigint FROM settings
UNION ALL
SELECT 'packages', COUNT(*)::bigint FROM packages
UNION ALL
SELECT 'wallets', COUNT(*)::bigint FROM wallets;
