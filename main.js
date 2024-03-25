var ImageToRead = null;
var HighlightOverlay = null;

var DrawDetails = { IsDrawing: false, Mode: "Highlight", x: 0, y: 0 };

function Initalise() {
	document.getElementById("ImageDisplay").style.imageRendering = "pixelated";

	//Display a test image using the fetch api
	fetch("/sample images/LOREM IPSUM.jpg")
		.then(Response => Response.blob())
		.then(Blob => createImageBitmap(Blob)
			.then(ImageBitmap => { LoadImage(ImageBitmap) }))

	document.getElementById("ImageDisplay").addEventListener("mousedown", () => {
		DrawDetails.IsDrawing = true;
		if (DrawDetails.Mode == "SelectColour") {
			let VirtualCanvas = document.createElement("canvas");
			let VirtualContext = VirtualCanvas.getContext('2d');

			VirtualCanvas.width = ImageToRead.width;
			VirtualCanvas.height = ImageToRead.height;

			VirtualContext.drawImage(ImageToRead, 0, 0);
			let Pixel = VirtualContext.getImageData(DrawDetails.x, DrawDetails.y, 1, 1).data;

			ScanImage(Pixel).then((Text) => {
				let TextOut = document.getElementById("TextOut");
				TextOut.innerText = Text;
			});

			DrawDetails.Mode = "Highlight";
			document.getElementById("ImageDisplay").style.cursor = "default";
		}
	});

	document.getElementById("ImageDisplay").addEventListener("mousemove", async (Event) => {
		if (ImageToRead == null) {
			return;
		}

		let DrawCanvas = document.getElementById("ImageDisplay");

		DrawDetails.x = Math.round((Event.clientX - DrawCanvas.getBoundingClientRect().left) * (DrawCanvas.width / DrawCanvas.clientWidth) - .5);
		DrawDetails.y = Math.round((Event.clientY - DrawCanvas.getBoundingClientRect().top) * (DrawCanvas.height / DrawCanvas.clientHeight) - .5);

		if (DrawDetails.Mode == "Highlight") {
			let HighlightCanvas = document.createElement("canvas");
			let HighlightContext = HighlightCanvas.getContext('2d');

			HighlightCanvas.width = ImageToRead.width;
			HighlightCanvas.height = ImageToRead.height;

			//If mouse is down
			if (DrawDetails.IsDrawing) {
				HighlightContext.drawImage(HighlightOverlay, 0, 0, HighlightCanvas.width, HighlightCanvas.height);

				HighlightContext.beginPath();
				HighlightContext.fillStyle = "rgb(255, 255, 0)";
				HighlightContext.arc(DrawDetails.x, DrawDetails.y, document.getElementById("HighlightSize").value, 0, 2 * Math.PI);
				HighlightContext.fill();

				DrawDetails.IsDrawing = false;
				let ImageData = HighlightContext.getImageData(0, 0, HighlightCanvas.width, HighlightCanvas.height);
				let PixelValues = ImageData.data;
				for (let PixelIndex = 0; PixelIndex < PixelValues.length; PixelIndex += 4) {
					if (PixelValues[PixelIndex + 3] != 0) {
						PixelValues[PixelIndex + 3] = parseInt(2.55 * 50); //20% opacity
					}
				}
				HighlightOverlay = await createImageBitmap(ImageData, 0, 0, HighlightCanvas.width, HighlightCanvas.height);
				DrawDetails.IsDrawing = true;
			}

			UpdateImage()
		}
	});

	document.getElementById("ImageDisplay").addEventListener("mouseup", () => {
		DrawDetails.IsDrawing = false;
		UpdateImage()
	});
}

function ScanImageForText() {
	if (DrawDetails.Mode == "Highlight") {
		let TextOut = document.getElementById("TextOut");
		TextOut.innerText = "Click on the image to select the colour of the text you wish to scan.";

		document.getElementById("ImageDisplay").style.cursor = "crosshair";
		DrawDetails.Mode = "SelectColour";
	} else if (DrawDetails.Mode == "SelectColour") {
		let TextOut = document.getElementById("TextOut");
		TextOut.innerText = "";

		document.getElementById("ImageDisplay").style.cursor = "default";
		DrawDetails.Mode = "Highlight";
	}

}

async function ResetHighlightOverlay() {
	let BlankImageData = new ImageData(ImageToRead.width, ImageToRead.height);
	//BlankImageData.data = new Uint8ClampedArray(Array.from({ length: ImageToRead.width * ImageToRead.height * 4 }, () => 0));
	HighlightOverlay = await createImageBitmap(BlankImageData);
	UpdateImage();
}

async function LoadImage(ImageBitmap) {
	ImageToRead = ImageBitmap;
	await ResetHighlightOverlay();
	UpdateImage();
}

function UpdateImage() {
	let DrawCanvas = document.getElementById("ImageDisplay");
	let DrawContext = DrawCanvas.getContext('2d');

	//Clear Canvas
	DrawContext.clearRect(0, 0, DrawCanvas.width, DrawCanvas.height);
	DrawCanvas.width = ImageToRead.width;
	DrawCanvas.height = ImageToRead.height;

	//Draw Image
	DrawContext.drawImage(ImageToRead, 0, 0);

	//Add Highlights
	if (HighlightOverlay != null) {
		DrawContext.drawImage(HighlightOverlay, 0, 0);
	}
}

function PopUp(CloseEvent, Header, Elements) {
	let PopUp = document.createElement("div");
	PopUp.id = "PopUp";
	document.body.appendChild(PopUp);

	let PopUpContent = document.createElement("div");
	PopUpContent.id = "PopUpContent";
	PopUp.appendChild(PopUpContent);

	let PopUpClose = document.createElement("span");
	PopUpClose.id = "PopUpClose";
	PopUpClose.innerText = "×";

	let PopUpHeader = document.createElement("h1");
	PopUpHeader.id = "PopUpHeader";
	PopUpHeader.innerText = Header;

	PopUpContent.appendChild(PopUpClose);
	PopUpContent.appendChild(PopUpHeader);
	for (let Index = 0; Index < Elements.length; Index++) {
		PopUpContent.appendChild(Elements[Index]);
	}

	//When the user clicks PopUpClose, destroy PopUp.
	PopUpClose.onclick = function() {
		CloseEvent();
		document.body.removeChild(PopUp);
	}

	//When the user clicks off PopUp, destroy PopUp.
	window.onclick = function(Event) {
		if (Event.target == PopUp) {
			CloseEvent();
			document.body.removeChild(PopUp);
		}
	}
}

async function LoadImageUpload() {
	let Upload = document.createElement('input');
	Upload.type = "file";
	//Upload.accept = ".jpg";
	Upload.click();

	Upload.addEventListener("change", function() {
		createImageBitmap(Upload.files[0]).then(ImageBitmap => {
			LoadImage(ImageBitmap);
		});
	});
}

async function LoadImageCamera() {

	await navigator.mediaDevices.getUserMedia({ video: true });

	let CameraLabel = document.createElement("label");
	CameraLabel.id = "CameraLabel";
	CameraLabel.setAttribute("for", "CameraOptions");
	CameraLabel.innerText = "Available Cameras: ";

	let CameraOptions = document.createElement("select");
	CameraOptions.name = "CameraOptions";
	CameraOptions.id = "CameraOptions";

	CameraOptions.onchange = async () => {
		let DeviceId = document.getElementById("CameraOptions").value;
		if (DeviceId == "NoCamera") {
			document.getElementById("VideoPlayer").srcObject = null;
		} else {
			let Constraints = { video: { deviceId: { exact: DeviceId } } };
			document.getElementById("VideoPlayer").srcObject = await navigator.mediaDevices.getUserMedia(Constraints);
		}
	}

	let VideoPlayer = document.createElement("video");
	VideoPlayer.id = "VideoPlayer";
	VideoPlayer.setAttribute("playsinline", "true");
	VideoPlayer.autoplay = "true";

	let CapturePhoto = document.createElement("button");
	CapturePhoto.id = "CapturePhoto";
	CapturePhoto.innerText = "Capture Photo";
	CapturePhoto.onclick = TakePhoto;

	//Loop through devices, then add them to a new "CameraSelect" option
	await navigator.mediaDevices.enumerateDevices().then((MediaDevices) => {
		let CameraIndex = 1;

		let FirstOption = document.createElement('option');
		FirstOption.innerText = "No Camera";
		FirstOption.value = "NoCamera";
		FirstOption.selected = true;
		//FirstOption.disabled = "disabled";
		CameraOptions.appendChild(FirstOption);

		for (let MediaIndex = 0; MediaIndex < MediaDevices.length; MediaIndex += 1) {
			let MediaDevice = MediaDevices[MediaIndex];

			//Don't add the media device unless it's a camera.
			if (MediaDevice.kind == 'videoinput') {
				let NewOption = document.createElement('option');
				NewOption.value = MediaDevice.deviceId;
				NewOption.innerText = MediaDevice.label + " - Camera " + CameraIndex + "";

				CameraOptions.appendChild(NewOption);
				CameraIndex += 1;
			}
		};

	});

	let Elements = [CameraLabel, CameraOptions, document.createElement("br"), document.createElement("br"), VideoPlayer, CapturePhoto];
	let OnClose = () => {
		try {
			document.getElementById("VideoPlayer").srcObject.getTracks()[0].stop();
		} catch {
			// When "No Camera" is selected
		}
	}
	PopUp(OnClose, "Load Your Image by Camera", Elements);

}

async function LoadImageURL() {

	let URLLabel = document.createElement("label");
	URLLabel.id = "URLLabel";
	URLLabel.setAttribute("for", "URLInput");
	URLLabel.innerText = "Enter URL: ";

	let URLInput = document.createElement("input");
	URLInput.name = "URLInput";
	URLInput.id = "URLInput";
	URLInput.type = "text";
	URLInput.style = "width: 100%;";

	let URLSelect = document.createElement("button");
	URLSelect.name = "URLSelect";
	URLSelect.id = "URLSelect";
	URLSelect.innerText = "Submit URL";
	URLSelect.onclick = () => {
		let Request = new XMLHttpRequest();
		Request.open("GET", document.getElementById("URLInput").value);
		Request.responseType = "blob";
		Request.onload = (Event) => {
			createImageBitmap(Event.currentTarget.response).then(ImageBitmap => {
				LoadImage(ImageBitmap);
			});
		}
		Request.send();
	}

	let Elements = [URLLabel, document.createElement("br"), URLInput, document.createElement("br"), document.createElement("br"), URLSelect];
	PopUp(() => { }, "Load Your Image by URL", Elements);
}

document.onpaste = function(Event) {
	let Items = (event.clipboardData || event.originalEvent.clipboardData).items;
	for (let ItemIndex = 0; ItemIndex < Items.length; ItemIndex++) {
		if (Items[ItemIndex].type.includes("image")) {
			createImageBitmap(Items[ItemIndex].getAsFile()).then(ImageBitmap => { LoadImage(ImageBitmap) });
			return;
		}
	}
}

async function TakePhoto() {
	if (document.getElementById("CameraOptions").value == "NoCamera") {
		alert("No Camera Selected");
		return "No Camera Selected";
	}

	let PhotoSurface = document.createElement("canvas");
	let VideoPlayer = document.getElementById("VideoPlayer");

	//Draw regular image to virtual canvas.
	PhotoSurface.setAttribute("width", VideoPlayer.clientWidth);
	PhotoSurface.setAttribute("height", VideoPlayer.clientHeight);
	PhotoSurface.getContext('2d').drawImage(VideoPlayer, 0, 0, PhotoSurface.width, PhotoSurface.height);

	//Get pixel values from canvas
	let ImageData = PhotoSurface.getContext('2d').getImageData(0, 0, PhotoSurface.width, PhotoSurface.height);
	//ImageData = GreyScaleImage(ImageData);

	//Display on "ImageDisplay"
	let ImageBitmap = await createImageBitmap(ImageData);
	LoadImage(ImageBitmap);
}