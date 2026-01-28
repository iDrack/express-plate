import type SMTPTransport from "nodemailer/lib/smtp-transport/index.js";
import { logger } from "../../config/logger.js";
import nodemailer from "nodemailer";
import type { OutgoingMail } from "./templates/OutgoingMail.js";
import type { User } from "../../models/user.js";
import { ResetPasswordMail } from "./templates/ResetPasswordMail.js";


export class EmailService {
    private static instance: EmailService;
    private mailUser: string;

    private transporter;

    static getInstance() {
        if (!EmailService.instance) {
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    }

    constructor() {
        const isProdMode = process.env.NODE_ENV === "production";

        if (
            isProdMode &&
            (!process.env.MAIL_HOST ||
                !process.env.MAIL_PORT ||
                !process.env.MAIL_USER ||
                !process.env.MAIL_PASSWORD)
        ) {
            throw new Error(
                "Missing required mail configuration in production mode",
            );
        } else {
            this.mailUser = process.env.MAIL_USER!;

            this.transporter = nodemailer.createTransport({
                host: isProdMode
                    ? process.env.MAIL_HOST!
                    : "smtp.ethereal.email",
                port: isProdMode ? Number(process.env.MAIL_PORT!) : 587,
                secure: Number(process.env.MAIL_PORT!) === 465,
                auth: {
                    user: process.env.MAIL_USER!,
                    pass: process.env.MAIL_PASSWORD!,
                },
            });
        }
    }

    async sendEmail(
        mail: OutgoingMail,
    ): Promise<SMTPTransport.SentMessageInfo> {
        const info = await this.transporter.sendMail({
            from: this.mailUser,
            to: mail.to,
            subject: mail.subject,
            html: mail.body,
            text: mail.text,
        });

        logger.info("Message sent :", info.messageId);
        return info;
    }

    async resetEmailRequest(user: User, token: string): Promise<SMTPTransport.SentMessageInfo> {
        logger.info(`Password reset request for user ${user.id}`);
        const info = this.sendEmail(new ResetPasswordMail(user, token));
        return info;
    }
}

export const emailService = EmailService.getInstance();
