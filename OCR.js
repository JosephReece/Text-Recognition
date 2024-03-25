let OCRNetwork = PreloadNeuralNetwork("models/OCR A-Z 04-03-2023 NTD.net").then((Network) => { OCRNetwork = Network });
let InputResolution = 28;

async function ReadCharacter(ImageData) {
	let InputValues = await ImageDataToInput(ImageData);

	//Work out probabilities
	let Probabilities = OCRNetwork.RunSample(InputValues);

	for (var ProbabilityIndex = 0; ProbabilityIndex < Probabilities.length; ProbabilityIndex++) {
		Probabilities[ProbabilityIndex] = [Probabilities[ProbabilityIndex], OCRNetwork.OutputLabels[ProbabilityIndex]];
	}

	Probabilities.sort((Item1, Item2) => { return Item1[0] - Item2[0] }); //Only compare number parts
	Probabilities.reverse();

	//console.log(Probabilities[0][1] + ": " + (Probabilities[0][0] * 100).toFixed(2) + "%");
	return Probabilities[0][1];
}

async function ImageDataToInput(ImageData) {
	let PixelValues = ImageData.data;
	let InputValues = [];

	//Get Boundaries of Image
	let Boundaries = { Top: ImageData.height - 1, Bottom: 0, Left: ImageData.width - 1, Right: 0 };
	for (let PixelIndex = 0; PixelIndex < PixelValues.length; PixelIndex += 4) {
		let Sum = PixelValues[PixelIndex] + PixelValues[PixelIndex + 1] + PixelValues[PixelIndex + 2];

		//Check if pixel is white (rgba(0, 0, 0, 0) or rgba(255, 255, 255, 255))
		let IsWhite = ((Sum == 255 * 3 && PixelValues[PixelIndex + 3] == 255) || (Sum == 0 && PixelValues[PixelIndex + 3] == 0));
		if (IsWhite == false) { //If the pixel is black or grey...
			if (Boundaries.Top == ImageData.height - 1) {
				//If Top hasn't been set before, set Top
				Boundaries.Top = Math.floor((PixelIndex / 4) / ImageData.width);
			} else {
				//If Top has already been set, (re)set Bottom
				Boundaries.Bottom = Math.floor((PixelIndex / 4) / ImageData.width);
			}
			let x = (PixelIndex / 4) % ImageData.width;
			Boundaries.Left = Math.min(x, Boundaries.Left);
			Boundaries.Right = Math.max(x, Boundaries.Right);
		}
	}
	if (Boundaries.Top == ImageData.height - 1 && Boundaries.Bottom == 0 && Boundaries.Left == ImageData.width - 1 && Boundaries.Right == 0) {
		Boundaries = { Top: 0, Bottom: ImageData.height - 1, Left: 0, Right: ImageData.width - 1 }
	}

	//Crop Image
	let DrawCanvas = document.createElement("canvas");
	let DrawContext = DrawCanvas.getContext("2d");

	DrawCanvas.width = ImageData.width;
	DrawCanvas.height = ImageData.height;

	let Width = Boundaries.Right - Boundaries.Left + 1;
	let Height = Boundaries.Bottom - Boundaries.Top + 1;

	//Draw raw image to DrawCanvas
	DrawContext.putImageData(ImageData, 0, 0);

	//Create cropped image from DrawCanvas
	let CroppedImage = await createImageBitmap(DrawContext.getImageData(Boundaries.Left, Boundaries.Top, Width, Height));

	DrawCanvas.width = InputResolution;
	DrawCanvas.height = InputResolution;

	//Scale Image
	if (Width > Height) {
		//If the width is bigger than the height, scale the width to 32 and the height proportionally and position in the center
		let Scale = Height * (DrawCanvas.width / Width);
		DrawContext.drawImage(CroppedImage, 0, Math.floor((DrawCanvas.height - Scale) / 2), DrawCanvas.width, Scale);
	} else {
		//If the height is bigger than the width, scale the height to 32 and the width proportionally and position in the center
		let Scale = Width * (DrawCanvas.height / Height);
		DrawContext.drawImage(CroppedImage, Math.floor((DrawCanvas.width - Scale) / 2), 0, Scale, DrawCanvas.height);
	}

	PixelValues = DrawContext.getImageData(0, 0, DrawCanvas.width, DrawCanvas.height).data;
	for (let PixelIndex = 0; PixelIndex < PixelValues.length; PixelIndex += 4) {
		let Sum = PixelValues[PixelIndex] + PixelValues[PixelIndex + 1] + PixelValues[PixelIndex + 2];

		//Check if pixel is white (rgba(0, 0, 0, 0) or rgba(255, 255, 255, 255))
		let IsWhite = ((Sum == 255 * 3 && PixelValues[PixelIndex + 3] == 255) || (Sum == 0 && PixelValues[PixelIndex + 3] == 0));
		if (IsWhite) {
			InputValues.push(0);
		} else {
			InputValues.push(1);
			//InputValues.push(1 - (Sum / (3 * 255)));
		}
	}
	return InputValues;
}