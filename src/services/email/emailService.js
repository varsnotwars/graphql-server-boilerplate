import { transporter } from "../../server";

export const emailService = {
    sendEmail: async (to, from, subject, html) => {
        transporter.sendMail({ to, subject, html }, (error, info) => {
            if (error) {
                console.log('Error occurred');
                console.error(error.message);
                return;
            }

            console.log('Message sent successfully!');
            console.log('Server responded with "%s"', info.response);
            transporter.close();
        });
    },
    createConfirmationLink: (origin, token) => `${origin}/confirm/${token}`,
    createConfirmEmail: url => `Please click <a href="${url}">here</a> to confirm email.`
};
