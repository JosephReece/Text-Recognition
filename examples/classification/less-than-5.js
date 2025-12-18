var TrainingData = [
	new Trial("1", [1], [0, 1]),
	new Trial("2", [2], [0, 1]),
	new Trial("3", [3], [0, 1]),
	new Trial("4", [4], [0, 1]),
	new Trial("5", [5], [0, 1]),
	new Trial("6", [6], [1, 0]),
	new Trial("7", [7], [1, 0]),
	new Trial("8", [8], [1, 0]),
	new Trial("9", [9], [1, 0]),
	new Trial("10", [10], [1, 0])
];

var TestingData = [
	new Trial("1", [-10], [0, 1]),
	new Trial("2", [0], [0, 1]),
	new Trial("3", [5], [0, 1]),
	new Trial("4", [10], [1, 0])
];

let Labels = {
	InputLabels: ["Number to Check"],
	OutputLabels: ["Greater Than 5 (Probability)", "Less Than or Equal to 5 (Probability)"]
};

let Hyperparameters = {
	BatchSize: 3,
	LearningRate: 0.001,
	GainMinimum: 1,
	GainMaximum: 1,
	GainChange: 0.1,
	LossFunctionName: "Binary Cross-Entropy",
	EvaluationFunctionName: "Greatest Class",
	WeightGenerationFunctionName: "Xavier"
};

let LayerBuilders = [
	new InputLayerBuilder(1),
	new ActivationLayerBuilder(2, "Hyperbolic Tangent"),
	new ProbabilityLayerBuilder("Soft Max")
];

let TestNetwork = new NeuralNetwork(Labels, Hyperparameters, LayerBuilders);

TestNetwork.LoadTrainingData(TrainingData);
TestNetwork.LoadTestingData(TestingData);