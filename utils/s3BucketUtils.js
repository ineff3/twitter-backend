import { getSignedUrl } from '@aws-sdk/cloudfront-signer'
import {
	GetObjectCommand,
	DeleteObjectCommand,
	PutObjectCommand,
} from '@aws-sdk/client-s3'
import s3 from './s3Client.js'

export const getSignedImageUrl = (imageName) => {
	const url = getSignedUrl({
		url: process.env.CLOUDFRONT_DOMAIN_NAME + imageName,
		dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
		privateKey: process.env.CLOUDFRONT_PRIVATE_KEY,
		keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
	})
	return url
}

export const deleteImageFromBucket = async (imageName) => {
	const params = {
		Bucket: process.env.BUCKET_NAME,
		Key: imageName,
	}
	const command = new DeleteObjectCommand(params)
	try {
		await s3.send(command)
		console.log('File deleted successfully')
	} catch (error) {
		console.error('Error deleting file', error)
		throw new Error('Error deleting file')
	}
}

export const uploadImageToBucket = async (
	imageName,
	imageBuffer,
	imageMimetype,
	folder
) => {
	const params = {
		Bucket: process.env.BUCKET_NAME,
		Key: folder ? `${folder}/${imageName}` : imageName,
		Body: imageBuffer,
		ContentType: imageMimetype,
	}
	const command = new PutObjectCommand(params)
	try {
		await s3.send(command)
		console.log('File uploaded successfully')
	} catch (error) {
		console.error('Error uploading file:', error)
		throw new Error('Error uploading file')
	}
}
