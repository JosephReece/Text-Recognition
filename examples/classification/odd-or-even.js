//returns 1 if number is odd, else return 0
//1st tensor weight = pi 
//desmos link https://www.desmos.com/calculator/ffetn50iyv [OUTDATED]

var TrainingData = [
	new Trial("1", [1], [1]),
	new Trial("2", [2], [0]),
	new Trial("3", [3], [1]),
	new Trial("4", [4], [0]),
	new Trial("5", [5], [1]),
	new Trial("6", [6], [0]),
	new Trial("7", [7], [1]),
	new Trial("8", [8], [0]),
	new Trial("9", [9], [1]),
	new Trial("10", [10], [0])
];

var TestingData = [
	new Trial("1", [-10], [0]),
	new Trial("2", [-1], [1]),
	new Trial("3", [1], [1]),
	new Trial("4", [10], [0])
];

let Labels = {
	InputLabels: ["Number to Check"],
	OutputLabels: ["Odd (Probability)"]
};

let Hyperparameters = {
	BatchSize: 1,
	LearningRate: 0.1,
	GainChange: 0.1,
	LossFunctionName: "Squared Error",
	EvaluationFunctionName: "Percentage Tolerance"
};

let LayerBuilders = [
	new InputLayerBuilder(1),
	new ActivationLayerBuilder(1, "Cosine"),
	new ActivationLayerBuilder(1, "ReLU")
];

let TestNetwork = new NeuralNetwork(Labels, Hyperparameters, LayerBuilders);

TestNetwork.LoadTrainingData(TrainingData);
TestNetwork.LoadTestingData(TestingData);