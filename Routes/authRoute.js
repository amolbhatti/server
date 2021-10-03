const express = require("express");
const router = express.Router();

const {
  signup,
  confirmEmail,
  signin,
  confirmSignIn,
} = require("../controller/authControler");

router.post("/signup", signup);
router.post("/signinOtp", signin);
router.post("/verify", confirmEmail);
router.post("/confirmLogin", confirmSignIn);

module.exports = router;
