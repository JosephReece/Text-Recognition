let Labels = {};
Labels.InputLabels = ["Input"];
Labels.OutputLabels = ["Output"];

let Hyperparameters = {
	BatchSize: 1,
	LearningRate: 0.001,
	GainMinimum: 1,
	GainMaximum: 1,
	GainChange: 0,
	LossFunctionName: "Squared Error",
	EvaluationFunctionName: "5% Tolerance",
	WeightGenerationFunctionName: "Kaiming He"
};

let LayerBuilders = [
	new InputLayerBuilder(1),
	new ActivationLayerBuilder(1, "Linear")
];

var TrainingData = [
	new Trial("1", [1], [2]),
	new Trial("2", [2], [4]),
	new Trial("3", [3], [6]),
	new Trial("4", [4], [8]),
];

var TestingData = [
	new Trial("1", [-4], [-8]),
	new Trial("2", [-12], [-24]),
	new Trial("3", [0], [0]),
	new Trial("4", [1], [2])
];

var TestNetwork = new NeuralNetwork(Labels, Hyperparameters, LayerBuilders);

TestNetwork.LoadTrainingData(TrainingData);
TestNetwork.LoadTestingData(TestingData);