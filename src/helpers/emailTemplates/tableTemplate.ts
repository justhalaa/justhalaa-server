export const tableTemplate = (name, seats) => {
  return `
    <!DOCTYPE html>
<html>
<head>
  <title>Table Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f9f9f9; color: #333;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 20px auto; max-width: 400px; background-color: #ffffff; border: 1px solid #ddd; border-radius: 5px;">
    <tr>
      <td style="padding: 20px; text-align: center; background-color: #4CAF50; color: #ffffff; border-top-left-radius: 5px; border-top-right-radius: 5px;">
        <h2 style="margin: 0; font-size: 20px;">Your Table Number</h2>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px; text-align: center; font-size: 16px; color: #333;">
        <p style="margin: 0;">Hello ${name},</p>
        <p style="margin: 10px 0; font-size: 18px;">Your assigned table is:</p>
        <ul style="list-style: none; padding: 0; margin: 10px 0; font-size: 18px; font-weight: bold; color: #4CAF50;">
        ${seats.map((seat) => `<li style="margin: 5px 0;">Table: ${seat}</li>`).join('')}
        </ul>
        <p style="margin: 20px 0 0; font-size: 14px; color: #555;">Thank you for checking in. Enjoy the event!</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 10px; text-align: center; background-color: #f1f1f1; font-size: 12px; color: #777; border-bottom-left-radius: 5px; border-bottom-right-radius: 5px;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} Seven Groups Solutions.</p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
};
