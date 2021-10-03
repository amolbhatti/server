const express = require("express");
const router = express.Router();
const {
  uploadImages,
  imageUpload,
  getImage,
} = require("../controller/imageController");
const { protect } = require("../controller/authControler");

router.get("/:key", getImage);
router.post("/imageUpload", protect, uploadImages, imageUpload);

module.exports = router;
