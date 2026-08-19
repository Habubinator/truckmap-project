import FormData from 'form-data'; // or built-in FormData
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Mailgun = require('mailgun.js');
import { MailDto } from './mail.dto';
const mailgun = new Mailgun(FormData);

class MailService {
  mg;
  constructor() {
    this.mg = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY || 'key-yourkeyhere',
      url: 'https://api.eu.mailgun.net',
    });
  }

  async sendMail(dto: MailDto) {
    try {
      await this.mg.messages.create(process.env.MAILGUN_FROM_MAIL, {
        from: 'Mailgun <postmaster@mail.censored-link.com>',
        to: dto.to,
        subject: dto.subject,
        text: dto.text,
        html: dto.html,
      });
    } catch (e: any) {
      if (e.response && e.response.body) {
        console.error(e.response.body);
      } else {
        console.error('Mailgun error:', e);
      }
    }
  }
}

export const mailService = new MailService();
