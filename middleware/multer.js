const multer = require("multer");
const storage = multer.memoryStorage(); // RAM üzerinde geçici tutma

const upload = multer({ storage });
module.exports = upload;
