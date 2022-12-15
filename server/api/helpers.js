const multer = require('multer')
const path = require('path')
const fs = require('fs-extra')

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await fs.ensureDir('temp/')
    return cb(null, 'temp/')
  },

  // By default, multer removes file extensions so let's add them back
  filename: (req, file, cb) =>
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`,
    ),
})

const fileFilter = (req, file, cb) => {
  // Accept zip only
  if (!file.originalname.match(/\.(txt)$/)) {
    req.fileValidationError = 'Only txt files are allowed!'
    return cb(null, false)
  }

  return cb(null, true)
}

const uploadHandler = multer({ storage, fileFilter }).single('txt')

module.exports = {
  uploadHandler,
}
