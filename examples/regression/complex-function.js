//y = x^2 + 3x - 4

let TrainingData = [
	new Trial("1", [1], [0]),
	new Trial("2", [2], [6]),
	new Trial("3", [3], [14]),
	new Trial("4", [4], [24]),
	new Trial("5", [5], [36]),
	new Trial("6", [6], [50]),
	new Trial("7", [7], [66]),
	new Trial("8", [8], [84]),
	new Trial("9", [9], [104]),
	new Trial("10", [10], [126])
];

let TestingData = [];

let Labels = {
	InputLabels: ["Input Value"],
	OutputLabels: ["Output Value"]
};

let Hyperparameters = {
	BatchSize: 1,
	LearningRate: 0.000001,
	GainChange: 0.1,
	LossFunctionName: "Squared Error",
	EvaluationFunctionName: "Percentage Tolerance"
};

let LayerBuilders = [
	new InputLayerBuilder(1),
	new ActivationLayerBuilder(2, "Linear"),
	new ActivationLayerBuilder(1, "Linear")
];

let TestNetwork = new NeuralNetwork(Labels, Hyperparameters, LayerBuilders);
TestNetwork.Layers[1][0].ActivationFunctionName = "Square";

TestNetwork.LoadTrainingData(TrainingData);
TestNetwork.LoadTestingData(TestingData);