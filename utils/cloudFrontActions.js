import cloudFrontClient from './cloudFrontClient.js'
import { CreateInvalidationCommand } from '@aws-sdk/client-cloudfront'

const invalidateCloudFrontCache = async (imagePath) => {
	// invalidating cloudfront cache for deleted image
	const invalidationParams = {
		DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
		InvalidationBatch: {
			CallerReference: imagePath,
			Paths: {
				Quantity: 1,
				Items: ['/' + imagePath],
			},
		},
	}
	const invalidationCommand = new CreateInvalidationCommand(
		invalidationParams
	)
	await cloudFrontClient.send(invalidationCommand)
}

export default invalidateCloudFrontCache
