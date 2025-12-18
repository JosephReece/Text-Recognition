//1, 3, 5, 7, 9, 11, 13
//y = ax + b
//a = 2, b = 0

let TrainingData = [
	new Trial("1", [1], [1]),
	new Trial("2", [2], [3]),
	new Trial("3", [4], [7]),
	new Trial("4", [7], [13]),
	new Trial("5", [10], [19]),
	new Trial("6", [14], [27]),
	new Trial("7", [19], [37]),
	new Trial("8", [24], [47]),
	new Trial("9", [45], [89]),
	new Trial("10", [52], [103])
];

let TestingData = [
	new Trial("1", [-10], [-21]),
	new Trial("2", [-9], [-19]),
	new Trial("3", [-8], [-17]),
	new Trial("4", [-7], [-15]),
	new Trial("5", [-6], [-13]),
	new Trial("6", [-5], [-11]),
	new Trial("7", [-4], [-9]),
	new Trial("8", [-3], [-7]),
	new Trial("1", [-2], [-5]),
	new Trial("2", [-1], [-3]),
	new Trial("3", [0], [-1]),
	new Trial("4", [1], [1]),
	new Trial("5", [2], [3]),
	new Trial("6", [3], [5]),
	new Trial("7", [4], [7]),
	new Trial("8", [5], [9]),
	new Trial("1", [6], [11]),
	new Trial("2", [7], [13]),
	new Trial("3", [8], [15]),
	new Trial("4", [9], [17]),
	new Trial("5", [10], [19]),
	new Trial("6", [11], [21]),
	new Trial("7", [12], [23]),
	new Trial("8", [13], [25])
];

let Labels = {
	InputLabels: ["Input (x-value)"],
	OutputLabels: ["Output (y-value)"]
};

let Hyperparameters = {
	BatchSize: 1,
	LearningRate: 0.0001,
	GainChange: 0.1,
	LossFunctionName: "Squared Error",
	EvaluationFunctionName: "Percentage Tolerance"
};

let LayerBuilders = [
	new InputLayerBuilder(1),
	new ActivationLayerBuilder(1, "Linear")
];

let TestNetwork = new NeuralNetwork(Labels, Hyperparameters, LayerBuilders);

TestNetwork.LoadTrainingData(TrainingData);
TestNetwork.LoadTestingData(TestingData);