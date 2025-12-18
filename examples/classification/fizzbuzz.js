var TrainingData = [];
var TestingData = [];

function FizzBuzz(Value) {
	let OutputSample = [0, 0];
	if (Value % 3 == 0) {
		OutputSample[0] = 1;
	}
	if (Value % 5 == 0) {
		OutputSample[1] = 1;
	}
	return OutputSample;
}

for (let TrialIndex = 1; TrialIndex <= 255; TrialIndex++) {
	let InputSample = ("0".repeat(8 - TrialIndex.toString(2).length) + TrialIndex.toString(2)).split("").map((Bit) => Number(Bit));
	let OutputSample = FizzBuzz(TrialIndex);
	TrainingData.push(new Trial(Number(TrialIndex), InputSample, OutputSample));
}

let Labels = {
	InputLabels: [],
	OutputLabels: ["Fizz", "Buzz"]
};

for (let BitIndex = 0; BitIndex < 8; BitIndex++) {
	Labels.InputLabels.push("Bit " + BitIndex);
}

let Hyperparameters = {
	BatchSize: 1,
	LearningRate: 0.001,
	GainMinimum: 1,
	GainMaximum: 1,
	GainChange: 0,
	LossFunctionName: "Cross Entropy",
	EvaluationFunctionName: "5% Tolerance",
	WeightGenerationFunctionName: "Kaiming He"
};

let LayerBuilders = [
	new InputLayerBuilder(8),
	new ActivationLayerBuilder(100, "ReLU"),
	new ActivationLayerBuilder(2, "Sigmoid"),
];

let TestNetwork = new NeuralNetwork(Labels, Hyperparameters, LayerBuilders);

TestNetwork.LoadTrainingData(TrainingData);
TestNetwork.LoadTestingData(TestingData);