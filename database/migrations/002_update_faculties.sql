-- Update/Add Faculties as requested
INSERT IGNORE INTO faculties (name) VALUES 
('College of Economics'),
('School of Law'),
('School of Mathematics and Computing');

-- Ensure they are present even if previous ones existed
-- We don't delete old ones to avoid breaking existing relations, 
-- but we make sure the new ones are available.
