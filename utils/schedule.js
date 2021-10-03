const Images = require("../modal/imagesModel");
const User = require("../modal/userModel");
const Email = require("./email");

module.exports.task = async (req, res) => {
  const IMAGES = await Images.find({
    expiresAt: {
      $lt: Date.now(),
    },
  });

  if (!IMAGES) return;

  IMAGES.forEach(async (element) => {
    const user = await User.findById(element.user);
    const email = new Email(user);
    email.sendExpiredImage(element.key);
  });

  if (res) {
    res.status(200).json({
      message: "success",
    });
  }
  console.log("done");
};
