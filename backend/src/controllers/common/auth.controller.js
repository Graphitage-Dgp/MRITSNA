import bcrypt from "bcryptjs";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import User from "../../models/user.model.js";
import Session from "../../models/session.model.js";
import tokenizer from "../../utils/tokenizer.js";
import { cookieOptions, clearCookieOptions } from "../../utils/cookie-options.js";
import { sendEmail } from "../../utils/email.sender.js";

// --- INITIAL APP LOAD (CHECK AUTH) ---
export const checkAuth = async (req, res) => {
  try {
    const userId = req.user;

    // If there is no user ID, it is a Guest. Simply return null.
    if (!userId) {
      return res.status(200).json({ success: true, user: null });
    }

    const user = await User.findById(userId);

    // If the user doesn't exist or deactivated their account, treat as Guest
    if (!user || !user.isActive) {
      return res.status(200).json({ success: true, user: null });
    }

    // Return the clean user data to hydrate the frontend state
    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneCode: user.phoneCode,
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: user.role,
        isClaimed: user.isClaimed,
        isVerified: user.isVerified
      }
    });
  } catch (err) {
    console.error("[Auth Controller - Check Auth]:", err);
    return res.status(500).json({ success: false, message: "Server error checking auth." });
  }
};


// --- REGISTER & CLAIM SILENT ACCOUNT ---
export const register = async (req, res) => {
  try {
    // Destructuring exactly what the validator ensures is present
    const { firstName, lastName, phoneCode, phoneNumber, email, password } = req.body;

    let deviceId = req.cookies.device_id;
    if (!deviceId) {
      deviceId = uuidv4();
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      if (user.isClaimed) {
        return res.status(400).json({ success: false, message: "User with this email already exists." });
      }

      // Claiming the Silent Account with the new fields
      user.password = await bcrypt.hash(password, 10);
      user.firstName = firstName;
      user.lastName = lastName;
      user.phoneCode = phoneCode;
      user.phoneNumber = phoneNumber;
      user.isClaimed = true;
    } else {
      // Creating a brand new user
      const hashedPassword = await bcrypt.hash(password, 10);
      user = new User({
        firstName,
        lastName,
        phoneCode,
        phoneNumber,
        email,
        password: hashedPassword,
        isClaimed: true,
      });
    }

    // === NEW: AUTO-GENERATE & SEND OTP ON REGISTRATION ===
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    
    user.verificationToken = hashedOtp;
    user.verificationTokenExpiry = Date.now() + 15 * 60 * 1000; 
    
    await user.save(); // Save the user with their new credentials AND the OTP

    // Fire off the email via Resend
    await sendEmail({
      to: user.email,
      subject: "Welcome to Mritsna - Your Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">Welcome to Mritsna</h2>
          <p style="color: #555; font-size: 16px; text-align: center;">Use the verification code below to secure your account.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #111;">${otp}</span>
          </div>
          <p style="color: #888; font-size: 14px; text-align: center;">This code will expire in 15 minutes.</p>
        </div>
      `
    });
    // =======================================================

    const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const session = await Session.create({
      user: user._id, role: user.role, device_id: deviceId,
      ip_address: req.ip, user_agent: req.headers["user-agent"], expiry_at: expiryDate,
    });

    const remainingSeconds = 30 * 24 * 60 * 60;
    const accessToken = tokenizer.createAccessToken(user._id, user.role);
    const refreshToken = tokenizer.createRefreshToken(session._id, user._id, user.role, remainingSeconds);

    // --- NEW: Using user-specific cookie names ---
    res.cookie("user_accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie("user_refreshToken", refreshToken, { ...cookieOptions, maxAge: remainingSeconds * 1000 });
    res.cookie("device_id", deviceId, { ...cookieOptions, maxAge: 365 * 24 * 60 * 60 * 1000 });

    return res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email.",
      user: { 
        id: user._id, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        phoneCode: user.phoneCode,
        phoneNumber: user.phoneNumber,
        email: user.email, 
        role: user.role,
        isClaimed: user.isClaimed,
        isVerified: user.isVerified 
      }
    });

  } catch (error) {
    console.error("[Auth Controller - Register]:", error);
    res.status(500).json({ success: false, message: "Internal server error during registration." });
  }
};


// --- LOGIN ---
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    let deviceId = req.cookies.device_id || uuidv4();

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    // 1. CHECK LOCKOUT STATUS FIRST
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const waitMinutes = Math.ceil((user.lockoutUntil - new Date()) / 1000 / 60);
      return res.status(429).json({ 
        success: false, 
        message: `Too many failed attempts. Please try again in ${waitMinutes} minutes.` 
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "This account has been deactivated." });
    }

    if (!user.isClaimed || !user.password) {
      return res.status(401).json({ success: false, message: "This email has previous guest orders. Please create an account to view them." });
    }

    // 2. VERIFY PASSWORD
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      // 3A. WRONG PASSWORD: Increment strikes
      user.failedLoginAttempts += 1;
      
      if (user.failedLoginAttempts >= 5) {
        // Strike 5: Lock the account for 15 minutes
        user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();
        return res.status(429).json({ 
          success: false, 
          message: "Too many failed attempts. Account locked for 15 minutes." 
        });
      }
      
      await user.save();
      return res.status(401).json({ 
        success: false, 
        message: `Invalid email or password. You have ${5 - user.failedLoginAttempts} attempts left.` 
      });
    }

    // 3B. CORRECT PASSWORD: Reset strikes
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    await user.save();

    // 4. Proceed with normal session creation...
    const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const session = await Session.create({
      user: user._id, role: user.role, device_id: deviceId,
      ip_address: req.ip, user_agent: req.headers["user-agent"], expiry_at: expiryDate,
    });

    const remainingSeconds = 30 * 24 * 60 * 60; 
    const accessToken = tokenizer.createAccessToken(user._id, user.role);
    const refreshToken = tokenizer.createRefreshToken(session._id, user._id, user.role, remainingSeconds);

    // --- NEW: Using user-specific cookie names ---
    res.cookie("user_accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie("user_refreshToken", refreshToken, { ...cookieOptions, maxAge: remainingSeconds * 1000 });
    res.cookie("device_id", deviceId, { ...cookieOptions, maxAge: 365 * 24 * 60 * 60 * 1000 });

    return res.status(200).json({
      success: true, message: "Login successful.",
      user: { 
        id: user._id, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        phoneCode: user.phoneCode,
        phoneNumber: user.phoneNumber, 
        email: user.email, 
        role: user.role, 
        isClaimed: user.isClaimed, 
        isVerified: user.isVerified 
      }
    });

  } catch (error) {
    console.error("[Auth Controller - Login]:", error);
    res.status(500).json({ success: false, message: "Internal server error during login." });
  }
};


// --- LOGOUT ---
export const logout = async (req, res) => {
  try {
    const deviceId = req.cookies.device_id;
    if (req.user && deviceId) {
      await Session.deleteMany({ user: req.user, device_id: deviceId });
    }

    // --- NEW: Clearing user-specific cookie names ---
    res.clearCookie("user_accessToken", clearCookieOptions);
    res.clearCookie("user_refreshToken", clearCookieOptions);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully."
    });

  } catch (error) {
    console.error("[Auth Controller - Logout]:", error);
    res.status(500).json({ success: false, message: "Internal server error during logout." });
  }
};


// --- SIGN OUT OF ALL OTHER DEVICES ---
export const logoutAllOtherDevices = async (req, res) => {
  try {
    const currentDeviceId = req.cookies.device_id;
    const userId = req.user;

    if (!userId || !currentDeviceId) {
      return res.status(400).json({ success: false, message: "Invalid session." });
    }

    const deletedSessions = await Session.deleteMany({
      user: userId,
      device_id: { $ne: currentDeviceId } 
    });

    return res.status(200).json({
      success: true,
      message: `Successfully signed out of ${deletedSessions.deletedCount} other device(s).`
    });

  } catch (error) {
    console.error("[Auth Controller - Logout Other Devices]:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};


// --- DEACTIVATE ACCOUNT ---
export const deactivateAccount = async (req, res) => {
  try {
    const userId = req.user;

    const user = await User.findByIdAndUpdate(userId, { isActive: false }, { new: true });
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    await Session.deleteMany({ user: userId });

    // --- NEW: Clearing user-specific cookie names ---
    res.clearCookie("user_accessToken", clearCookieOptions);
    res.clearCookie("user_refreshToken", clearCookieOptions);

    return res.status(200).json({
      success: true,
      message: "Your account has been deactivated. You have been logged out."
    });

  } catch (error) {
    console.error("[Auth Controller - Deactivate Account]:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};


// --- SEND VERIFICATION OTP ---
export const sendVerificationEmail = async (req, res) => {
  try {
    const userId = req.user;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    if (user.isVerified) return res.status(400).json({ success: false, message: "Email is already verified." });

    // === Cooldown Logic ===
    if (user.verificationTokenExpiry) {
      const timeRemaining = user.verificationTokenExpiry.getTime() - Date.now();
      const fourteenMinutes = 14 * 60 * 1000;

      if (timeRemaining > fourteenMinutes) {
        const secondsToWait = Math.ceil((timeRemaining - fourteenMinutes) / 1000);
        return res.status(429).json({ 
          success: false, 
          message: `Please wait ${secondsToWait} seconds before requesting a new code.` 
        });
      }
    }

    // === Generate OTP ===
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    
    user.verificationToken = hashedOtp;
    user.verificationTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 Minutes
    await user.save();

    // === THE RESEND INTEGRATION ===
    const emailResult = await sendEmail({
      to: user.email,
      subject: "Your Mritsna Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">Welcome to Mritsna</h2>
          <p style="color: #555; font-size: 16px; text-align: center;">Use the verification code below to secure your account.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #111;">${otp}</span>
          </div>
          <p style="color: #888; font-size: 14px; text-align: center;">This code will expire in 15 minutes.</p>
        </div>
      `
    });

    if (!emailResult.success) {
      return res.status(500).json({ success: false, message: "Failed to send verification email. Please try again." });
    }

    return res.status(200).json({
      success: true,
      message: "A 6-digit verification code has been sent to your email."
    });

  } catch (error) {
    console.error("[Auth Controller - Send Verification OTP]:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};


// --- VERIFY EMAIL OTP ---
export const verifyEmail = async (req, res) => {
  try {
    const { otp } = req.body; 

    if (!otp) {
      return res.status(400).json({ success: false, message: "Verification code is missing." });
    }

    const userId = req.user;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    // 1. CHECK LOCKOUT STATUS FIRST
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const waitMinutes = Math.ceil((user.lockoutUntil - new Date()) / 1000 / 60);
      return res.status(429).json({ 
        success: false, 
        message: `Too many failed OTP attempts. Please wait ${waitMinutes} minutes.` 
      });
    }

    // 2. CHECK EXPIRY AND MATCH
    const hashedOtp = crypto.createHash("sha256").update(otp.toString()).digest("hex");
    
    const isValidOtp = user.verificationToken === hashedOtp && user.verificationTokenExpiry > Date.now();

    if (!isValidOtp) {
      // 3A. WRONG OTP: Increment strikes
      user.failedLoginAttempts += 1;
      
      if (user.failedLoginAttempts >= 5) {
        user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();
        return res.status(429).json({ 
          success: false, 
          message: "Too many failed attempts. OTP verification locked for 15 minutes." 
        });
      }

      await user.save();
      return res.status(400).json({ 
        success: false, 
        message: `Invalid or expired verification code. ${5 - user.failedLoginAttempts} attempts remaining.` 
      });
    }

    // 3B. CORRECT OTP: Reset strikes & Verify
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    user.failedLoginAttempts = 0; // Reset strikes
    user.lockoutUntil = null;     // Clear lockout
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email successfully verified. Thank you!",
      user: { 
        id: user._id, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        phoneCode: user.phoneCode,
        phoneNumber: user.phoneNumber, 
        email: user.email, 
        role: user.role, 
        isClaimed: user.isClaimed, 
        isVerified: user.isVerified 
      }
    });

  } catch (error) {
    console.error("[Auth Controller - Verify Email OTP]:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};


// --- CHANGE UNVERIFIED EMAIL & RESEND OTP ---
export const changeEmailAndResendOtp = async (req, res) => {
  try {
    const { newEmail } = req.body;
    const userId = req.user;

    if (!newEmail) return res.status(400).json({ success: false, message: "New email is required." });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    if (user.isVerified) return res.status(400).json({ success: false, message: "Account is already verified." });

    // Check if the new email belongs to someone else
    const emailExists = await User.findOne({ email: newEmail.toLowerCase() });
    if (emailExists && emailExists._id.toString() !== userId.toString()) {
      return res.status(400).json({ success: false, message: "This email is already in use by another account." });
    }

    // Cooldown check
    if (user.verificationTokenExpiry) {
      const timeRemaining = user.verificationTokenExpiry.getTime() - Date.now();
      const fourteenMinutes = 14 * 60 * 1000;
      if (timeRemaining > fourteenMinutes) {
        const secondsToWait = Math.ceil((timeRemaining - fourteenMinutes) / 1000);
        return res.status(429).json({ success: false, message: `Please wait ${secondsToWait} seconds.` });
      }
    }

    // Update Email
    user.email = newEmail.toLowerCase();

    // Generate New OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    
    user.verificationToken = hashedOtp;
    user.verificationTokenExpiry = Date.now() + 15 * 60 * 1000; 
    await user.save();

    // Send the email
    await sendEmail({
      to: user.email,
      subject: "Your New Mritsna Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">Verify Your New Email</h2>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #111;">${otp}</span>
          </div>
          <p style="color: #888; font-size: 14px; text-align: center;">This code will expire in 15 minutes.</p>
        </div>
      `
    });

    return res.status(200).json({
      success: true,
      message: "Email updated! A new 6-digit code has been sent.",
      user: { 
        id: user._id, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        phoneCode: user.phoneCode,
        phoneNumber: user.phoneNumber, 
        email: user.email, 
        role: user.role, 
        isClaimed: user.isClaimed, 
        isVerified: user.isVerified 
      }
    });

  } catch (error) {
    console.error("[Auth Controller - Change Email]:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};