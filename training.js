//Define Constants
const Characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const InputResolution = 28; //Square so only one dimension mentioned

//Label Generation
let Labels = { InputLabels: [], OutputLabels: [] };
for (var InputLabelIndex = 0; InputLabelIndex < InputResolution ** 2; InputLabelIndex++) {
	Labels.InputLabels.push("Pixel (" + (InputLabelIndex % InputResolution) + ", " + Math.floor(InputLabelIndex / InputResolution) + ")");
}
for (var OutputLabelIndex = 0; OutputLabelIndex < Characters.length; OutputLabelIndex++) {
	Labels.OutputLabels.push(Characters[OutputLabelIndex]);
}

//Set Hyperparameters
let Hyperparameters = {
	BatchSize: 50,
	LearningRate: 0.00001,
	GainChange: 0.001,
	GainMinimum: 0.01,
	GainMaximum: 100,
	LossFunctionName: "Cross Entropy",
	WeightGenerationFunctionName: "Xavier",
	EvaluationFunctionName: "Greatest Class"
};

//State Structure of OCRNetwork
let LayerBuilders = [
	new InputLayerBuilder(InputResolution ** 2), //InputResolution ** 2
	new ActivationLayerBuilder(InputResolution * 2, "Linear"), //InputResolution ** 2
	new ActivationLayerBuilder(InputResolution * 2, "Linear"), //InputResolution ** 2
	new ActivationLayerBuilder(Characters.length, "Linear"), //Characters.length
	new ProbabilityLayerBuilder("Soft Max")
];
var OCRNetwork = new NeuralNetwork(Labels, Hyperparameters, LayerBuilders);

//TrainingData added with asynchronous recursive function to ensure all images are loaded 
var TrainingNames = Array.from(Characters, Character => "trainingdata/dataset1/" + Character + "-1.png");
TrainingNames.push(...Array.from(Characters, Character => "trainingdata/dataset2/" + Character + "-2.png"));

var TrainingData = [];

let DrawCanvas = document.createElement("canvas");
let DrawContext = DrawCanvas.getContext('2d', { willReadFrequently: true });

let AddTraining = async (Index) => {

	if (Index == TrainingNames.length) { //Base Case
		console.log("Training data loaded!")
		OCRNetwork.LoadTrainingData(TrainingData);
		OCRNetwork.LoadTestingData(TrainingData);
		return true;
	}

	let Response = await fetch(TrainingNames[Index]);
	let Blob = await Response.blob();
	let ImageBitmap = await createImageBitmap(Blob);

	DrawCanvas.width = ImageBitmap.width;
	DrawCanvas.height = ImageBitmap.height;

	DrawContext.drawImage(ImageBitmap, 0, 0, ImageBitmap.width, ImageBitmap.height);
	let ImageData = DrawContext.getImageData(0, 0, ImageBitmap.width, ImageBitmap.height);

	let CharacterToAdd = TrainingNames[Index][22];
	let CharacterImages = await GetSections(Greyscale(ImageData));

	for (let CharacterIndex = 0; CharacterIndex < CharacterImages.length; CharacterIndex++) {
		let InputValues = await ImageDataToInput(CharacterImages[CharacterIndex]);
		let OutputValues = Array.from(Characters, (Character) => { return Character == CharacterToAdd ? 0.99 : 0.004 });

		TrainingData.push(new Trial(TrainingNames[Index], InputValues, OutputValues));
	}

	AddTraining(Index + 1);
}
AddTraining(0);