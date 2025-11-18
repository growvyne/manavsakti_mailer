import express from "express";
import cors from "cors";
import multer from "multer";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

app.get("/", (req, res) => {
  res.send("Email API is running...");
});


app.post("/send-cv", upload.single("cv"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "CV file is missing!" });
    }

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

    const cvFile = req.file;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MY_EMAIL,
        pass: process.env.MY_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: email,
      to: process.env.MY_EMAIL,
      subject: "New CV Submission",
    html: `
  <h2>New CV Submitted</h2>

  <h3>Personal Details</h3>
  <p><strong>Name:</strong> ${fullName}</p>
  <p><strong>Gender:</strong> ${gender}</p>
  <p><strong>Date of Birth:</strong> ${dob}</p>
  <p><strong>Email:</strong> ${email}</p>
  <p><strong>Phone:</strong> ${phone}</p>
  <p><strong>City:</strong> ${city}</p>

  <h3>Education Details</h3>
  <p><strong>Degree:</strong> ${degree}</p>
  <p><strong>Institute:</strong> ${institute}</p>
  <p><strong>Department:</strong> ${department}</p>

  <h3>Professional Details</h3>
  <p><strong>Company:</strong> ${company}</p>
  <p><strong>Designation:</strong> ${designation}</p>
  <p><strong>Experience:</strong> ${experience}</p>
  <p><strong>Industry:</strong> ${industry}</p>
  <p><strong>Current CTC:</strong> ${ctc}</p>
  <p><strong>Expected CTC:</strong> ${expectedCtc}</p>
  <p><strong>Notice Period:</strong> ${noticePeriod}</p>

  <h3>Skills</h3>
  <p>${skills}</p>

  <h3>Attachment</h3>
  <p>CV File Attached Successfully.</p>
`,

      attachments: [
        {
          filename: cvFile.originalname,
          path: cvFile.path,
        },
      ],
    });

    fs.unlink(cvFile.path, () => {});

    res.json({ message: "CV Sent Successfully!" });

  } catch (err) {
    console.error("Email sending error:", err);
    res.status(500).json({ error: "Email sending failed", details: err });
  }
});



app.listen(5000, () => {
  console.log("Server running on port 5000");
});
