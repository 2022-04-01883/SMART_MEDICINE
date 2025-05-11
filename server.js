/*const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const cors = require("cors");
const cron = require("node-cron");
const axios = require("axios"); // Add this at the top if not already there
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

const espPort = new SerialPort({
  path: "COM12", // Replace with your actual COM port
  baudRate: 9600,
});

const parser = espPort.pipe(new ReadlineParser({ delimiter: "\n" }));

parser.on("data", (line) => {
  console.log("ESP32:", line.trim());
});

espPort.on("error", (err) => {
  console.error("❌ Serial port error:", err.message);
});

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(logger)

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/hospitalDB");
mongoose.connection.on("connected", () => {
  console.log("✅ MongoDB connected successfully (local)");
});
mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB connection error:", err);
});

// Patient schema
const patientSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  phone: String,
  patientId: { type: String, required: true, unique: true },
  age: Number,
  gender: String,
  doctorRoom: String,
  homeAddress: String,
  doctorId: String,
  disease: String,
  dose: String,
  treatmentEnd: Date,
  stay: String,
  wardNumber: String,
  createdAt: { type: Date, default: Date.now },
  smsSent: { type: Boolean, default: false },
  bedNumber: String,
});

const Patient = mongoose.model("Patient", patientSchema);

// Email Setup
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for 465, false for 587
  auth: {
    user: 'tunusarapia@gmail.com',
    pass: 'hzyx ujlp wlju rplw'
  }
});
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

// Patient Registration
app.post("/register", async (req, res) => {
  try {
    const newPatient = new Patient(req.body);
    await newPatient.save();
    res.status(201).json({ message: "Patient registered successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Doctor Treatment Submission — ✅ FIXED VERSION
app.post("/treatment", async (req, res) => {
  try {
    const { patientId, doctorId, disease, dose, treatmentEnd, stay, wardNumber, bedNumber } = req.body;

    // Update patient treatment info
    await Patient.findOneAndUpdate(
      { patientId },
      { doctorId, disease, dose, treatmentEnd, stay, wardNumber, bedNumber }
    );
espPort.write
    // Re-fetch full patient data
    const patient = await Patient.findOne({ patientId });

    if (!patient || !patient.fullName || !patient.email) {
      return res.status(404).json({ error: "Patient data incomplete or not found!" });
    }

    console.log("Found patient for treatment:", patient.fullName);

    // Dose parsing
    let doseParts = dose.split("x");
    let doseCount = parseInt(doseParts[doseParts.length - 1]);
    if (isNaN(doseCount) || doseCount <= 0) {
      return res.status(400).json({ error: "Invalid dose format!" });
    }

    let intervalHours = 12 / (doseCount - 1);
    let intervalMs = intervalHours * 60 * 60 * 1000;

    // Immediate Email Notification
    transporter.sendMail({
      from: "tunusarapia@gmail.com",
      to: patient.email,
      subject: "SARAPIA INTERNATIONAL HOSPITAL - MEDICATION",
      html: `
        <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); font-family: Arial, sans-serif;">
          <div style="background: #d9534f; padding: 10px; text-align: center; color: white; font-size: 20px; font-weight: bold; border-radius: 10px 10px 0 0;">
            📌 Immediate Medication Dose
          </div>
          <div style="padding: 20px; color: #333; font-size: 16px;">
            <p>Dear <strong>${patient?.fullName || "Patient"}</strong>,</p>
            <p>It’s time to take your first dose of medication.</p>
            <p><strong>Dose:</strong> ${patient?.dose || "Not specified"}</p>
            <div style="background: #f9f9f9; padding: 15px; margin-top: 20px; border-left: 4px solid #d9534f;">
              <ul>
                <li>Drink plenty of water with your medicine.</li>
                <li>Avoid skipping doses to ensure a speedy recovery.</li>
                <li>Get enough rest and eat healthy meals.</li>
                <li>If you experience side effects, consult your doctor immediately.</li>
              </ul>
            </div>
          </div>
        </div>
      `,
    });

    console.log(`Immediate dose notification sent to ${patient.email}`);
// Send SMS via USB to ESP32
const smsPayload = `SMS:${patient.phone}:${`Dear ${patient.fullName}, it’s time to take your first dose. Dose: ${patient.dose}. Drink water and avoid skipping doses.`}`;

espPort.write(smsPayload + "\n", (err) => {
  if (err) {
    console.error("❌ Failed to write to ESP32 via USB:", err.message);
  } else {
    console.log("✅ SMS command sent to ESP32 via USB:", smsPayload);
  }
});


    // Schedule remaining reminders
    for (let i = 1; i < doseCount; i++) {
      setTimeout(async () => {
        transporter.sendMail({
          from: "tunusarapia@gmail.com",
          to: patient.email,
          subject: "SARAPIA HOSPITAL",
          html: `
            <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); font-family: Arial, sans-serif;">
              <div style="background: #f0ad4e; padding: 10px; text-align: center; color: white; font-size: 20px; font-weight: bold;">
                ⏰ TIME FOR TAKING DOSE IS NOW!!!
              </div>
              <div style="padding: 20px; color: #333; font-size: 16px;">
                <p>Dear <strong>${patient?.fullName || "Patient"}</strong>,</p>
                <p>It's time to take your next dose of medication.</p>
                <p><strong>Dose:</strong> ${patient?.dose || "Not specified"}</p>
                <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #f0ad4e;">
                  <ul>
                    <li>Drink plenty of water with your medicine.</li>
                    <li>Avoid skipping doses to ensure a speedy recovery.</li>
                    <li>Get enough rest and eat healthy meals.</li>
                    <li>If you experience side effects, consult your doctor immediately.</li>
                  </ul>
                </div>
              </div>
            </div>
          `,
        
        
        });

        await Patient.findByIdAndUpdate(patient._id, { smsSent: true });
        console.log(`Reminder ${i} sent to ${patient.email}`);
      }, i * intervalMs);
    }

    res.json({ message: "Treatment updated & reminders scheduled!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Patient History
app.get("/history", async (req, res) => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Patients Who Need a Dose
app.get("/nurse-dashboard", async (req, res) => {
  try {
    const patients = await Patient.find(
      { stay: "hospital" },
      "fullName wardNumber bedNumber dose dosed smsSent"
    );
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark Patient as Dosed
app.post("/mark-dosed/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Patient.findByIdAndUpdate(id, { dosed: true });
    res.json({ message: "Patient marked as dosed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reminder Cron Job
cron.schedule("0 8,20 * * *", async () => {
  try {
    const now = new Date();
    const patients = await Patient.find({ treatmentEnd: { $gte: now } });

    patients.forEach((patient) => {
      if (!patient.dose) return;

      let doseParts = patient.dose.split("x");
      if (doseParts.length < 2) return;

      let dosesPer12Hours = parseInt(doseParts[1]);
      if (isNaN(dosesPer12Hours) || dosesPer12Hours <= 0) return;

      let intervalMinutes = (12 * 60) / dosesPer12Hours;

      for (let i = 0; i < dosesPer12Hours; i++) {
        setTimeout(async () => {
          transporter.sendMail({
            from: "tunusarapia@gmail.com",
            to: patient.email,
            subject: "Medication Reminder",
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #d9534f;">Medication Reminder</h2>
                <p>Dear <strong>${patient?.fullName || "Patient"}</strong>,</p>
                <p>It's time to take your medicine!</p>
                <p><strong>Dose:</strong> ${patient?.dose || "Not specified"}</p>
                <p>Please follow the prescribed schedule to stay healthy.</p>
              </div>
            `,
          });

          await Patient.findByIdAndUpdate(patient._id, { smsSent: true });
          console.log(`Reminder sent to ${patient.email}`);
        }, i * intervalMinutes * 60 * 1000);
      }
    });

    console.log("Medication reminders scheduled successfully.");
  } catch (error) {
    console.error("Error sending reminders:", error.message);
  }
});

// Update Patient
app.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedPatient = await Patient.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedPatient) return res.status(404).json({ error: "Patient not found!" });
    res.json({ message: "Patient updated successfully!", updatedPatient });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Patient
app.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Patient.findByIdAndDelete(id);
    res.json({ message: "Patient deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
function logger(req,res,next){
console.log(req.originalUrl)
next()
}
// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

*/


const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const cors = require("cors");
const cron = require("node-cron");
const axios = require("axios");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// MongoDB connection Data base name and string connection
mongoose.connect("mongodb+srv://sara:malafiki@cluster0.ue2hgai.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
mongoose.connection.on("connected", () => {
  console.log("✅ MongoDB connected successfully (local)");
});
mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB connection error:", err);
});

// Patient schema
const patientSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  phone: String,
  patientId: { type: String, required: true, unique: true },
  age: Number,
  gender: String,
  doctorRoom: String,
  homeAddress: String,
  doctorId: String,
  disease: String,
  dose: String,
  treatmentEnd: Date,
  stay: String,
  wardNumber: String,
  createdAt: { type: Date, default: Date.now },
  smsSent: { type: Boolean, default: false },
  bedNumber: String,
  dosed: Boolean,
});

const Patient = mongoose.model("Patient", patientSchema);

// Email Setup
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for 465, false for 587
  auth: {
    user: 'tunusarapia@gmail.com',
    pass: 'hzyx ujlp wlju rplw'
  }
});
  

// Register Patient
app.post("/register", async (req, res) => {
  try {
    const newPatient = new Patient(req.body);
    await newPatient.save();
    res.status(201).json({ message: "Patient registered successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add/Update Treatment
// Add/Update Treatment
app.post("/treatment", async (req, res) => {
  try {
    const { patientId, doctorId, disease, dose, treatmentEnd, stay, wardNumber, bedNumber } = req.body;

    await Patient.findOneAndUpdate(
      { patientId },
      { doctorId, disease, dose, treatmentEnd, stay, wardNumber, bedNumber }
    );

    const patient = await Patient.findOne({ patientId });
    if (!patient || !patient.fullName || !patient.email) {
      return res.status(404).json({ error: "Patient data incomplete or not found!" });
    }

    console.log("Found patient for treatment:", patient.fullName);

    // Dose Parsing
    const doseParts = dose.toLowerCase().split("x");
    const timesPer12Hours = parseInt(doseParts[doseParts.length - 1]);
    if (isNaN(timesPer12Hours) || timesPer12Hours <= 0) {
      return res.status(400).json({ error: "Invalid dose format!" });
    }

    const intervalHours = 12 / timesPer12Hours;
    const intervalMs = intervalHours * 60 * 60 * 1000;

    // Immediate Email
    transporter.sendMail({
      from: "tunusarapia@gmail.com",
      to: patient.email,
      subject: "SARAPIA INTERNATIONAL HOSPITAL - MEDICATION",
      html: `
        <div style="max-width:600px;margin:auto;background:white;padding:20px;border-radius:10px;font-family:Arial;">
          <div style="background:#d9534f;padding:10px;text-align:center;color:white;font-size:20px;border-radius:10px 10px 0 0;">
            📌 Immediate Medication Dose
          </div>
          <div style="padding:20px;color:#333;">
            <p>Dear <strong>${patient.fullName}</strong>,</p>
            <p>It’s time to take your first dose of medication.</p>
            <p><strong>Medicine:</strong> ${patient.disease}</p>
            <p><strong>Dose:</strong> ${patient.dose}</p>
            <ul>
              <li>Drink water with your medicine.</li>
              <li>Do not skip doses.</li>
              <li>Eat healthy and rest well.</li>
            </ul>
          </div>
        </div>
      `,
    });

    // Immediate SMS to ESP32
    axios.post("http://192.168.141.155/send_sms", {
      phoneNumber: patient.phone,
      message: `FROM SARAPIA HOSPITAL Dear ${patient.fullName}, Medicine: ${patient.disease} time to take your first dose. Dose: ${patient.dose}.`,
    }).then(res => console.log("✅ SMS sent to ESP32")).catch(err => console.error("❌ SMS failed:", err.message));

    // 🔁 Reset dosed so nurse sees red button again
    await Patient.findByIdAndUpdate(patient._id, { smsSent: true, dosed: false });

    // Schedule next reminders
    for (let i = 1; i < timesPer12Hours; i++) {
      setTimeout(async () => {
        transporter.sendMail({
          from: "tunusarapia@gmail.com",
          to: patient.email,
          subject: "SARAPIA HOSPITAL",
          html: `
            <div style="max-width:600px;margin:auto;background:white;padding:20px;border-radius:10px;font-family:Arial;">
              <div style="background:#f0ad4e;padding:10px;text-align:center;color:white;font-size:20px;">
                ⏰ TIME FOR TAKING DOSE IS NOW!
              </div>
              <div style="padding:20px;color:#333;">
                <p>Dear <strong>${patient.fullName}</strong>,</p>
                <p>It's time to take your next dose of medication.</p>
                <p><strong>Medicine:</strong> ${patient.disease}</p>
                <p><strong>Dose:</strong> ${patient.dose}</p>
              </div>
            </div>
          `,
        });

        axios.post("http://192.168.141.155/send_sms", {
          phoneNumber: patient.phone,
          message: `FROM SARAPIA INTERNATIONAL HOSPITAL Dear ${patient.fullName},Medicine:${patient.disease}, take your dose now. Dose: ${patient.dose}.`,
        }).catch(err => console.error("❌ SMS resend failed:", err.message));

        // 🔁 Reset dosed so nurse sees red button again
        await Patient.findByIdAndUpdate(patient._id, { smsSent: true, dosed: false });

        console.log(`Reminder ${i} sent to ${patient.email}`);
      }, i * intervalMs);
    }

    res.json({ message: "Treatment updated & reminders scheduled!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// History of all patients
app.get("/history", async (req, res) => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Hospitalized Patients
app.get("/nurse-dashboard", async (req, res) => {
  try {
    const patients = await Patient.find({ stay: "hospital" });

    const now = new Date();
    const currentHour = now.getHours();

    const processed = patients.map(p => {
      let dueNow = false;
      if (p.dose) {
        const doseParts = p.dose.toLowerCase().split("x");
        const timesPer12 = parseInt(doseParts[doseParts.length - 1]);
        if (!isNaN(timesPer12) && timesPer12 > 0) {
          const intervalHours = 12 / timesPer12;

          // 8 AM and 8 PM base anchors
          const anchors = [8, 20]; 
          for (const anchor of anchors) {
            for (let i = 0; i < timesPer12; i++) {
              const reminderHour = anchor + i * intervalHours;
              const roundedNow = Math.round(currentHour);
              if (Math.abs(reminderHour - roundedNow) < 1) {
                dueNow = true;
                break;
              }
            }
          }
        }
      }

      return {
        _id: p._id,
        fullName: p.fullName,
        wardNumber: p.wardNumber,
        bedNumber: p.bedNumber,
        dose: p.dose,
        dosed: p.dosed,
        smsSent: p.smsSent,
        dueNow,
      };
    });

    res.json(processed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Mark as Dosed
app.post("/mark-dosed/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Patient.findByIdAndUpdate(id, { dosed: true });
    res.json({ message: "Patient marked as dosed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Scheduled 8am and 8pm email reminders
cron.schedule("0 8,20 * * *", async () => {
  try {
    const now = new Date();
    const patients = await Patient.find({ treatmentEnd: { $gte: now } });

    patients.forEach((patient) => {
      if (!patient.dose) return;

      const doseParts = patient.dose.toLowerCase().split("x");
      const timesPer12 = parseInt(doseParts[doseParts.length - 1]);
      if (isNaN(timesPer12) || timesPer12 <= 0) return;

      const intervalMin = (12 * 60) / timesPer12;

      for (let i = 0; i < timesPer12; i++) {
        setTimeout(() => {
          transporter.sendMail({
            from: "tunusarapia@gmail.com",
            to: patient.email,
            subject: "Medication Reminder",
            html: `
              <div style="max-width:600px;margin:auto;background:white;padding:20px;border-radius:10px;">
                <div style="background:#5bc0de;padding:10px;text-align:center;color:white;font-size:20px;">
                  ⏰ Time for your dose!
                </div>
                <div style="padding:20px;color:#333;">
                  <p>Dear <strong>${patient.fullName}</strong>,</p>
                  <p>It’s time to take your medication. Don’t forget!</p>
                  <p><strong>Medicine:</strong> ${patient.disease}</p>
                  <p><strong>Dose:</strong> ${patient.dose}</p>
                </div>
              </div>
            `,
          });

          axios.post("http://192.168.141.155/send_sms", {
            phoneNumber: patient.phone,
            message: `Reminder: Dear ${patient.fullName}, take your dose. Dose: ${patient.dose}.`,
          }).catch(err => console.error("❌ Scheduled SMS failed:", err.message));
        }, i * intervalMin * 60 * 1000);
      }
    });
  } catch (error) {
    console.error("❌ Error in cron job:", error.message);
  }
});


// Update Patient
app.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedPatient = await Patient.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedPatient) return res.status(404).json({ error: "Patient not found!" });
    res.json({ message: "Patient updated successfully!", updatedPatient });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Patient
app.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Patient.findByIdAndDelete(id);
    res.json({ message: "Patient deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
