-- ============================================================
-- grant-docker-access.sql
-- Run this in aaPanel phpMyAdmin when the production app
-- can reach MySQL but gets "Access denied for user ...@172.x.x.x".
--
-- Before running:
-- 1. Replace CHANGE_ME_STRONG_PASSWORD
-- 2. Confirm the database/user name matches your production .env
-- 3. Keep the localhost grants for aaPanel phpMyAdmin itself
-- 4. Keep the Docker subnet or % grants for the app containers
-- ============================================================

CREATE USER IF NOT EXISTS 'kiu_scms'@'localhost' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
CREATE USER IF NOT EXISTS 'kiu_scms'@'127.0.0.1' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
CREATE USER IF NOT EXISTS 'kiu_scms'@'::1' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
CREATE USER IF NOT EXISTS 'kiu_scms'@'%' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
CREATE USER IF NOT EXISTS 'kiu_scms'@'172.%.%.%' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
CREATE USER IF NOT EXISTS 'kiu_scms'@'192.168.%.%' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
CREATE USER IF NOT EXISTS 'kiu_scms'@'10.%.%.%' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';

ALTER USER 'kiu_scms'@'localhost' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
ALTER USER 'kiu_scms'@'127.0.0.1' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
ALTER USER 'kiu_scms'@'::1' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
ALTER USER 'kiu_scms'@'%' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
ALTER USER 'kiu_scms'@'172.%.%.%' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
ALTER USER 'kiu_scms'@'192.168.%.%' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
ALTER USER 'kiu_scms'@'10.%.%.%' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';

GRANT ALL PRIVILEGES ON `kiu_scms`.* TO 'kiu_scms'@'localhost';
GRANT ALL PRIVILEGES ON `kiu_scms`.* TO 'kiu_scms'@'127.0.0.1';
GRANT ALL PRIVILEGES ON `kiu_scms`.* TO 'kiu_scms'@'::1';
GRANT ALL PRIVILEGES ON `kiu_scms`.* TO 'kiu_scms'@'%';
GRANT ALL PRIVILEGES ON `kiu_scms`.* TO 'kiu_scms'@'172.%.%.%';
GRANT ALL PRIVILEGES ON `kiu_scms`.* TO 'kiu_scms'@'192.168.%.%';
GRANT ALL PRIVILEGES ON `kiu_scms`.* TO 'kiu_scms'@'10.%.%.%';

FLUSH PRIVILEGES;

SELECT User, Host FROM mysql.user WHERE User = 'kiu_scms' ORDER BY Host;
