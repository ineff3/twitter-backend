import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import s3 from './s3Client'

const getSignedUrl = async (imageName) => {
	const getObjectParams = {
		Bucket: process.env.BUCKET_NAME,
		Key: imageName,
	}
	const command = new GetObjectCommand(getObjectParams)
	const url = await getSignedUrl(s3, command, { expiresIn: 3600 })
	return url
}
