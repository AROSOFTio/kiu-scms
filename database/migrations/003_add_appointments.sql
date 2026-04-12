-- Migration: Update Appointment System to Date-Based Availability
DROP TABLE IF EXISTS hod_availability;
CREATE TABLE IF NOT EXISTS hod_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hod_id INT NOT NULL,
    available_date DATE NOT NULL,
    start_time TIME DEFAULT '09:00:00',
    end_time TIME DEFAULT '17:00:00',
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY (hod_id, available_date),
    FOREIGN KEY (hod_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Note: 'appointments' table structure remains the same
