const { promisify } = require("util");
// const crypto = require("crypto");
// const JWT = require("jsonwebtoken");
const JWT = require("jsonwebtoken");

const User = require("../modal/userModel");
const Email = require("../utils/email");

// genrate JWT token
const createToken = (id) =>
  JWT.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

//Send JWT token
const createSendToken = (user, statusCode, req, res) => {
  const token = createToken(user._id);
  res.cookie("jwt", token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.header("x-forwarded-proto") === "https",
  });
  user.password = undefined;
  user.otp = undefined;
  user.expiretime = undefined;
  res.status(statusCode).json({
    status: "Success",
    token,
    data: {
      status: "success",
      user: user,
    },
  });
};

/// signup function
module.exports.signup = async (req, res) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });
    const email = new Email(newUser);
    await email.sendEmailConfirmation();
    res.status(500).json({
      success: "success",
      message:
        "an otp has been sent which is valid for 10 min only.please verify your email",
    });
  } catch (error) {
    res.status(500).json({
      success: "fail",
      message: "something went wrong",
    });
  }

  // const url = `${req.protocol}://${req.get("host")}/me`;
  // await new Email(newUser, url).sendWelcome();
  // createSendToken(newUser, 201, req, res);
};
// otp confirmation function
module.exports.confirmEmail = async (req, res) => {
  try {
    const filter = {
      otp: +req.body.otp,
      expiretime: {
        $gt: Date.now(),
      },
    };
    const update = {
      isVerified: true,
      otp: null,
      expiretime: null,
    };
    const user = await User.findOneAndUpdate(filter, update);
    if (!user) {
      res.status(500).json({
        success: "fail",
        message: "user dosent exist or invalid otp",
      });
    }
    res.status(200).json({
      success: "success",
      message: "verification successfull !! please login to continue",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: "fail",
      message: "something went wrong",
    });
  }
};

//sign in function
module.exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    // 1)check if email and password exists
    if (!email || !password) {
      return res.status(400).json({
        success: "fail",
        message: "Please provide email and password",
      });
    }
    const user = await User.findOne({ email });

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        success: "fail",
        message: "Incorrect email or password",
      });
    }

    if (!user.isVerified) {
      await user.deleteOne();
      return res.status(500).json({
        success: "fail",
        message: "user dosent exist",
      });
    }

    const filter = {
      email,
    };
    const update = {
      otp: Math.floor(1000 + Math.random() * 9000),
      expiretime: Date.now() + 10 * 60 * 1000,
    };
    const updateduser = await User.findOneAndUpdate(filter, update, {
      new: true,
    });

    const emailMessage = new Email(updateduser);
    await emailMessage.sendsignInOtp();

    res.status(200).json({
      success: "success",
      message: "an otp has been sent to your registered email",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: "fail",
      message: "something went wrong",
    });
  }
};

//sign in confirm using otp function
module.exports.confirmSignIn = async (req, res) => {
  try {
    const filter = {
      otp: +req.body.otp,
      expiretime: {
        $gt: Date.now(),
      },
    };
    const update = {
      otp: null,
      expiretime: null,
    };
    const user = await User.findOneAndUpdate(filter, update);
    if (!user) {
      res.status(500).json({
        success: "fail",
        message: " invalid otp",
      });
    }

    createSendToken(user, 201, req, res);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: "fail",
      message: "something went wrong",
    });
  }
};

// middleware to protect route
module.exports.protect = async (req, res, next) => {
  // 1) GETTING TOKEN
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return res.status(401).json({
      success: "fail",
      message: "You are not Logged in ! Please log in to get access",
    });
  }

  // 2) VERIFICATION OF TOKEN
  const decoded = await promisify(JWT.verify)(token, process.env.JWT_SECRET);
  // 3) CHECK IF USER EXISTS
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return res.status(401).json({
      success: "fail",
      message: "User no longer exist.",
    });
  }
  // 4)CHECK IF USER CHAGED PASSWORD AFTER ISSUING THE TOKEN

  req.user = freshUser;
  res.locals.user = freshUser;

  next();
};
