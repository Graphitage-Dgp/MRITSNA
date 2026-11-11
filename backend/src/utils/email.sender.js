import { Resend } from "resend";
import "../config/env.js";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: process.env.TO_MAIL ? process.env.TO_MAIL : to,
      subject: subject,
      html: html,
    });

    return { success: true, data };
  } catch (error) {
    console.error("[Email Utility Error]:", error.message);
    return { success: false, error: error.message };
  }
};