// ===== IMPORTS =====
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");

// ===== APP =====
const app = express();
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PATCH"],
    allowedHeaders: ["Content-Type"]
  })
);
app.use(express.json());

// ===== DATABASE =====
mongoose
  .connect("mongodb://127.0.0.1/autoflow")
  .then(() => console.log("MongoDB connected"))
  .catch(() => console.log("MongoDB not connected"));

// ===== MODEL =====
const Lead = mongoose.model("Lead", {
  name: String,
  email: String,
  business: String,
  city: String,
  whatsapp: String,
  status: { type: String, default: "pending" }
});

// ===== EMAIL =====
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "samifatiya0786@gmail.com",
    pass: "jkiwnppjsnucacgc"
  }
});

// ===== CREATE LEAD + ADMIN EMAIL =====
app.post("/api/leads", async (req, res) => {
  try {
    await Lead.create(req.body);

    await transporter.sendMail({
      from: "AutoFlow Labs <samifatiya0786@gmail.com>",
      to: "samifatiya0786@gmail.com",
      subject: "🚀 New Lead Received",
      text: `
New Lead Received

Name: ${req.body.name}
Email: ${req.body.email}
Business: ${req.body.business}
City: ${req.body.city}
WhatsApp: ${req.body.whatsapp}
`
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// ===== GET ALL LEADS =====
app.get("/api/leads", async (req, res) => {
  const leads = await Lead.find();
  res.json(leads);
});

// ===== APPROVE / REJECT + CLIENT EMAIL =====
app.patch("/api/leads/:id", async (req, res) => {
  try {
    const { status } = req.body;

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (status === "approved") {
      await transporter.sendMail({
        from: "AutoFlow Labs <samifatiya0786@gmail.com>",
        to: lead.email,
        subject: "🎉 Your Automation is Approved – AutoFlow Labs",
        html: `
<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background:#f4f4f4; font-family:Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:30px 0;">
          <table width="600" style="background:#ffffff; border-radius:8px; overflow:hidden;">
            <tr>
              <td style="background:#000; color:#fff; padding:20px; text-align:center;">
                <h1 style="margin:0;">AutoFlow Labs</h1>
                <p style="margin:5px 0 0;">Business Automation Experts</p>
              </td>
            </tr>

            <tr>
              <td style="padding:30px; color:#333;">
                <h2>Hi ${lead.name}, 👋</h2>

                <p>
                  Your automation request for
                  <b>${lead.business}</b> has been <b>approved</b>.
                </p>

                <p>
                  Our team will contact you shortly on WhatsApp:
                  <b>${lead.whatsapp}</b>
                </p>

                <div style="text-align:center; margin:30px 0;">
                  <a
                    href="https://wa.me/${lead.whatsapp}"
                    style="
                      background:#000;
                      color:#fff;
                      padding:14px 28px;
                      text-decoration:none;
                      border-radius:6px;
                      font-weight:bold;
                      display:inline-block;
                    "
                  >
                    Contact Us on WhatsApp
                  </a>
                </div>

                <p>
                  Regards,<br/>
                  <b>AutoFlow Labs Team</b>
                </p>
              </td>
            </tr>

            <tr>
              <td style="background:#f0f0f0; padding:15px; text-align:center; font-size:12px; color:#777;">
                © ${new Date().getFullYear()} AutoFlow Labs
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
        `
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Approve error:", error);
    res.status(500).json({ success: false });
  }
});

// ===== SERVER =====
app.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});
