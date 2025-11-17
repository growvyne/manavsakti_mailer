import express from "express";
import cors from "cors";
import multer from "multer";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Root route
app.get("/", (req, res) => {
  res.send("Email API is running...");
});

// --------------------------------------
// MULTER CONFIGURATION FOR CV UPLOAD
// --------------------------------------
const uploadFolder = "uploads/";

if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadFolder);
  },
  filename: function (req, file, cb) {
    const ext = file.originalname.split(".").pop();
    cb(null, `CV_${Date.now()}.${ext}`);
  },
});

// Validation: Allow only PDF or DOCX
const fileFilter = (req, file, cb) => {
  const allowed = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF or DOCX files are allowed!"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// --------------------------------------
// SUBMIT FORM ROUTE
// --------------------------------------
app.post("/submit-form", upload.single("cv"), async (req, res) => {
  try {
    const {
      fullName,
      gender,
      dob,
      email,
      phone,
      company,
      designation,
      experience,
      ctc,
      expectedCtc,
      noticePeriod,
      city,
      degree,
      institute,
      department,
      industry,
      skills,
    } = req.body;

    const cvFile = req.file ? req.file.path : null;

    // --------------------------------------
    // NODEMAILER TRANSPORTER
    // --------------------------------------
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Gmail
        pass: process.env.EMAIL_PASS, // App Password
      },
    });

    // --------------------------------------
    // EMAIL HTML TEMPLATE
    // --------------------------------------
    const htmlContent = `
      <h2>New Job Application Received</h2>
      <p><strong>Full Name:</strong> ${fullName}</p>
      <p><strong>Gender:</strong> ${gender}</p>
      <p><strong>DOB:</strong> ${dob}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Company:</strong> ${company}</p>
      <p><strong>Designation:</strong> ${designation}</p>
      <p><strong>Experience:</strong> ${experience}</p>
      <p><strong>CTC:</strong> ${ctc}</p>
      <p><strong>Expected CTC:</strong> ${expectedCtc}</p>
      <p><strong>Notice Period:</strong> ${noticePeriod}</p>
      <p><strong>City:</strong> ${city}</p>
      <p><strong>Degree:</strong> ${degree}</p>
      <p><strong>Institute:</strong> ${institute}</p>
      <p><strong>Department:</strong> ${department}</p>
      <p><strong>Industry:</strong> ${industry}</p>
      <p><strong>Skills:</strong> ${skills}</p>
    `;

    // --------------------------------------
    // EMAIL OPTIONS
    // --------------------------------------
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `New Candidate: ${fullName}`,
      html: htmlContent,
      attachments: cvFile
        ? [
            {
              filename: req.file.originalname,
              path: cvFile,
            },
          ]
        : [],
    };

    // SEND EMAIL
    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: "Form submitted & email sent successfully!",
    });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// --------------------------------------
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
