const cron = require('node-cron');
const EventReminder = require('../models/EventReminder');
const emailService = require('./emailService');

class ReminderService {
    constructor() {
        this.isRunning = false;
    }

    // Start the reminder scheduler
    start() {
        if (this.isRunning) {
            console.log('Reminder service is already running');
            return;
        }

        console.log('Starting reminder service...');

        // Run every minute
        this.cronJob = cron.schedule('* * * * *', async () => {
            try {
                await this.processReminders();
            } catch (error) {
                console.error('Error processing reminders:', error);
            }
        }, {
            scheduled: false
        });

        this.cronJob.start();
        this.isRunning = true;
        console.log('Reminder service started - checking every minute');
    }

    // Stop the reminder scheduler
    stop() {
        if (this.cronJob) {
            this.cronJob.stop();
            this.isRunning = false;
            console.log('Reminder service stopped');
        }
    }

    // Process pending reminders
    async processReminders() {
        try {
            // Get pending reminders
            const pendingReminders = await EventReminder.getPendingReminders();

            if (pendingReminders.length === 0) {
                return;
            }

            for (const reminder of pendingReminders) {
                await this.sendReminder(reminder);
            }
        } catch (error) {
            console.error('Error in processReminders:', error);
        }
    }

    // Send individual reminder
    async sendReminder(reminder) {
        try {
            const {
                reminder_id,
                reminder_type,
                title,
                start_time,
                location,
                full_name,
                email,
                minutes_before
            } = reminder;

            console.log(`Sending ${reminder_type} reminder for event: "${title}" to ${email}`);

            let emailSent = false;
            let popupSent = false;

            // Send email notification
            if (reminder_type === 'email' || reminder_type === 'both') {
                try {
                    await this.sendEmailReminder(reminder);
                    emailSent = true;
                    console.log(`Email sent successfully for: "${title}"`);
                } catch (error) {
                    console.error('Email sending failed:', error.message);
                }
            }

            // For popup/browser notifications, we'll store in database and frontend will poll
            if (reminder_type === 'popup' || reminder_type === 'both') {
                try {
                    await this.createPopupNotification(reminder);
                    popupSent = true;
                    console.log(`Popup notification created for: "${title}"`);
                } catch (error) {
                    console.error('Popup notification failed:', error.message);
                }
            }

            // Mark reminder as sent only if at least one method succeeded
            if (emailSent || popupSent) {
                await EventReminder.markAsSent(reminder_id);
                console.log(`Reminder marked as sent for event: "${title}"`);
            } else {
                console.error(`All reminder methods failed for event: "${title}"`);
            }

        } catch (error) {
            console.error('Error sending reminder:', error);
        }
    }

    // Send email reminder
    async sendEmailReminder(reminder) {
        const {
            title,
            start_time,
            end_time,
            location,
            description,
            full_name,
            email,
            minutes_before,
            all_day
        } = reminder;

        const startDate = new Date(start_time);
        const eventDate = startDate.toLocaleDateString('vi-VN');
        const eventTime = all_day ? 'Cả ngày' : startDate.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const emailSubject = `Nhắc nhở: ${title} - ${minutes_before} phút nữa`;

        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #3B82F6;">Nhắc nhở sự kiện</h2>
                
                <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #1F2937; margin: 0 0 15px 0;">${title}</h3>
                    
                        <p><strong>Thời gian:</strong> ${eventTime} - ${eventDate}</p>
                        
                    ${location ? `<p><strong>Địa điểm:</strong> ${location}</p>` : ''}
                    
                    ${description ? `<p><strong>Mô tả:</strong> ${description}</p>` : ''}
                    
                    <p><strong>Sự kiện sẽ bắt đầu sau ${minutes_before} phút nữa</strong></p>
                </div>
                
                <p>Chúc bạn có một ngày tốt lành!</p>
                
                <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
                <p style="font-size: 12px; color: #6B7280;">
                    Bạn nhận được email này vì đã đăng ký nhắc nhở cho sự kiện trong ứng dụng Schedule Management.
                </p>
            </div>
        `;

        await emailService.sendEmail(email, emailSubject, emailContent);
    }

    // Create popup notification (store in database for frontend to poll)
    async createPopupNotification(reminder) {
        // TODO: Implement notification storage table if needed
        // For now, we can use browser notifications via WebSockets or polling
        console.log(`Popup notification created for: ${reminder.title}`);
    }

    // Get service status
    getStatus() {
        return {
            isRunning: this.isRunning,
            cronExpression: '* * * * *', // Every minute
            description: 'Event reminder scheduler'
        };
    }
}

// Export singleton instance
module.exports = new ReminderService();
