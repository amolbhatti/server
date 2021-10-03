const nodemailer = require("nodemailer");
const pug = require("pug");
const htmlToString = require("html-to-text");

module.exports = class Email {
  constructor(user) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.otp = user.otp;
    this.from = `"AMOL BHATTI" <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      return nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL,
          pass: process.env.GMAIL_PASS,
        },
      });
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(subject, text, html = "") {
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: text,
    };
    //3) create an transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send("welcome", "Welcome to the Natours Family!");
  }

  async sendEmailConfirmation() {
    await this.send(
      "Email Confirmation",
      `Your email confirmation otp is: ${this.otp} , its valid for only 10 mins`
    );
  }
  async sendsignInOtp() {
    await this.send(
      "Sign In OTP",
      `Your signin OTP  is: ${this.otp} , its valid for only 10 mins`
    );
  }
  async sendExpiredImage(key) {
    // 1) render html for email based on pug template
    const html = pug.renderFile(`${__dirname}/../emailtemplate/base.pug`, {
      heading: "Expired images",
      key: key,
    });
    await this.send("Expired Images", htmlToString.htmlToText(html), html);
  }
};
