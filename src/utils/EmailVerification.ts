import nodemailer from 'nodemailer';

class EmailVerificationService {
  static async sendVerificationEmail(email: string, verificationToken: string) {
    const imageAttachment = {
        filename: 'Fintech-Email-Verification.png',  
        path: 'src/image/Fintech-Email-Verification.png',  
        cid: 'unique-image-id',  
    }; 
    const transporter = nodemailer.createTransport({
      service: process.env.NODEMAILER_SERVICE,
      host: process.env.NODEMAILER_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });
    const mailOptions = {
      from: process.env.NODEMAILER_NAME,
      to: email,
      subject: process.env.NODEMAILER_SUBJECT,
      html: ` 
      <div style="background-color: white; text-align: center; font-family: 'Poppins', sans-serif; padding: 17px;">       
        <img src="cid:${imageAttachment.cid}" alt="Email Verification" style="max-width: 100%; height: auto; margin-top: 20px;" />
        <p style="color: black; font-size: 30px;">${verificationToken}</p>
      </div>
      `,
      attachments: [imageAttachment],
    };
    await transporter.sendMail(mailOptions);
  }
}

export default EmailVerificationService;
