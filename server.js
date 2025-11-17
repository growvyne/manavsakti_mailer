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

// Allowed file types: PDF, DOCX
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

// Multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// --------------------------------------
// FAST SUBMIT FORM ROUTE
// --------------------------------------
app.post("/submit-form", upload.single("cv"), (req, res) => {
  try {
    const formData = req.body;
    const file = req.file;

    // 1️⃣ Send quick response to frontend
    res.json({
      success: true,
      message: "Form received! Email will be sent shortly.",
    });

    // 2️⃣ Background email processing
    setImmediate(async () => {
      try {
        // Nodemailer transporter
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        // HTML email content (auto generate)
        const htmlContent = `
          <h2>New Job Application Received</h2>
          ${Object.entries(formData)
            .map(([key, value]) => {
              const label = key.charAt(0).toUpperCase() + key.slice(1);
              return `<p><strong>${label}:</strong> ${value}</p>`;
            })
            .join("")}
        `;

        // Email options
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: process.env.EMAIL_USER,
          subject: `New Candidate: ${formData.fullName}`,
          html: htmlContent,
          attachments: file
            ? [
                {
                  filename: file.originalname,
                  path: file.path,
                },
              ]
            : [],
        };

        // Send email
        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully for:", formData.fullName);

        // 3️⃣ Delete uploaded file after sending
        if (file) {
          fs.unlink(file.path, (err) => {
            if (err) console.log("Error deleting file:", err);
            else console.log("CV deleted:", file.path);
          });
        }
      } catch (err) {
        console.error("Background email error:", err.message);
      }
    });
  } catch (err) {
    console.error("Error:", err.message);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// --------------------------------------
// PORT FOR RENDER
// --------------------------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
