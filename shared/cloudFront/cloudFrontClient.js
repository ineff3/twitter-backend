import { CloudFrontClient } from '@aws-sdk/client-cloudfront'

const cloudFrontClient = new CloudFrontClient({
	credentials: {
		accessKeyId: process.env.ACCESS_KEY,
		secretAccessKey: process.env.SECRET_ACCESS_KEY,
	},
	region: process.env.BUCKET_REGION,
})

export default cloudFrontClient
