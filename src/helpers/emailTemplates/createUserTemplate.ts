export const userTemplate = () => {
  return `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome Email</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .email-container {
            background-color: #ffffff;
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #dddddd;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            background-color: #007bff;
            color: white;
            padding: 10px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 20px;
            text-align: center;
        }
        .content h2 {
            color: #333333;
        }
        .content p {
            color: #666666;
            line-height: 1.6;
        }
        .footer {
            background-color: #f4f4f4;
            padding: 10px;
            text-align: center;
            font-size: 12px;
            color: #999999;
        }
        .button {
            background-color: #007bff;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Welcome to Event Management System</h1>
        </div>
        <div class="content">
            <h2>Hello there!🎉</h2>
            <p>We are excited to have you on board with us! Your journey to create and manage amazing events starts here. Our system offers you an easy and efficient way to manage event registrations, ticketing, guest lists, and much more.</p>
            <p>If you have any questions or need assistance, feel free to reach out. We are here to help you every step of the way.</p>
            <a href="[your-link]" class="button">Get Started</a>
        </div>
        <div class="footer">
            <p>&copy; 2024 Event Management System. All rights reserved.</p>
        </div>
    </div>
</body>
</html>

    `;
};
