export const otpTemplate = (emailData: { otp: number }) => {
  return `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OTP Verification</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 50px auto;
      background-color: #ffffff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding: 20px;
      background-color: #007BFF;
      color: #ffffff;
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
    }
    .content {
      padding: 20px;
      text-align: center;
    }
    .otp {
      font-size: 24px;
      font-weight: bold;
      color: #007BFF;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 10px;
      font-size: 12px;
      color: #aaaaaa;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>OTP Verification</h1>
    </div>
    <div class="content">
      <p>Your One-Time Password (OTP) for verification is:</p>
      <p class="otp">${emailData.otp}</p>
      <p>Please use this OTP to complete your verification. Do not share this code with anyone.</p>
      <p>If you did not request this OTP, please ignore this email.</p>
      <p>Thank you!</p>
    </div>
    <div class="footer">
      <p>&copy; 2024 Seven Group Solutions. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
};
