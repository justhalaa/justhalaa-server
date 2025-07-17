import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UtilsService {
  constructor(private readonly config: ConfigService) {}

  async sendEmail(
    template: string,
    to: string | string[],
    bcc: string | string[],
    subject: string,
  ) {
    const transporter = nodemailer.createTransport({
      host: this.config.get<string>('EMAIL_HOST'),
      port: this.config.get<string>('EMAIL_PORT'),
      // service: "gmail",
      auth: {
        user: this.config.get<string>('EMAIL_HOST_USER'),
        pass: this.config.get<string>('EMAIL_HOST_PASSWORD'),
      },

      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: `Just Halaa <${this.config.get<string>('USER_EMAIL')}>`,
      to,
      bcc,
      subject,
      html: template,
    };

    await transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.log(error);
        return error;
      } else {
        return 'Email sent';
      }
    });
  }
}
