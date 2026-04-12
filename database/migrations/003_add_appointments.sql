-- Migration: Add Appointment System
CREATE TABLE IF NOT EXISTS hod_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hod_id INT NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    start_time TIME DEFAULT '09:00:00',
    end_time TIME DEFAULT '17:00:00',
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY (hod_id, day_of_week),
    FOREIGN KEY (hod_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    hod_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    reason TEXT,
    status ENUM('Pending', 'Confirmed', 'Completed', 'Cancelled') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (hod_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed some default availability for the current Admin (HOD)
-- Assuming admin user id = 1
INSERT IGNORE INTO hod_availability (hod_id, day_of_week, start_time, end_time) VALUES 
(1, 'Monday', '09:00:00', '16:00:00'),
(1, 'Wednesday', '09:00:00', '16:00:00'),
(1, 'Friday', '09:00:00', '13:00:00');
