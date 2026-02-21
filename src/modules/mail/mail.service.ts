import "reflect-metadata";
import type SMTPTransport from "nodemailer/lib/smtp-transport/index.js";
import { logger } from "../../config/logger.js";
import nodemailer from "nodemailer";
import type { OutgoingMail } from "./templates/OutgoingMail.js";
import type { User } from "../../models/user.js";
import { ResetPasswordMail } from "./templates/ResetPasswordMail.js";
import { Service } from "typedi";

@Service()
export class MailService {
    private mailUser: string;

    private transporter: nodemailer.Transporter<
        SMTPTransport.SentMessageInfo,
        SMTPTransport.Options
    >;

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

    /**
     * Send an e-mail.
     * @param mail E-mail containing mail's recipient, subject and body.
     * @returns Message info.
     */
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

    /**
     * Send an email containing a password reset link to the specified user's e-mail address.
     * @param user User requesting a password reset.
     * @param token Password reset token.
     * @returns Message info.
     */
    async resetEmailRequest(
        user: User,
        token: string,
    ): Promise<SMTPTransport.SentMessageInfo> {
        logger.info(`Password reset request for user ${user.id}`);
        const info = this.sendEmail(new ResetPasswordMail(user, token));
        return info;
    }
}

