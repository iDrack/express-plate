import type { User } from "../../../models/user.js";
import type { OutgoingMail } from "./OutgoingMail.js";

export class ResetPasswordMail implements OutgoingMail {
    public to: string;
    public subject: string;
    public body: string;
    public text: string;

    constructor(user: User, token: string) {
        const link = `${process.env.CLIENT_URL}/reset-password?token=${encodeURIComponent(
            token,
        )}`;
        this.to = user.email;
        this.subject = "Password reset request.";
        this.body = `<h3>A request for a password reset has been made for your account.</h3><p>Click this if you want to reset your password : <a href="${link}">${link}</a></p><p>If you are not at the origin of this request, you can ignore this e-mail.</p>`;
        this.text = this.body.replace(/<[^>]*>/g, "");
    }
}
