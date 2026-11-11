import bcrypt from "bcrypt";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import User from "../../models/user.model.js";
import Session from "../../models/session.model.js";
import tokenizer from "../../utils/tokenizer.js";
import { cookieOptions, clearCookieOptions } from "../../utils/cookie-options.js";
import { sendEmail } from "../../utils/email.sender.js"; 

// ==========================================
// ADMIN SIGN IN (Step 1: Password)
// ==========================================
export const adminSignIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    // 1. Find user and enforce strict Admin-only policy
    const admin = await User.findOne({ email });
    if (!admin || admin.role !== "admin") {
      return res.status(401).json({ success: false, message: "Invalid credentials or unauthorized access." });
    }

    // 2. Verify Password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials or unauthorized access." });
    }

    // 3. Generate 6-Digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash OTP before saving to database for security
    const hashedOtp = await bcrypt.hash(otp, 10);
    
    // Set OTP expiry to 10 minutes from now
    admin.verificationToken = hashedOtp;
    admin.verificationTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await admin.save();

    // 4. Send Premium Branded OTP Email
    await sendEmail({
      to: admin.email,
      subject: "Mritsna. - Admin OTP Verification",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 400px; margin: 0 auto; background-color: #f8f8f8; padding: 40px; text-align: center; border: 1px solid #e5e5e5;">
          <h2 style="color: #1a1a1a; letter-spacing: 0.2em; text-transform: uppercase; font-size: 18px; margin-bottom: 40px; font-weight: bold;">Mritsna<span style="opacity: 0.3">.</span></h2>
          <p style="color: #1a1a1a; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 15px; opacity: 0.5;">Identity Verification</p>
          <div style="background-color: transparent; border-bottom: 1px solid rgba(26,26,26,0.2); padding-bottom: 15px; margin-bottom: 30px;">
            <h1 style="color: #1a1a1a; font-size: 36px; letter-spacing: 0.3em; margin: 0; font-family: monospace;">${otp}</h1>
          </div>
          <p style="color: #1a1a1a; font-size: 10px; opacity: 0.4; letter-spacing: 0.1em; text-transform: uppercase;">This secure code expires in 10 minutes.<br/>Do not share this transmission.</p>
        </div>
      `,
    });

    // 5. Respond with next step
    return res.status(200).json({
      success: true,
      message: "Credentials verified. OTP sent to registered email.",
      nextStep: "verification"
    });

  } catch (error) {
    console.error("[Admin SignIn Error]:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ==========================================
// RESEND ADMIN OTP
// ==========================================
export const adminResendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required to resend OTP." });
    }

    const admin = await User.findOne({ email });
    if (!admin || admin.role !== "admin") {
      return res.status(404).json({ success: false, message: "Admin account not found." });
    }

    // Generate New OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    
    // Update Database
    admin.verificationToken = hashedOtp;
    admin.verificationTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await admin.save();

    // Send New Email
    await sendEmail({
      to: admin.email,
      subject: "Mritsna. - New Verification Code",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 400px; margin: 0 auto; background-color: #f8f8f8; padding: 40px; text-align: center; border: 1px solid #e5e5e5;">
          <h2 style="color: #1a1a1a; letter-spacing: 0.2em; text-transform: uppercase; font-size: 18px; margin-bottom: 40px; font-weight: bold;">Mritsna<span style="opacity: 0.3">.</span></h2>
          <p style="color: #1a1a1a; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 15px; opacity: 0.5;">Identity Verification (Resend)</p>
          <div style="background-color: transparent; border-bottom: 1px solid rgba(26,26,26,0.2); padding-bottom: 15px; margin-bottom: 30px;">
            <h1 style="color: #1a1a1a; font-size: 36px; letter-spacing: 0.3em; margin: 0; font-family: monospace;">${otp}</h1>
          </div>
          <p style="color: #1a1a1a; font-size: 10px; opacity: 0.4; letter-spacing: 0.1em; text-transform: uppercase;">This secure code expires in 10 minutes.<br/>Do not share this transmission.</p>
        </div>
      `,
    });

    return res.status(200).json({ success: true, message: "A new verification code has been dispatched." });

  } catch (error) {
    console.error("[Admin Resend OTP Error]:", error);
    return res.status(500).json({ success: false, message: "Internal server error while resending OTP." });
  }
};

// ==========================================
// ADMIN VERIFY OTP (Step 2: Tokens & Session)
// ==========================================
export const adminVerifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required." });
    }

    const admin = await User.findOne({ email });
    if (!admin || admin.role !== "admin") {
      return res.status(401).json({ success: false, message: "Unauthorized access." });
    }

    // 1. Check if OTP exists and hasn't expired
    if (!admin.verificationToken || admin.verificationTokenExpiry < new Date()) {
      return res.status(401).json({ success: false, message: "OTP has expired. Please log in again." });
    }

    // 2. Verify OTP Match
    const isOtpValid = await bcrypt.compare(otp.toString(), admin.verificationToken);
    if (!isOtpValid) {
      return res.status(401).json({ success: false, message: "Invalid OTP." });
    }

    // 3. Clear the OTP fields immediately to prevent reuse
    admin.verificationToken = undefined;
    admin.verificationTokenExpiry = undefined;
    await admin.save();

    // ==========================================
    // 4. THE HIGHLANDER RULE: Single Active Session
    // ==========================================
    await Session.updateMany(
      { user: admin._id },
      { isRevoked: true, expiry_at: new Date() }
    );

    // 5. Establish the New Single Device Session
    let deviceId = req.cookies.device_id || uuidv4();
    const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); 

    const newSession = await Session.create({
      user: admin._id,
      role: admin.role,
      device_id: deviceId,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
      expiry_at: expiryDate,
      isRevoked: false
    });

    // 6. Generate JWTs
    const accessToken = tokenizer.createAccessToken(admin._id, admin.role);
    const refreshToken = tokenizer.createRefreshToken(
      newSession._id,
      admin._id,
      admin.role,
      30 * 24 * 60 * 60 // 30 days in seconds
    );

    // 7. Plant the Cookies (Using Admin-specific names)
    res.cookie("admin_accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 }); // 15 mins
    res.cookie("admin_refreshToken", refreshToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 }); // 30 days
    res.cookie("device_id", deviceId, { ...cookieOptions, maxAge: 365 * 24 * 60 * 60 * 1000 }); // 1 year

    return res.status(200).json({
      success: true,
      message: "Admin authentication successful.",
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name
      }
    });

  } catch (error) {
    console.error("[Admin Verify Error]:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ==========================================
// ADMIN LOGOUT
// ==========================================
export const adminLogout = async (req, res) => {
  try {
    const userId = req.user;

    if (userId) {
      await Session.updateMany(
        { user: userId },
        { isRevoked: true, expiry_at: new Date() }
      );
    }

    // Explicitly clearing the admin-specific cookies
    res.clearCookie("admin_accessToken", clearCookieOptions);
    res.clearCookie("admin_refreshToken", clearCookieOptions);
    res.clearCookie("device_id", clearCookieOptions);

    return res.status(200).json({ success: true, message: "Admin logged out successfully." });
  } catch (error) {
    console.error("[Admin Logout Error]:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ==========================================
// GET ADMIN PROFILE
// ==========================================
export const getAdminProfile = async (req, res) => {
  try {
    const admin = await User.findById(req.user).select("-password -verificationToken -verificationTokenExpiry");

    if (!admin || admin.role !== "admin") {
      return res.status(404).json({ success: false, message: "Admin profile not found." });
    }

    return res.status(200).json({ success: true, admin });
  } catch (error) {
    console.error("[Admin Profile Error]:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};