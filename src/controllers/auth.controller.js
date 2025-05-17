const AuthModel = require("../model/auth.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utilities/mailService");
const ProductsModel = require("../model/purchase.model");
const AdminUsers = require("../model/adminUsers.model");
const ejs = require("ejs");
const path = require("path");
const { sendSms } = require("../utilities/twilio");
const generateOTP = require("../utilities/otp");
const {
  connectRedis,
  setUserOtp,
  getUserOtp,
  delOtp,
} = require("../utilities/redis");

const authController = {
  login: async (req, res) => {
    try {
      const user = await AuthModel.fetchUser(req.body);
      let password = req.body.password?.trim();
      if (user.length) {
        const isPasswordMatched = await bcrypt.compare(
          password,
          user[0].password
        );
        if (isPasswordMatched) {
          const token = jwt.sign(
            { id: user[0].id, role: "customer" },
            process.env.JWT_SECRET,
            {
              expiresIn: "1d",
            }
          );
          delete user[0].password;
          const product = await ProductsModel.fetchLastPurchaseById(user[0].id);

          return res.status(200).json({
            message: "Login successful",
            token: token,
            user: user[0],
            lastPurchase: product ?? null,
          });
        } else {
          return res.status(200).json({
            message: "Email or password is incorrect",
          });
        }
      } else {
        return res.status(200).json({
          message: "User does not exist",
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(200).json({
        message:
          "We are currently experiencing technical difficulties. Please try again later.",
      });
    }
  },
  getUserByAccesstoken: async (req, res) => {
    try {
      const token = req.headers["x-auth-token"];
      if (!token) {
        return res.status(403).send({ error: "No token provided" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;

      const user = await AuthModel.fetchUserById(userId);
      if (user.length) {
        delete user[0].password;
        const product = await ProductsModel.fetchLastPurchaseById(user[0].id);
        return res.status(200).json({
          message: "Login successful",
          token: token,
          user: user[0],
          lastPurchase: product ?? null,
        });
      } else {
        return res.status(404).json({
          message: "User does not exist",
        });
      }
    } catch (error) {
      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  },
  buySummary: async (req, res) => {
    try {
      const token = req.headers["x-auth-token"];
      if (!token) {
        return res.status(403).send({ error: "No token provided" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;

      const user = await AuthModel.fetchUserById(userId);
      if (user.length) {
        delete user[0].password;
        const product = await ProductsModel.fetchLastPurchaseById(user[0].id);
        const earning = await ProductsModel.totalEarning(user[0].id);
        return res.status(200).json({
          message: "Account summary",
          wallet_balance: user[0].current_balance ?? 0,
          total_earning: earning[0].total_earning ?? 0,
          invested_balance: product?.purchase_amount ?? 0,
          today_earning:
            (product?.profited_amount ?? 0) - (product?.purchase_amount ?? 0),
        });
      } else {
        return res.status(404).json({
          message: "User does not exist",
        });
      }
    } catch (error) {
      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  addUser: async (req, res) => {
    try {
      const { userName, email, password, refCode, phone_number } = req.body;
      // const referredId = await AuthModel.fetchUserByReferenceCode(refCode);
      // if (refCode && !referredId.length) {
      //   return res.status(400).json({
      //     message: "Invalid Reference Code!!",
      //   });
      // }
      // const referred_by = referredId?.[0]?.id ?? null;
      const isUserExist = await AuthModel.fetchUser(req.body);
      if (isUserExist.length) {
        return res.status(200).json({
          message: "User already exist",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      req.body.password = hashedPassword;
      const userObj = new AuthModel(req.body);
      const user = await AuthModel.addUser(userObj);
      // const token = jwt.sign({ id: user.insertId, role: "customer" }, process.env.JWT_SECRET, { expiresIn: "1h" });
      const otp = generateOTP();

      // Generate Otp and send to email or phone number

      // const verificationLink = `${process.env.API_URL}/api/auth/verify-email?token=${token}`;
      if (req.body.email) {
        const templatePath = path.join(
          __dirname,
          "../templates/verifyAccountTemplate.ejs"
        );
        const html = await ejs.renderFile(templatePath, { otp });

        await sendEmail(email, "Verification Email", null, html);
        return res.status(201).json({
          message: "Verification OTP has been sent to your email address",
        });
      } else {
        const otp_body = {
          message: `Your otp for registration is ${otp}`,
          number: phone_number,
        };
        sendSms(otp_body);
        return res.status(201).json({
          message: "Verification OTP has been sent to your mobile_number",
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(200).json({
        message:
          "We are currently experiencing technical difficulties. Please try again later.",
      });
    }
  },

  forgetPassword: async (req, res) => {
    try {
      const { email } = req.body;
      const user = await AuthModel.fetchUser(email);
      if (user.length) {
        const token = jwt.sign(
          { id: user[0].id, role: "customer" },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );
        const otp = generateOTP();
        const userId = user.id;
        await setUserOtp(userId,otp);
        // const verificationLink = `${process.env.WEB_APP_URL}/set-password?token=${token}`;
        const templatePath = path.join(
          __dirname,
          "../templates/resetTemplate.ejs"
        );
        const html = await ejs.renderFile(templatePath, { otp });

        await sendEmail(email, "Reset Password", null, html);

        return res.status(200).json({
          message: "Password reset otp has been sent to your email address.",
        });
      } else {
        return res.status(200).json({
          message: "User does not exist",
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(200).json({
        message:
          "We are currently experiencing technical difficulties. Please try again later.",
      });
    }
  },

  verifyEmail: async (req, res) => {
    try {
      const { token } = req.query;

      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Update the user status in the database
      const userId = decoded.id;
      const is_verified = true;
      await AuthModel.update(userId, { is_verified });

      // Redirect to the web app with a token (optional)
      const webAppRedirectURL = `${process.env.WEB_APP_URL}?token=${token}`;
      return res.redirect(webAppRedirectURL);
    } catch (error) {
      return res.status(400).send({
        message: "Invalid token",
        error: error.message,
      });
    }
  },
  resendVerifyEmail: async (req, res) => {
    try {
      const { email } = req.body;
      const isUserExist = await AuthModel.fetchUser(email);
      if (isUserExist.length === 0) {
        return res.status(400).json({
          message: "User not exist, Incorrect email",
        });
      }

      const token = jwt.sign(
        { id: isUserExist[0].id, role: "customer" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      // Create a verification link
      const verificationLink = `${process.env.API_URL}/api/auth/verify-email?token=${token}`;

      // Send email with the verification link
      const data = await sendEmail(
        email,
        "Verification Email",
        `Click the link to verify your email: ${verificationLink}`
      );
      return res.status(201).json({
        message: "Verification Email has been sent to your email address",
      });
    } catch (error) {
      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  fetchUser: async (req, res) => {
    try {
      const userId = req.userId;
      const user = await AuthModel.fetchUserById(userId);
      if (user.length === 0) {
        return res.status(404).json({
          message: "User does not exist",
        });
      } else {
        delete user[0].password;
        const product = await ProductsModel.fetchProduct(user[0].id);

        user[0].lastPurchase = product ?? null;

        return res.status(200).json(user);
      }
    } catch (error) {
      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  updatePassword: async (req, res) => {
    try {
      const { current_password, new_password } = req.body;
      const id = req.userId;
      const userExist = await AuthModel.fetchUserById(id);
      if (userExist.length === 0) {
        return res.status(404).json({
          message: "User does not exist",
        });
      }
      const isPasswordMatched = await bcrypt.compare(
        current_password,
        userExist[0].password
      );
      if (!isPasswordMatched) {
        return res.status(400).json({
          message: "Current password is incorrect",
        });
      }
      const hashedPassword = await bcrypt.hash(new_password, 10);
      const user = await AuthModel.updatePassword(id, {
        password: hashedPassword,
      });
      if (user.affectedRows === 0) {
        return res.status(400).json({
          message: "Unable to update password",
        });
      }
      return res.status(200).json({
        message: "Password updated successfully",
      });
    } catch (error) {
      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  },
  getReference: async (req, res) => {
    try {
      const id = req.userId;
      const reference = await AuthModel.getReference(id);
      const user = await AuthModel.fetchUserById(id);
      if (user.length) {
        return res.status(200).json({
          invitees: reference,
          code: user[0].reference_code,
        });
      } else {
        return res.status(400).json({
          message: "Unable to fetch reference",
        });
      }
    } catch (error) {
      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  adminLogin: async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await AdminUsers.fetchAdminUser(email);
      if (user.length) {
        const isPasswordMatched = await bcrypt.compare(
          password,
          user[0].password
        );
        if (isPasswordMatched) {
          const token = jwt.sign(
            { id: user[0].id, role: "admin" },
            process.env.JWT_SECRET,
            {
              expiresIn: "1d",
            }
          );
          delete user[0].password;

          return res.status(200).json({
            token: token,
            user: user[0],
          });
        } else {
          return res.status(401).json({
            message: "Email or password is incorrect",
          });
        }
      } else {
        return res.status(404).json({
          message: "User does not exist",
        });
      }
    } catch (error) {
      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { password,otp } = req.body;
      const token = req.query.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;
      const hashedPassword = await bcrypt.hash(password, 10);

      const {success} = getUserOtp(userId,otp);
      if(success){
        const user = await AuthModel.updatePassword(userId, {
          password: hashedPassword,
        });
        if (user.affectedRows === 0) {
          return res.status(400).json({
            message: "Unable to update password",
          });
        }
        return res.status(200).json({
          message: "Password updated successfully",
        });

      }
      else{
        return res.status(500).json({
          message: "Otp might have expired",
          error: error.message,
        });
      }



    } catch (error) {
      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  },
  verifyOtp: async (req, res) => {
    try {
      const { otp } = req.body;
      const token = req.query.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;

      const { success } = await getUserOtp(userId, otp);

      if (success) {
        await delOtp(userId);
        const result = await AuthModel.updateIsVerified(userId);

        return res.status(200).json({
          message: "OTP verified successfully",
        });
      } else {
        return res.status(400).json({
          message: "OTP verification failed",
        });
      }
    } catch (error) {
      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  },
  resendOtp: async (req, res) => {
    try {
      const token = req.query.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;

      // Fetch user from DB
      const user = await AuthModel.findUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate a new OTP
      const otp = generateOTP();

      // Store the OTP in Redis
      await setUserOtp(userId, otp);

      // Send OTP based on availability of contact info
      if (user.phone_number) {
        await sendSms({
          number: user.phone_number,
          message: `Your OTP is: ${otp}`,
        });
      } else if (user.email) {
        const templatePath = path.join(
          __dirname,
          "../templates/verifyAccountTemplate.ejs"
        );
        const html = await ejs.renderFile(templatePath, { otp });

        await sendEmail(email, "Verification Email", null, html);
      } else {
        return res.status(400).json({ message: "User has no phone or email" });
      }

      return res.status(200).json({ message: "OTP resent successfully" });
    } catch (error) {
      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  },
};

module.exports = authController;
