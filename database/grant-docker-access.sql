-- ============================================================
-- grant-docker-access.sql
-- Run this ONCE in phpMyAdmin (select kiu-scms DB → SQL tab)
-- Grants the kiu-scms user access from all Docker bridge IPs
-- ============================================================

-- Allow connections from any Docker subnet (172.x.x.x)
GRANT ALL PRIVILEGES ON `kiu-scms`.* TO 'kiu-scms'@'172.%.%.%' IDENTIFIED BY 'GzcWmMW38T5Zmrji';

-- Allow from 192.168.x.x subnets (some Docker setups use this range)
GRANT ALL PRIVILEGES ON `kiu-scms`.* TO 'kiu-scms'@'192.168.%.%' IDENTIFIED BY 'GzcWmMW38T5Zmrji';

-- Keep localhost access as well
GRANT ALL PRIVILEGES ON `kiu-scms`.* TO 'kiu-scms'@'localhost' IDENTIFIED BY 'GzcWmMW38T5Zmrji';
GRANT ALL PRIVILEGES ON `kiu-scms`.* TO 'kiu-scms'@'127.0.0.1' IDENTIFIED BY 'GzcWmMW38T5Zmrji';

FLUSH PRIVILEGES;

-- Verify: check the grants were created
SELECT User, Host FROM mysql.user WHERE User = 'kiu-scms';
