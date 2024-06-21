import multer from 'multer'

const storage = (path) =>
	multer.diskStorage({
		destination: (req, file, cb) => {
			cb(null, `./uploads/${path}`)
		},
		filename: (req, file, cb) => {
			cb(null, new Date().toISOString() + file.originalname)
		},
	})
const fileFilter = (req, file, cb) => {
	if (
		file.mimetype === 'image/jpeg' ||
		file.mimetype === 'image/png' ||
		file.mimetype === 'image/jpg' ||
		file.mimetype === 'image/webp'
	) {
		cb(null, true)
	} else {
		cb(null, false)
	}
}
const upload = (path) =>
	multer({
		// storage: storage(path),
		limits: {
			fileSize: 1024 * 1024 * 3, //3MB
		},
		fileFilter: fileFilter,
	})

export default upload
