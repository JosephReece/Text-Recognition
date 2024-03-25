//This module aims to break down an image before analysing it

async function GetHighlightedPixels() {
	let DrawCanvas = document.createElement("canvas");
	let DrawContext = DrawCanvas.getContext('2d');

	DrawCanvas.width = ImageToRead.width;
	DrawCanvas.height = ImageToRead.height;

	DrawContext.drawImage(ImageToRead, 0, 0);
	let ImageData = DrawContext.getImageData(0, 0, ImageToRead.width, ImageToRead.height);
	let PixelValues = ImageData.data;

	let HighlightCanvas = document.createElement("canvas");
	let HighlightContext = HighlightCanvas.getContext('2d');

	HighlightCanvas.width = HighlightOverlay.width;
	HighlightCanvas.height = HighlightOverlay.height;

	HighlightContext.drawImage(HighlightOverlay, 0, 0);
	let HighlightImageData = HighlightContext.getImageData(0, 0, HighlightOverlay.width, HighlightOverlay.height)
	let HighlightPixelValues = HighlightImageData.data;

	for (let Index = 0; Index < PixelValues.length; Index += 4) {
		//If there is no highlight (ie rgba values == (0, 0, 0, 0)), reset pixel
		if ((HighlightPixelValues[Index] + HighlightPixelValues[Index + 1] + HighlightPixelValues[Index + 2] + HighlightPixelValues[Index + 3]) == 0) {
			PixelValues[Index] = 0;
			PixelValues[Index + 1] = 0;
			PixelValues[Index + 2] = 0;
			PixelValues[Index + 3] = 0;
		}
	}

	ImageData.data = PixelValues;
	return await createImageBitmap(ImageData);
}

async function ScanImage(TextColour) {
	let DrawCanvas = document.createElement("canvas");
	let DrawContext = DrawCanvas.getContext('2d');

	DrawCanvas.width = ImageToRead.width;
	DrawCanvas.height = ImageToRead.height;

	DrawContext.drawImage(await GetHighlightedPixels(), 0, 0);
	let ImageData = DrawContext.getImageData(0, 0, ImageToRead.width, ImageToRead.height)
	let PixelValues = ImageData.data;

	let PointDifferenceTolerance = document.getElementById("PointDifferenceTolerance").value;
	for (let Index = 0; Index < PixelValues.length; Index += 4) {

		//Each channel of the highlighted pixel must be within a certain number of points of rgba of the selected colour to be accepted.
		let IsActive = true;
		for (let ChannelIndex = 0; ChannelIndex < 4; ChannelIndex++) {
			if (Math.abs(PixelValues[Index + ChannelIndex] - TextColour[ChannelIndex]) > PointDifferenceTolerance) {
				IsActive = false;
			}
		}

		if (IsActive == true) {
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

	//createImageBitmap(ImageData).then((ImageBitmap) => {
	//	LoadImage(ImageBitmap);
	//});

	/*let SectionIndex = 0;
	let DisplaySection = () => {
		createImageBitmap(Sections[SectionIndex].ImageData).then((Image) => {LoadImage(Image)});
		SectionIndex++;
		if (SectionIndex < Sections.length) {
			setTimeout(DisplaySection, 500);
		}
	}
	DisplaySection();*/

	let Sections = await GetSections(ImageData); //Returns array of imagedata and location for each character
	Sections.sort((Item1, Item2) => { return Item1.x - Item2.x }); //Only compare number parts

	let Text = "Text: ";
	for (let SectionIndex = 0; SectionIndex < Sections.length; SectionIndex++) {
		Text += await ReadCharacter(Sections[SectionIndex].ImageData);
	}

	return Text;
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
		let x = -1;
		let y = -1;

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

					if (x == -1) {
						x = WidthIndex + 0;
						y = HeightIndex + 0;
					}
				} else {
					SubImagePixelValues[PixelIndex] = 255;
					SubImagePixelValues[PixelIndex + 1] = 255;
					SubImagePixelValues[PixelIndex + 2] = 255;
					SubImagePixelValues[PixelIndex + 3] = 255;
				}
			}
		}
		SubImageData.data = SubImagePixelValues;
		SubImages.push({ ImageData: SubImageData, x: x, y: y });
	}

	return SubImages;
}