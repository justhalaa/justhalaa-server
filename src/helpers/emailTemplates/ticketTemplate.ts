export const ticketTemplate = (qrcode) => {
  return `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Modern Music Festival Ticket</title>
    <style>
        /* General body styles */
        body {
            color: #fff;
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }

        /* Ticket container styling */
        .ticket {
            width: 350px;
            background-color: #333;
            color: #fff;
            padding: 20px;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
        }

        /* Festival and company name styles */
        .company-name {
            font-size: 20px;
            font-weight: bold;
            color: #f0a500;
            margin-bottom: 10px;
        }

        .festival-name {
            font-size: 24px;
            font-weight: bold;
            color: #f0a500;
            margin-bottom: 20px;
        }

        /* Date and location styling */
        .date, .location {
            font-size: 16px;
            margin-bottom: 10px;
        }

        /* Ticket details section */
        .details {
            margin-top: 15px;
            font-size: 14px;
            color: #ccc;
        }

        .details p {
            margin: 5px 0;
        }

        /* QR code styling */
        .qr-code {
            width: 80px;
            height: 80px;
            background-color: #fff;
            margin: 20px auto 0;
            border-radius: 5px;
            background-image: url("${qrcode}");
            background-size: cover;
            background-position: center;
        }
    </style>
</head>
<body>
    <div class="ticket">
        <div class="company-name">MUSIC EVENTS INC.</div>
        <div class="festival-name">MODERN MUSIC FESTIVAL 2021</div>
        <div class="date">December 15, 2021</div>
        <div class="location">123 Main Street, City, State</div>
        <div class="location">Starts at 6:00 PM</div>
        <div class="qr-code"></div>
        <div class="details">
            <p>Single Entry Ticket</p>
            <p>Ticket ID: 455</p>
            <p>VIP Access</p>
        </div>
    </div>
</body>
</html>

    `;
};
