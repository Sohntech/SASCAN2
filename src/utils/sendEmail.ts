import nodemailer from "nodemailer";


export const sendResetPasswordEmail = async (email: string, token: string) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // Utilise SSL (true) pour le port 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: 'Orange Digital Center - Sonatel Academy',
    to: email,
    subject: "Votre code de réinitialisation de mot de passe",
    text: `Votre code de réinitialisation : ${token}`,
    html: `<p><b>Votre code de réinitialisation :</b> ${token}</p>`,
  };

  await transporter.sendMail(mailOptions);
};

