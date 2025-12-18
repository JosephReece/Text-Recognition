
//adds three numbers together
let Labels = {};
Labels.InputLabels = ["Number 1", "Number 2", "Number 3"];
Labels.OutputLabels = ["Sum"];

let Hyperparameters = {
	BatchSize: 1,
	LearningRate: 0.001,
	GainChange: 0,
	LossFunctionName: "Squared Error",
	EvaluationFunctionName: "5% Tolerance",
	WeightGenerationFunctionName: "Xavier"
};

let LayerBuilders = [
	new InputLayerBuilder(3),
	new ActivationLayerBuilder(1, "Linear")
];

var TrainingData = [
	new Trial("1", [5, 4, 1], [10]),
	new Trial("2", [17, 9, 4], [30]),
	new Trial("3", [16, -19, 5], [2]),
	new Trial("4", [0, 0, 0], [0]),
	new Trial("5", [-11, 2, 15], [6]),
	new Trial("6", [-9, -11, -3], [-23]),
	new Trial("7", [4, 11, 11], [26])
];

var TestingData = [
	new Trial("1", [-2, -4, -1], [-7]),
	new Trial("2", [12, -9, 5], [8]),
	new Trial("3", [10, 13, 5], [28]),
	new Trial("4", [0, 0, 0], [0])
];

var TestNetwork = new NeuralNetwork(Labels, Hyperparameters, LayerBuilders);

TestNetwork.LoadTrainingData(TrainingData);
TestNetwork.LoadTestingData(TestingData);