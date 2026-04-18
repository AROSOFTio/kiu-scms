-- ============================================================
-- grant-docker-access.sql
-- Run this only if your aaPanel MySQL server is refusing Docker
-- connections from the application containers.
--
-- Before running:
-- 1. Replace CHANGE_ME_STRONG_PASSWORD
-- 2. Confirm the database/user name matches your .env values
-- ============================================================

GRANT ALL PRIVILEGES ON `kiu_scms`.* TO 'kiu_scms'@'172.%.%.%' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON `kiu_scms`.* TO 'kiu_scms'@'192.168.%.%' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON `kiu_scms`.* TO 'kiu_scms'@'localhost' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON `kiu_scms`.* TO 'kiu_scms'@'127.0.0.1' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';

FLUSH PRIVILEGES;

SELECT User, Host FROM mysql.user WHERE User = 'kiu_scms';
