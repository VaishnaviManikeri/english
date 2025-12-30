import express from "express";
import Admission from "../models/Admission.js";
import nodemailer from "nodemailer";

const router = express.Router();

// Submit enquiry
router.post("/", async (req, res) => {
  try {
    const admission = new Admission(req.body);
    await admission.save();

    // send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

   const mailOptions = {
  from: process.env.MAIL_USER,
  to: req.body.email,
  subject: "Admission Enquiry Received",
  html: `
    <div style="
      font-family: Arial, sans-serif; 
      padding: 20px; 
      background: #f5f7fa; 
      border-radius: 10px;
      color: #333;
      line-height: 1.6;
    ">
      
      <div style="
        background: white; 
        padding: 20px 25px; 
        border-radius: 10px; 
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      ">
        
        <h2 style="color: #1e3a8a; margin-bottom: 10px;">
          Dear ${req.body.studentName},
        </h2>

        <p style="font-size: 16px; margin: 0 0 12px;">
          Thank you for reaching out to us!
        </p>

        <p style="font-size: 16px; margin: 0 0 12px;">
          Your <strong>Admission Enquiry</strong> has been submitted successfully.
        </p>

        <p style="font-size: 16px; margin: 0 0 12px;">
          Our admission team will contact you shortly with further details.
        </p>

        <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;" />

        <p style="font-size: 16px;">
          <strong>Regards,</strong><br>
          <span style="color: #1e3a8a; font-weight: bold;">
            Jadhavar English Medium School
          </span>
        </p>

      </div>
    </div>
  `,
};


    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: "Enquiry submitted & email sent!" });
  } catch (error) {
    res.status(500).json({ error: "Error submitting enquiry", details: error });
  }
});

export default router;
