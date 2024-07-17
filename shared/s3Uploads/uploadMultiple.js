import { uploadPostImage } from './uploadPostImage.js'

//uploads array of files to s3 bucket and returns update array, with the appropriate newName to retrieve it from s3
export const uploadFilesArray = async (files, uploadPath) => {
	try {
		let filesArray = []
		if (files && files.length > 0) {
			filesArray = files.map((file) => ({
				...file,
				newName: new Date().toISOString() + file.originalname,
			}))

			await Promise.all(
				filesArray.map(async (file) => {
					try {
						await uploadPostImage(
							file.buffer,
							file.newName,
							uploadPath ? uploadPath : ''
						)
					} catch (error) {
						console.error(
							`Failed to upload file: ${file.originalname}`,
							error
						)
					}
				})
			)
		}
		return filesArray
	} catch (err) {
		console.log(err)
	}
}
