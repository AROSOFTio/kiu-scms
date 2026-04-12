import nodemailer from 'nodemailer';
import { db } from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

// SMTP Transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export class NotificationService {
  /**
   * Send an in-app notification by persisting it to the database.
   */
  static async sendInApp(userId: number, title: string, message: string) {
    try {
      await db.query(
        'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
        [userId, title, message]
      );
    } catch (err) {
      console.error('Error sending in-app notification:', err);
    }
  }

  /**
   * Send an email notification using Nodemailer.
   */
  static async sendEmail(to: string, subject: string, text: string, html?: string) {
    const makeHtmlTemplate = (title: string, body: string) => `
<div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#f8fafc;padding:40px 20px;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.1);">
    <div style="background-color:#008540;padding:30px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:900;letter-spacing:1px;text-transform:uppercase;">KIU Complaint Portal</h1>
    </div>
    <div style="padding:40px 30px;">
      <h2 style="color:#1e293b;font-size:18px;margin-top:0;font-weight:800;border-bottom:2px solid #f1f5f9;padding-bottom:15px;">${title}</h2>
      <div style="color:#475569;font-size:15px;line-height:1.6;margin-top:20px;">
        ${body.replace(/\n/g, '<br/>')}
      </div>
    </div>
    <div style="background-color:#f1f5f9;padding:20px 30px;text-align:center;">
      <p style="color:#94a3b8;font-size:12px;margin:0;line-height:1.5;">This is an automated institutional message from the Kampala International University Complaint Management System. Please do not reply directly to this email.</p>
    </div>
  </div>
</div>
`;

    // If SMTP details aren't provided, just log it.
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`[EMAIL BYPASS] To: ${to} | Subject: ${subject} | Body: ${text}`);
      return;
    }

    try {
      await transporter.sendMail({
        from: `"SCMS System" <${process.env.SYSTEM_EMAIL || 'no-reply@kiu.ac.ug'}>`,
        to,
        subject,
        text,
        html: html || makeHtmlTemplate(subject, text),
      });
    } catch (err) {
      console.error('Error sending email notification:', err);
    }
  }

  /**
   * Orchestrate notification flow for status changes.
   */
  static async notifyStatusChange(complaintId: number, newStatus: string, remarks: string) {
    try {
      // 1. Get complaint details with student and staff info
      const [rows]: any = await db.query(
        `SELECT c.reference_number, c.title, u.id as student_user_id, u.email as student_email,
                u.first_name as student_name, su.first_name as staff_name, su.email as staff_email
         FROM complaints c
         JOIN students s ON c.student_id = s.id
         JOIN users u ON s.user_id = u.id
         LEFT JOIN users su ON c.assigned_staff_id = su.id
         WHERE c.id = ?`,
        [complaintId]
      );

      if (rows.length === 0) return;

      const { reference_number, title, student_user_id, student_email, student_name, staff_name } = rows[0];

      // 2. Notify Student
      const studentMsg = `The status of your complaint ${reference_number}: "${title}" has been updated to "${newStatus}".\nRemarks: ${remarks}`;
      await this.sendInApp(student_user_id, `Status Update: ${newStatus}`, studentMsg);
      await this.sendEmail(student_email, `Status Update: ${reference_number}`, studentMsg);

      console.log(`Notification sent for complaint ${reference_number} status change to ${newStatus}`);
    } catch (err) {
      console.error('Error in notifyStatusChange:', err);
    }
  }

  /**
   * Notify staff when a complaint is assigned to them.
   */
  static async notifyAssignment(complaintId: number, staffUserId: number) {
    try {
      const [rows]: any = await db.query(
        `SELECT c.reference_number, c.title, u.email, u.first_name 
         FROM complaints c, users u 
         WHERE c.id = ? AND u.id = ?`,
        [complaintId, staffUserId]
      );

      if (rows.length === 0) return;

      const { reference_number, title, email, first_name } = rows[0];
      const msg = `Greetings ${first_name}, a new complaint ${reference_number}: "${title}" has been assigned to you for resolution.`;

      await this.sendInApp(staffUserId, 'New Assignment', msg);
      await this.sendEmail(email, `Assigned Complaint: ${reference_number}`, msg);
    } catch (err) {
      console.error('Error in notifyAssignment:', err);
    }
  }
}
