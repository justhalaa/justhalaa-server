export const feedbackTemplate = (emailData) => {
  const { name, event_name, url } = emailData;
  return `
    <!DOCTYPE html>
<html>
<head>
  <title>Event Feedback</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 20px auto; padding: 20px; background: #fff; border: 1px solid #ddd; border-radius: 8px;">
    <h2 style="color: #0056b3; text-align: center;">We'd Love Your Feedback!</h2>
    <p style="font-size: 16px; margin-bottom: 20px;">
      Dear ${name},
    </p>
    <p style="font-size: 16px; margin-bottom: 20px;">
      Thank you for attending <strong>${event_name}</strong>. Your feedback is incredibly valuable to us and helps us improve future events. Please take a few moments to share your thoughts by clicking the link below:
    </p>
    <div style="text-align: center; margin-bottom: 20px;">
      <a href="${url}" style="display: inline-block; background-color: #0056b3; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-size: 16px;">Give Feedback</a>
    </div>
    <p style="font-size: 16px; margin-bottom: 20px;">
      We appreciate your time and input. If you have any additional comments, feel free to reply to this email.
    </p>
    <p style="font-size: 16px; margin-bottom: 0;">
      Best regards,<br>
      SGC Events
    </p>
  </div>
</body>
</html>

    `;
};
