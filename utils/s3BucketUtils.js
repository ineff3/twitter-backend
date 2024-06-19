import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
	GetObjectCommand,
	DeleteObjectCommand,
	PutObjectCommand,
} from '@aws-sdk/client-s3'
import s3 from './s3Client.js'

export const getSignedImageUrl = async (imageName) => {
	const getObjectParams = {
		Bucket: process.env.BUCKET_NAME,
		Key: imageName,
	}
	const command = new GetObjectCommand(getObjectParams)
	const url = await getSignedUrl(s3, command, { expiresIn: 3600 })
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
	imageMimetype
) => {
	const params = {
		Bucket: process.env.BUCKET_NAME,
		Key: imageName,
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
