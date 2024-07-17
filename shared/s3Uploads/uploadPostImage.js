import sharp from 'sharp'
import { uploadImageToBucket } from '../s3/s3BucketActions.js'

export const uploadPostImage = async (buffer, imageName, folder) => {
	if (!buffer || !imageName) {
		throw new NotFoundError('Buffer and imageName')
	}

	const sharpedBuffer = await sharp(buffer).toFormat('jpeg').toBuffer()

	await uploadImageToBucket(imageName, sharpedBuffer, 'image/jpeg', folder)
}
