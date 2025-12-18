//converts 5 bit unsigned binary integers to decimal

var TrainingData = [
	new Trial("1", [0, 0, 0, 0, 0], [0]),
	new Trial("2", [0, 0, 0, 0, 1], [1]),
	new Trial("4", [0, 0, 0, 1, 1], [3]),
	new Trial("8", [0, 0, 1, 1, 1], [7]),
	new Trial("9", [0, 1, 0, 0, 0], [8]),
	new Trial("10", [0, 1, 0, 0, 1], [9]),
  new Trial("17", [1, 0, 0, 0, 0], [16]),
	new Trial("18", [1, 0, 0, 0, 1], [17]),
	new Trial("20", [1, 0, 0, 1, 1], [19]),
	new Trial("21", [1, 0, 1, 0, 0], [20]),
	new Trial("26", [1, 1, 0, 0, 1], [25]),
	new Trial("27", [1, 1, 0, 1, 0], [26]),
	new Trial("30", [1, 1, 1, 0, 1], [29]),
	new Trial("31", [1, 1, 1, 1, 0], [30])
];

var TestingData = [
	new Trial("1", [0, 0, 0, 1, 1], [3]),
  new Trial("2", [0, 1, 1, 0, 0], [12]),
  new Trial("3", [1, 0, 1, 1, 1], [23]),
  new Trial("4", [1, 1, 1, 1, 1], [31])
];

let Labels = {
	InputLabels: ["Digit 1", "Digit 2", "Digit 3", "Digit 4", "Digit 5"],
	OutputLabels: ["Decimal Output"]
};

let Hyperparameters = {
	BatchSize: 1,
	LearningRate: 0.01,
	GainChange: 0.1,
	LossFunctionName: "Squared Error",
	EvaluationFunctionName: "Percentage Tolerance"
};

let LayerBuilders = [
	new InputLayerBuilder(5),
	new ActivationLayerBuilder(1, "Linear")
];

let TestNetwork = new NeuralNetwork(Labels, Hyperparameters, LayerBuilders);

TestNetwork.LoadTrainingData(TrainingData);
TestNetwork.LoadTestingData(TestingData);