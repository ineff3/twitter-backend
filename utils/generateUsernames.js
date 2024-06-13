const generateUsernamesArray = (firstName, arraySize) => {
	const arr = []

	for (let i = 0; i < arraySize; i++) {
		let numberSequence = ''
		for (let j = 0; j < 7; j++) {
			numberSequence += String(Math.round(Math.random() * 10))
		}
		arr.push(firstName + numberSequence)
	}
	return arr
}

export default generateUsernamesArray
