const nodemailer = require('nodemailer');


export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface FakePollerNotification {
  faculty: any;
  poll: any;
  fakePollers: Array<{
    student: any;
    response: any;
  }>;
  totalResponses: number;
  fakeCount: number;
  correctCount: number;
}

export class EmailService {
  private transporter: any;

  constructor(config: EmailConfig) {
    this.transporter = nodemailer.createTransport(config);
  }

  /**
   * Send fake poller notification to faculty
   */
  async sendFakePollerNotification(
    notification: FakePollerNotification,
    excelBuffer: Buffer
  ): Promise<boolean> {
    try {
      const { faculty, poll, fakePollers, totalResponses, fakeCount, correctCount } = notification;

      // Create email content
      const emailContent = this.createFakePollerEmailContent(notification);
      
      // Send email with Excel attachment
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@fakepolldetection.com',
        to: faculty.collegeEmail,
        subject: `🚨 Fake Poll Alert: ${poll.title}`,
        html: emailContent,
        attachments: [
          {
            filename: `fake_pollers_${poll.id}_${new Date().toISOString().split('T')[0]}.xlsx`,
            content: excelBuffer,
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          }
        ]
      });

      console.log('Fake poller notification sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send fake poller notification:', error);
      return false;
    }
  }

  /**
   * Create HTML email content for fake poller notification
   */
  private createFakePollerEmailContent(notification: FakePollerNotification): string {
    const { faculty, poll, fakePollers, totalResponses, fakeCount, correctCount } = notification;
    
    const fakePollerRows = fakePollers.map(fp => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${fp.student.rollNumber}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${fp.student.collegeEmail}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${fp.student.year} - ${fp.student.section}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${fp.student.department}</td>
        <td style="padding: 8px; border: 1px solid #ddd; color: #d32f2f;">${fp.response.flagReason || 'Flagged'}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fake Poll Detection Alert</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f44336; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .stats { display: flex; justify-content: space-around; margin: 20px 0; }
          .stat-box { text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .stat-number { font-size: 24px; font-weight: bold; }
          .stat-label { font-size: 14px; color: #666; }
          .fake-count { color: #d32f2f; }
          .correct-count { color: #388e3c; }
          .total-count { color: #1976d2; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f5f5f5; padding: 12px 8px; border: 1px solid #ddd; text-align: left; font-weight: bold; }
          .footer { margin-top: 30px; padding: 20px; background: #f5f5f5; border-radius: 8px; font-size: 14px; color: #666; }
          .button { display: inline-block; padding: 12px 24px; background: #1976d2; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 Fake Poll Detection Alert</h1>
            <p>Dear ${faculty.name},</p>
          </div>
          
          <div class="content">
            <h2>Poll: ${poll.title}</h2>
            <p><strong>Description:</strong> ${poll.description}</p>
            <p><strong>Created:</strong> ${new Date(poll.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
            
            <div class="stats">
              <div class="stat-box">
                <div class="stat-number total-count">${totalResponses}</div>
                <div class="stat-label">Total Responses</div>
              </div>
              <div class="stat-box">
                <div class="stat-number fake-count">${fakeCount}</div>
                <div class="stat-label">Fake Pollers</div>
              </div>
              <div class="stat-box">
                <div class="stat-number correct-count">${correctCount}</div>
                <div class="stat-label">Correct Responses</div>
              </div>
            </div>

            <h3>🚨 Fake Pollers Detected (${fakeCount})</h3>
            <p>The following students have been flagged for providing false information:</p>
            
            <table>
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Email</th>
                  <th>Class</th>
                  <th>Department</th>
                  <th>Flag Reason</th>
                </tr>
              </thead>
              <tbody>
                ${fakePollerRows}
              </tbody>
            </table>

            <h3>📊 Detailed Report Attached</h3>
            <p>An Excel file containing detailed information about all responses, including:</p>
            <ul>
              <li>Complete student details</li>
              <li>All poll responses</li>
              <li>Verification results</li>
              <li>Flag reasons and confidence scores</li>
            </ul>

            <h3>🔍 What This Means</h3>
            <p>Students flagged as "fake pollers" have provided information that couldn't be verified through:</p>
            <ul>
              <li>LeetCode total problems count</li>
              <li>Codeforces contest submissions</li>
              <li>CodeChef contest results</li>
              <li>Contest attendance verification</li>
            </ul>

            <h3>📋 Recommended Actions</h3>
            <ol>
              <li>Review the attached Excel file for complete details</li>
              <li>Consider reaching out to flagged students for clarification</li>
              <li>Use this data for academic integrity discussions</li>
              <li>Monitor future poll responses from these students</li>
            </ol>

            <div class="footer">
              <p><strong>System Information:</strong></p>
              <p>• This is an automated notification from the Fake Poll Detection System</p>
              <p>• Detection confidence: Based on multiple verification sources</p>
              <p>• Generated on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
              <p>• If you have questions, please contact the system administrator</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send weekly summary report to faculty
   */
  async sendWeeklySummary(
    faculty: any,
    weeklyStats: {
      totalPolls: number;
      totalResponses: number;
      totalFakePollers: number;
      totalCorrectResponses: number;
      polls: Array<{
        title: string;
        fakeCount: number;
        correctCount: number;
      }>;
    }
  ): Promise<boolean> {
    try {
      const emailContent = this.createWeeklySummaryEmailContent(faculty, weeklyStats);
      
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@fakepolldetection.com',
        to: faculty.collegeEmail,
        subject: `📊 Weekly Poll Summary Report - ${new Date().toLocaleDateString('en-IN')}`,
        html: emailContent
      });

      console.log('Weekly summary sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send weekly summary:', error);
      return false;
    }
  }

  /**
   * Create weekly summary email content
   */
  private createWeeklySummaryEmailContent(faculty: any, stats: any): string {
    const pollRows = stats.polls.map((poll: any) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${poll.title}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${poll.fakeCount}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${poll.correctCount}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${poll.fakeCount + poll.correctCount}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Weekly Poll Summary</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .stats { display: flex; justify-content: space-around; margin: 20px 0; }
          .stat-box { text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .stat-number { font-size: 24px; font-weight: bold; }
          .stat-label { font-size: 14px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f5f5f5; padding: 12px 8px; border: 1px solid #ddd; text-align: left; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Weekly Poll Summary Report</h1>
            <p>Dear ${faculty.name},</p>
          </div>
          
          <div class="content">
            <h2>Week of ${new Date().toLocaleDateString('en-IN')}</h2>
            
            <div class="stats">
              <div class="stat-box">
                <div class="stat-number">${stats.totalPolls}</div>
                <div class="stat-label">Total Polls</div>
              </div>
              <div class="stat-box">
                <div class="stat-number">${stats.totalResponses}</div>
                <div class="stat-label">Total Responses</div>
              </div>
              <div class="stat-box">
                <div class="stat-number" style="color: #d32f2f;">${stats.totalFakePollers}</div>
                <div class="stat-label">Fake Pollers</div>
              </div>
              <div class="stat-box">
                <div class="stat-number" style="color: #388e3c;">${stats.totalCorrectResponses}</div>
                <div class="stat-label">Correct Responses</div>
              </div>
            </div>

            <h3>📋 Poll-by-Poll Breakdown</h3>
            <table>
              <thead>
                <tr>
                  <th>Poll Title</th>
                  <th>Fake Responses</th>
                  <th>Correct Responses</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${pollRows}
              </tbody>
            </table>

            <h3>📈 Summary</h3>
            <p>This week, your polls received <strong>${stats.totalResponses}</strong> responses across <strong>${stats.totalPolls}</strong> different polls.</p>
            <p><strong>${stats.totalFakePollers}</strong> students were flagged for providing unverifiable information.</p>
            <p><strong>${stats.totalCorrectResponses}</strong> students provided responses that could be verified.</p>

            <div style="margin-top: 30px; padding: 20px; background: #f5f5f5; border-radius: 8px;">
              <p><strong>💡 Tip:</strong> Consider reviewing the flagged responses to understand common patterns in false information.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Email service connection verified');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}

/**
 * Create email service instance with environment configuration
 */
export function createEmailService(): EmailService | null {
  // Check if email configuration is available
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('⚠️  Email service not configured. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in .env file');
    return null;
  }

  const config: EmailConfig = {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  };

  try {
    return new EmailService(config);
  } catch (error) {
    console.error('❌ Failed to create email service:', error);
    return null;
  }
} 