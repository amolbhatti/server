const multer = require("multer");
const Image = require("../modal/imagesModel");
const Email = require("../utils/email");

const fs = require("fs");
const s3 = require("aws-sdk/clients/s3");

// s3 configuration
const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_Bucket_REGION;
const accessKeyId = process.env.AWS_USER_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

//S3 instance
const s3Instance = new s3({
  region,
  accessKeyId,
  secretAccessKey,
});

// uploade file using S3
const uploadFile = (file) => {
  const fileStream = fs.createReadStream(file.path);
  const uploadParams = {
    Bucket: bucketName,
    Body: fileStream,
    Key: file.filename,
  };
  fs.unlinkSync(`${__dirname}/../uploads/${file.filename}`);
  return s3Instance.upload(uploadParams).promise();
};

// download Image from S3
const downloadImage = (key) => {
  const downloadParams = {
    Key: key,
    Bucket: bucketName,
  };
  return s3Instance.getObject(downloadParams).createReadStream();
};

//Multer Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + req.user.id;
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});

// file filter to select only image files
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb("Not an image ! Please upload only images", false);
  }
};

const upload = multer({ storage: storage, fileFilter: multerFilter });

//middleware
module.exports.uploadImages = upload.single("image");

// uploads Image route function

module.exports.imageUpload = async (req, res) => {
  try {
    const file = await uploadFile(req.file);
    const obj = {
      key: file.key,
      link: file.Location,
      user: req.user.id,
      expiresAt: Date.now() + 60 * 60 * 1000,
    };

    const newImage = await Image.create(obj);

    res.json({
      success: "Success",
      data: newImage,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: "fail",
      message: "something went wrong",
    });
  }
};

// download Image route function

module.exports.getImage = async (req, res) => {
  const readStream = downloadImage(req.params.key);
  readStream.pipe(res);
};
