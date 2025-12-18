function Greyscale(ImageData) {
	let PixelValues = ImageData.data;

	let PointDifferenceTolerance = 50;
	for (let Index = 0; Index < PixelValues.length; Index += 4) {

		//Each channel of the highlighted pixel must be within 50 points of rgba of selected colour to be accepted.
		let IsWhite = false;
		for (let ChannelIndex = 0; ChannelIndex < 4; ChannelIndex++) {
			if (Math.abs(PixelValues[Index + ChannelIndex] - [0, 0, 0, 255][ChannelIndex]) > PointDifferenceTolerance) {
				IsWhite = true;
			}
		}

		if (IsWhite == false) {
			//Convert to black (active pixels)
			PixelValues[Index] = 0;
			PixelValues[Index + 1] = 0;
			PixelValues[Index + 2] = 0;
			PixelValues[Index + 3] = 255;
		} else {
			//If not, convert to white
			PixelValues[Index] = 255;
			PixelValues[Index + 1] = 255;
			PixelValues[Index + 2] = 255;
			PixelValues[Index + 3] = 255;
		}
	}

	ImageData.data = PixelValues;
	return ImageData;
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
	//DisplayCanvas.getContext("2d").putImageData(DrawContext.getImageData(0, 0, 32, 32), 0, 0);
	//console.log(DrawContext.getImageData(0, 0, 32, 32));

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

async function GetSections(ImageData) {
	let PixelValues = ImageData.data;
	let ScanMap = Array.from({ length: ImageData.height }, () => { return Array.from({ length: ImageData.width }, () => { return 0 }) });

	//Create a "ScanMap" (representation of pixels belonging to a group)
	//Uses breadth first search and queues

	let UnIDs = 0;
	for (let HeightIndex = 0; HeightIndex < ImageData.height; HeightIndex++) {
		for (let WidthIndex = 0; WidthIndex < ImageData.width; WidthIndex++) {
			let PixelIndex = 4 * (HeightIndex * ImageData.width + WidthIndex);

			//If the pixel is active...
			if ((PixelValues[PixelIndex] + PixelValues[PixelIndex + 1] + PixelValues[PixelIndex + 2]) == 0) {
				ScanMap[HeightIndex][WidthIndex] = -1; //-1 Indicates an active pixel that hasn't been assigned to a group
				UnIDs += 1;
			}
		}
	}

	class Queue {
		#Contents = [];
		Push(Item) {
			this.#Contents.push(Item);
		}
		Pop() {
			return this.#Contents.splice(0, 1)[0];
		}
		Peek() {
			return this.#Contents[0];
		}
		GetLength() {
			return this.#Contents.length;
		}
		GetAll() {
			return this.#Contents;
		}
	}

	let CurrentID = 0;
	while (UnIDs > 0) { //Keep searching if there exists undiscovered nodes.
		CurrentID += 1;
		let StartHeightIndex = Math.floor(ScanMap.flat().indexOf(-1) / ImageData.width);
		let StartWidthIndex = ScanMap.flat().indexOf(-1) % ImageData.width;

		let SearchQueue = new Queue();
		SearchQueue.Push([StartHeightIndex, StartWidthIndex])

		UnIDs -= 1;
		ScanMap[StartHeightIndex][StartWidthIndex] = Number(CurrentID); //By value

		while (SearchQueue.GetLength() > 0) {
			let CurrentPixelPosition = SearchQueue.Pop();

			for (let DeltaHeight = -1; DeltaHeight <= 1; DeltaHeight++) {
				for (let DeltaWidth = -1; DeltaWidth <= 1; DeltaWidth++) {
					let AdjacentHeight = CurrentPixelPosition[0] + DeltaHeight;
					let AdjacentWidth = CurrentPixelPosition[1] + DeltaWidth;

					//Check adjacent pixel isn't out of bounds or isn't the current pixel.
					let IsOutOfBounds = (AdjacentHeight < 0) || (AdjacentWidth < 0) || (AdjacentHeight >= ScanMap.length || AdjacentWidth >= ScanMap[0].length);
					if ((DeltaWidth == 0 && DeltaHeight == 0) || IsOutOfBounds) {
						continue;
					}

					//Check adjacent pixel's id
					if (ScanMap[AdjacentHeight][AdjacentWidth] == -1) {
						UnIDs -= 1;
						ScanMap[AdjacentHeight][AdjacentWidth] = Number(CurrentID);
						SearchQueue.Push([AdjacentHeight, AdjacentWidth]);
					} else {
						continue;
					}
				}
			}
		}
	}

	let DrawCanvas = document.createElement("canvas");
	let DrawContext = DrawCanvas.getContext('2d');

	let SubImages = [];
	for (let ID = 1; ID <= CurrentID; ID++) {
		DrawCanvas.width = ScanMap[0].length;
		DrawCanvas.height = ScanMap.length;

		let SubImageData = DrawContext.getImageData(0, 0, ScanMap[0].length, ScanMap.length);
		let SubImagePixelValues = SubImageData.data;
		for (let HeightIndex = 0; HeightIndex < ScanMap.length; HeightIndex++) {
			for (let WidthIndex = 0; WidthIndex < ScanMap[0].length; WidthIndex++) {
				let PixelIndex = 4 * (HeightIndex * ScanMap[0].length + WidthIndex);
				if (ScanMap[HeightIndex][WidthIndex] == ID) {
					SubImagePixelValues[PixelIndex] = 0;
					SubImagePixelValues[PixelIndex + 1] = 0;
					SubImagePixelValues[PixelIndex + 2] = 0;
					SubImagePixelValues[PixelIndex + 3] = 255;
				} else {
					SubImagePixelValues[PixelIndex] = 255;
					SubImagePixelValues[PixelIndex + 1] = 255;
					SubImagePixelValues[PixelIndex + 2] = 255;
					SubImagePixelValues[PixelIndex + 3] = 255;
				}
			}
		}
		SubImageData.data = SubImagePixelValues;
		SubImages.push(SubImageData);
	}

	return SubImages;
}