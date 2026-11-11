export const validateRegister = (req, res, next) => {
  const { firstName, lastName, phoneCode, phoneNumber, email, password } = req.body;
  const errors = [];

  // 1. Name Validation
  if (!firstName || typeof firstName !== 'string' || firstName.trim().length < 2) {
    errors.push("First name must be at least 2 characters long.");
  }
  if (!lastName || typeof lastName !== 'string' || lastName.trim().length < 2) {
    errors.push("Last name must be at least 2 characters long.");
  }

  // 2. Contact Number Validation
  if (!phoneCode || typeof phoneCode !== 'string' || !phoneCode.startsWith('+')) {
    errors.push("A valid country dial code is required.");
  }
  // Ensures phone number is between 6 and 15 numeric digits
  const phoneRegex = /^\d{6,15}$/; 
  if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
    errors.push("Please provide a valid contact number (digits only).");
  }

  // 3. Email Validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push("Please provide a valid email address.");
  }

  // 4. Password Validation (Min 8 chars, 1 letter, 1 number)
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
  if (!password || !passwordRegex.test(password)) {
    errors.push("Password must be at least 8 characters long and contain at least one letter and one number.");
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      success: false, 
      message: errors[0], // Single main error for your UI toast notification
      errors: errors 
    });
  }

  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: "Both email and password are required." 
    });
  }

  next();
};