/* Layer Builders */
class InputLayerBuilder {
	constructor(NodeCount) {
		this.NodeCount = NodeCount;
	}
}

class ActivationLayerBuilder extends InputLayerBuilder {
	constructor(NodeCount, ActivationFunctionName) {
		super(NodeCount);
		this.ActivationFunctionName = ActivationFunctionName;
	}
}

class ProbabilityLayerBuilder { //Nodes implied by previous layer
	constructor(ProbabilityFunctionName) {
		this.ProbabilityFunctionName = ProbabilityFunctionName;
	}
}

/* Network Functions */
class LossFunction {
	constructor(Primary, Derivative) {
		this.Primary = Primary;
		this.Derivative = Derivative;
	}
}

class ActivationFunction {
	constructor(Primary, Derivative) {
		this.Primary = Primary;
		this.Derivative = Derivative;
	}
}

class ProbabilityFunction {
	constructor(Primary, Derivative) {
		this.Primary = Primary;
		this.Derivative = Derivative;
	}
}

class EvaluationFunction {
	constructor(Evaluate) {
		this.Evaluate = Evaluate;
	}
}

class WeightGenerationFunction {
	constructor(Generate) {
		this.Generate = Generate;
	}
}

/* Neural Network Components */
class InputNode {
	constructor(Tensors) {
		this.Tensors = Tensors;
	}
}

class Node extends InputNode {
	constructor(Tensors, ActivationFunctionName, Bias) {
		super(Tensors);
		this.ActivationFunctionName = ActivationFunctionName;
		this.Bias = Bias;
	}
}

class Tensor {
	constructor(Weight, Gain) {
		this.Weight = Weight;
		this.Gain = Gain;
		this.LastDirection = 1;
	}
}

class Trial {
	constructor(Message, InputSample, OutputSample) {
		this.Message = Message;
		this.InputSample = InputSample;
		this.OutputSample = OutputSample;
	}
}

/* Predefined Functions */
let ProbabilityFunctions = {
	"Soft Max": new ProbabilityFunction(
		(InputSample) => {
			let Sum = 0;
			let OutputSample = [];

			for (let DataIndex = 0; DataIndex < InputSample.length; DataIndex++) {
				let Product = Math.exp(InputSample[DataIndex]);
				Sum += Product;
				OutputSample.push(Product);
			}

			for (let DataIndex = 0; DataIndex < OutputSample.length; DataIndex++) {
				OutputSample[DataIndex] /= Sum;
			}

			return OutputSample;
		},
		(InputSample) => {

			//Matrix formed from all permutations of the derivatives of all the probabilities with respect to all the raw values.
			let SoftMax = ProbabilityFunctions["Soft Max"].Primary(InputSample);
			let OutputGrid = [];

			for (let ProbabilityIndex = 0; ProbabilityIndex < InputSample.length; ProbabilityIndex++) {
				let Row = [];
				for (let RawIndex = 0; RawIndex < InputSample.length; RawIndex++) { //Without Kronecker delta implementation
					if (RawIndex == ProbabilityIndex) {
						Row.push(SoftMax[ProbabilityIndex] * (1 - SoftMax[ProbabilityIndex]));
					} else {
						Row.push(-1 * SoftMax[RawIndex] * SoftMax[ProbabilityIndex]);
					}
				}
				OutputGrid.push(Row);
			}

			//Output is a Jacobian matrix
			return OutputGrid;
		}
	),
	"Arg Max": new ProbabilityFunction(
		(InputSample) => {
			let OutputSample = Array.from(InputSample, () => 0);
			OutputSample[InputSample.indexOf(Math.max(...InputSample))] = 1;
			return OutputSample;
		},
		(InputSample) => {
			return Array.from(InputSample, () => Array.from(InputSample, () => 0));
		}
	)
}

let ActivationFunctions = {
	"Linear": new ActivationFunction(
		(Value) => { return Value },
		() => { return 1 }
	),
	"Exponent": new ActivationFunction(
		(Value) => { return Math.exp(Value) },
		(Value) => { return Math.exp(Value) }
	),
	"Binary Step": new ActivationFunction(
		(Value) => { return Value > 0 ? 1 : 0 },
		() => { return 0 }
	),
	"Square": new ActivationFunction(
		(Value) => { return Value ** 2 },
		(Value) => { return 2 * Value }
	),
	"Sine": new ActivationFunction(
		(Value) => { return Math.sin(Value) },
		(Value) => { return Math.cos(Value) }
	),
	"Cosine": new ActivationFunction(
		(Value) => { return Math.cos(Value) },
		(Value) => { return -Math.sin(Value) }
	),
	"Hyperbolic Tangent": new ActivationFunction(
		(Value) => { return Math.tanh(Value) },
		(Value) => { return 1 - Math.tanh(Value) ** 2 }
	),
	"ReLU": new ActivationFunction(
		(Value) => { return Value >= 0 ? Value : 0 },
		(Value) => { return Value >= 0 ? 1 : 0 }
	),
	"Sigmoid": new ActivationFunction(
		(Value) => { return 1 / (1 + Math.exp(-Value)) },
		(Value) => { SigmoidValue = 1 / (1 + Math.exp(-Value)); return SigmoidValue * (1 - SigmoidValue) }
	),
	"Swish": new ActivationFunction(
		(Value) => { return Value / (1 + Math.exp(-Value)) },
		(Value) => { SigmoidValue = 1 / (1 + Math.exp(-Value)); return Value * SigmoidValue + SigmoidValue * (1 - Value * SigmoidValue) }
	),
	"SigInt": new ActivationFunction(
		(Value) => { return Math.log((1 + Math.exp(Value)) / 2) },
		(Value) => { return 1 / (1 + Math.exp(-Value)) }
	)
};

let LossFunctions = {
	"Squared Error": new LossFunction(
		(NetworkData, TrainingData) => { return (NetworkData - TrainingData) ** 2 },
		(NetworkData, TrainingData) => { return 2 * (NetworkData - TrainingData) }
	),
	"Cross Entropy": new LossFunction( //Using ln, not base 2
		(NetworkData, TrainingData) => { return -1 * (TrainingData * Math.log(NetworkData)) },
		(NetworkData, TrainingData) => { return -1 * (TrainingData / NetworkData) }
	),
	"Binary Cross-Entropy": new LossFunction( //Using ln, not base 2
		(NetworkData, TrainingData) => { return -1 * ((TrainingData * Math.log(NetworkData) + (1 - TrainingData) * Math.log(1 - NetworkData))) },
		(NetworkData, TrainingData) => { return (1 - TrainingData) / (1 - NetworkData) - (TrainingData / NetworkData) }
	)
};

let EvaluationFunctions = {
	"5% Tolerance": new EvaluationFunction(
		(TrainingSample, NetworkSample) => {  //For Regression
			let Success = true;
			for (let DataIndex = 0; DataIndex < TrainingSample.length; DataIndex++) {
				if ((TrainingSample[DataIndex] - NetworkSample[DataIndex]) / NetworkSample[DataIndex] > 0.05) {
					Success = false;
					break;
				}
			}
			return Success;
		}
	),
	"Greatest Class": new EvaluationFunction( //For Classification
		(TrainingSample, NetworkSample) => {
			if (TrainingSample.indexOf(Math.max(...TrainingSample)) == NetworkSample.indexOf(Math.max(...NetworkSample))) {
				return true;
			} else {
				return false;
			}
		}
	)
};

let WeightGenerationFunctions = {
	"Xavier": new WeightGenerationFunction(
		(NodeCount) => {
			//Pick a weight between -(d)^(-1/2) and (d)^(-1/2) where d = number of nodes in previous layer
			let XavierNumber = 1 / Math.sqrt(NodeCount);
			let Weight = Math.random() * (2 * XavierNumber) - XavierNumber;
			return Weight;
		}
	),
	"Kaiming He": new WeightGenerationFunction(
		(NodeCount) => {
			//Pick a weight between within ±3 standard deviation of a normal distribution N(0, sqrt(2/n)²)
			let Weight = 0;
			let Mean = 0;
			let StandardDeviation = Math.sqrt(2 / NodeCount);

			//Pick a random number in the normal distribution
			//Uses central limit theorm with 30 samples and a uniform sample distribution
			do {
				let Samples = Array.from({ length: 30 }, () => { return Math.random() });
				let Total = Samples.reduce((Sum, Sample) => { return Sum + Sample });

				Weight = (Total - Samples.length / 2) / (Samples.length / 2);
				Weight = (StandardDeviation * Weight) + Mean;
			} while (3 * StandardDeviation < Math.abs(Weight - Mean));
			return Weight;
		}
	)
}

class NeuralNetwork {

	/* Initalisation */
	constructor(Labels, Hyperparameters, LayerBuilders) {

		//Generation date & time - used when saving networks and recording their compatibility
		this.GenerationTime = (new Date()).toLocaleString();

		//Function Managment
		this.LossFunctionName = Hyperparameters.LossFunctionName;
		this.EvaluationFunctionName = Hyperparameters.EvaluationFunctionName;
		this.WeightGenerationFunctionName = Hyperparameters.WeightGenerationFunctionName;

		//Labels
		this.InputLabels = Labels.InputLabels;
		this.OutputLabels = Labels.OutputLabels;

		//Default Learning Rate [η] and gain hyperparameters
		this.LearningRate = Hyperparameters.LearningRate;
		this.BatchSize = Hyperparameters.BatchSize;

		this.GainChange = Hyperparameters.GainChange;
		this.GainMinimum = Hyperparameters.GainMinimum; //Represents the lowest value gain can be
		this.GainMaximum = Hyperparameters.GainMaximum; //Represents the highest value gain can be

		//Creates blank array for layers
		this.Layers = [];

		//Create Tensors and Nodes for each Layer
		for (var LayerIndex = 0; LayerIndex < LayerBuilders.length; LayerIndex++) {
			let LayerBuilder = LayerBuilders[LayerIndex];

			if (LayerBuilder.constructor.name == "InputLayerBuilder") {
				//Add new input nodes with no tensors to Layers
				this.Layers[LayerIndex] = Array.from({ length: LayerBuilder.NodeCount }, () => { return new InputNode([]) });

			} else if (LayerBuilder.constructor.name == "ProbabilityLayerBuilder") {
				//Add string with the name of the probability function to Layers
				this.Layers.push(LayerBuilder.ProbabilityFunctionName);

			} else if (LayerBuilder.constructor.name == "ActivationLayerBuilder") {
				//Add a blank layer and add nodes on a one-by-one basis to Layers
				this.Layers.push([]);

				for (var NodeIndex = 0; NodeIndex < LayerBuilder.NodeCount; NodeIndex++) {
					//Add a new node with layerbuilder parameters and bias equal to 0
					this.Layers[LayerIndex].push(new Node([], LayerBuilder.ActivationFunctionName, 0));

					for (var TensorIndex = 0; TensorIndex < this.Layers[LayerIndex - 1].length; TensorIndex++) {
						//Initalise gain as 1
						let Weight = WeightGenerationFunctions[this.WeightGenerationFunctionName].Generate(this.Layers[LayerIndex - 1].length);
						this.Layers[LayerIndex - 1][TensorIndex].Tensors.push(new Tensor(Weight, 1));
					}
				}
			}
		}
	}

	LoadTrainingData(TrainingData) {
		this.TrainingData = TrainingData;
	}
	LoadTestingData(TestingData) {
		this.TestingData = TestingData;
	}

	/* Data Organisation */
	GetTensorsFromDestination(LayerIndex, NodeIndex) {
		let Tensors = [];
		for (var PreviousNodeIndex = 0; PreviousNodeIndex < this.Layers[LayerIndex - 1].length; PreviousNodeIndex++) {
			Tensors.push(this.Layers[LayerIndex - 1][PreviousNodeIndex].Tensors[NodeIndex]);
		}
		return Tensors;
	}
	CreateBlankDataGrid() {
		let DataGrid = [];

		for (let LayerIndex = 0; LayerIndex < this.Layers.length; LayerIndex++) {
			if (this.Layers[LayerIndex].constructor.name == "String") {
				DataGrid.push([...DataGrid[LayerIndex - 1]]);
			} else {
				DataGrid.push(Array.from(this.Layers[LayerIndex], () => 0));
			}
		}

		return DataGrid;
	}

	/* Feedforward/Running */
	//Gets output data from input sample for the final layer of the network
	RunSampleNice(InputSample) {
		let OutputSample = this.RunSample(InputSample);
		let Out = "";

		/*Out += "Inputs: " + "\n";
		for (var DataIndex = 0; DataIndex < InputSample.length; DataIndex++) {
			Out += "\t" + this.InputLabels[DataIndex] + ": " + InputSample[DataIndex].toPrecision(4);
			Out += "\n";
		}*/

		//Out += "Outputs: " + "\n";
		for (var DataIndex = 0; DataIndex < OutputSample.length; DataIndex++) {
			Out += this.OutputLabels[DataIndex] + ": " + OutputSample[DataIndex].toPrecision(4);
			Out += "\n";
		}

		return Out;
	}

	RunSample(InputSample) {
		return this.RunAllBoth(InputSample).Active[this.Layers.length - 1];
	}

	//Returns both Active and Inactive DataGrids 
	RunAllBoth(InputSample) {

		if (InputSample.length != this.Layers[0].length) {
			throw new Error("InputSample length is invalid");
		}

		//Create blank ActiveDataGrid and InactiveDataGrid from neural network layers
		let ActiveDataGrid = this.CreateBlankDataGrid();
		ActiveDataGrid[0] = InputSample;

		let InactiveDataGrid = this.CreateBlankDataGrid();
		InactiveDataGrid[0] = InputSample;

		// Loops through each value and applies it through nodes and tensors
		for (let LayerIndex = 1; LayerIndex < ActiveDataGrid.length; LayerIndex++) { //Ignore input layer
			if (this.Layers[LayerIndex].constructor.name == "String") {
				ActiveDataGrid[LayerIndex] = ProbabilityFunctions[this.Layers[LayerIndex]].Primary(ActiveDataGrid[LayerIndex - 1]);
			} else {
				for (let NodeIndex = 0; NodeIndex < ActiveDataGrid[LayerIndex].length; NodeIndex++) {
					let Node = this.Layers[LayerIndex][NodeIndex];
					let Tensors = this.GetTensorsFromDestination(LayerIndex, NodeIndex);

					let Sum = 0;
					for (let PreviousNodeIndex = 0; PreviousNodeIndex < Tensors.length; PreviousNodeIndex++) {
						let Value = ActiveDataGrid[LayerIndex - 1][PreviousNodeIndex];

						Sum += Value * Tensors[PreviousNodeIndex].Weight;
					}
					ActiveDataGrid[LayerIndex][NodeIndex] = ActivationFunctions[Node.ActivationFunctionName].Primary(Sum + Node.Bias);
					InactiveDataGrid[LayerIndex][NodeIndex] = Sum + Node.Bias;
				}
			}
		}

		return { Active: ActiveDataGrid, Inactive: InactiveDataGrid };
	}

	/* Evaluation */
	Evaluate() {
		let Successes = 0;
		for (let TrialIndex = 0; TrialIndex < this.TestingData.length; TrialIndex++) {
			let Trial = this.TestingData[TrialIndex];
			let NetworkSample = this.RunSample(Trial.InputSample);
			Successes += EvaluationFunctions[this.EvaluationFunctionName].Evaluate(Trial.OutputSample, NetworkSample);
		}
		return { Successes: Successes };
	}

	EvaluateNice() {
		let Outcome = this.Evaluate();
		let Message = "";

		if (Outcome.Successes == 0) {
			Message += "No successes occured. :(";
		} else {
			Message += Outcome.Successes + " success";
			if (Outcome.Successes > 1) {
				Message += "es"
			}
			Message += " occured out of " + this.TestingData.length + " trials (" + ((Outcome.Successes / this.TestingData.length) * 100).toFixed(2) + "% success rate).";
		}
		return Message;
	}

	/* Training, Backpropagation and Evaluation */
	//Train for ... epochs
	Train(EpochCount = 1) {
		let SkippedBackpropagations = 0;
		let StartTime = performance.now();
		for (let EpochIndex = 0; EpochIndex < EpochCount; EpochIndex++) {

			//Create copy of TrainingData by value using array spread
			let CopiedData = [...this.TrainingData];
			let FinalData = [];

			//Randomise with Fisher-Yates method
			for (let Index = CopiedData.length; Index > 0; Index -= 1) {
				let RandomIndex = Math.floor(Math.random() * CopiedData.length);
				FinalData.push(CopiedData[RandomIndex]);
				CopiedData = CopiedData.slice(0, RandomIndex).concat(CopiedData.slice(RandomIndex + 1, CopiedData.length));
			}

			//Arrange into batches (Do not generate a batch if the size is less than BatchSize)
			let Batches = [];
			for (let TrialIndex = 0; TrialIndex < Math.floor(FinalData.length / this.BatchSize) * this.BatchSize; TrialIndex++) {
				if (TrialIndex % this.BatchSize == 0) {
					Batches.push([]);
				}
				Batches[Batches.length - 1].push(FinalData[TrialIndex]);
			}

			//Loop Through Each Batch
			for (let BatchIndex = 0; BatchIndex < Batches.length; BatchIndex++) {
				let Batch = Batches[BatchIndex];

				//Generate DataGrids from Trials in Batch
				let DataGrids = [];
				for (let TrialIndex = 0; TrialIndex < Batch.length; TrialIndex++) {
					let Trial = Batch[TrialIndex];
					DataGrids.push(this.RunAllBoth(Trial.InputSample));
				}

				//UpdateConstituent is (1/n) * η = η/n
				let UpdateConstituent = this.LearningRate / Batch.length;

				//Loop Through Each Trial in Batch
				for (let TrialIndex = 0; TrialIndex < Batch.length; TrialIndex++) {
					let Trial = Batch[TrialIndex];
					let ActiveDataGrid = DataGrids[TrialIndex].Active;
					let InactiveDataGrid = DataGrids[TrialIndex].Inactive;

					// Creates replica of neural network as 2d array of "0", each representing sum of the desired changes for each node
					let DesiredActivations = this.CreateBlankDataGrid();

					//Calculate ΔC/Δy
					let CostDerivative = Array.from(DesiredActivations[DesiredActivations.length - 1], () => 0);
					for (let DataIndex = 0; DataIndex < ActiveDataGrid[ActiveDataGrid.length - 1].length; DataIndex++) {
						CostDerivative[DataIndex] = LossFunctions[this.LossFunctionName].Derivative(ActiveDataGrid[ActiveDataGrid.length - 1][DataIndex], Trial.OutputSample[DataIndex]);
					}
					DesiredActivations[DesiredActivations.length - 1] = CostDerivative; //Final layer in DesiredActivations is the CostDerivative

					//Backpropagate
					for (let LayerIndex = ActiveDataGrid.length - 1; LayerIndex > 0; LayerIndex--) { //Work backwards through the layers
						if (this.Layers[LayerIndex].constructor.name == "String") {
							//Apply ProbabilityFunction Derivative Δp/Δa
							//Jacobean Matrix with all derivatives

							//Calculate Δp_i/Δa_k for each logit
							let ProbabilityDerivativeGrid = ProbabilityFunctions[this.Layers[LayerIndex]].Derivative(InactiveDataGrid[LayerIndex]);
							for (let RawIndex = 0; RawIndex < ProbabilityDerivativeGrid.length; RawIndex++) {
								for (let ProbabilityIndex = 0; ProbabilityIndex < ProbabilityDerivativeGrid.length; ProbabilityIndex++) {
									//ProbabilityDerivativeGrid[i][k] = Δp_i/Δa_k
									ProbabilityDerivativeGrid[ProbabilityIndex][RawIndex] *= DesiredActivations[LayerIndex][ProbabilityIndex];
								}
							}

							//Combine logits into DesiredActivations
							for (let RawIndex = 0; RawIndex < ProbabilityDerivativeGrid.length; RawIndex++) {
								for (let ProbabilityIndex = 0; ProbabilityIndex < ProbabilityDerivativeGrid.length; ProbabilityIndex++) {
									DesiredActivations[LayerIndex - 1][RawIndex] += ProbabilityDerivativeGrid[ProbabilityIndex][RawIndex];
								}
							}

						} else {
							for (let NodeIndex = 0; NodeIndex < ActiveDataGrid[LayerIndex].length; NodeIndex++) {
								let Node = this.Layers[LayerIndex][NodeIndex];
								let Tensors = this.GetTensorsFromDestination(LayerIndex, NodeIndex); //Weights to update

								//ChainRuleConstituent is ΔC/Δa * Δa/Δz = ΔC/Δz
								let ChainRuleConstituent =
									DesiredActivations[LayerIndex][NodeIndex]
									* ActivationFunctions[Node.ActivationFunctionName].Derivative(InactiveDataGrid[LayerIndex][NodeIndex]);

								//Skip trial if update or chainrule constituents are not numbers (ie log(0) or x/0)
								if (isNaN(UpdateConstituent) || isNaN(ChainRuleConstituent)) {
									SkippedBackpropagations += 1;
									continue;
								}

								//Adjust Bias (Δz/Δb = 1)
								Node.Bias -= UpdateConstituent * ChainRuleConstituent

								for (let TensorIndex = 0; TensorIndex < Tensors.length; TensorIndex++) {
									let Tensor = this.Layers[LayerIndex - 1][TensorIndex].Tensors[NodeIndex];

									//Add Desired Change For Source Node proportionate to weight of previous layer (Δz/Δa = w)
									//This represents the sum of the ΔC/Δa
									DesiredActivations[LayerIndex - 1][TensorIndex] += Tensor.Weight * ChainRuleConstituent;

									//Adjust Weight of Tensor proportionate to activation of previous layer (Δz/Δw = a)
									let WeightAdjustment = ActiveDataGrid[LayerIndex - 1][TensorIndex] * UpdateConstituent * ChainRuleConstituent;

									if (Math.sign(WeightAdjustment) == Tensor.LastDirection) {
										//If learning is consitent (same direction), speed up learning (increase the gain).
										Tensor.Gain *= 1 + this.GainChange;
										if (this.GainMaximum != undefined) {
											Tensor.Gain = Math.min(this.GainMaximum, Tensor.Gain);
										}
									} else {
										//If learning is not consistent (different direction), slow down learning (decrease the gain).
										Tensor.Gain *= 1 - this.GainChange;
										if (this.GainMinimum != undefined) {
											Tensor.Gain = Math.max(this.GainMinimum, Tensor.Gain);
										}
									}

									Tensor.Weight -= Tensor.Gain * WeightAdjustment;
									Tensor.LastDirection = Math.sign(WeightAdjustment);
								}
							}
						}
					}
				}
			}
		}

		return { SkippedBackpropagations: SkippedBackpropagations, Time: performance.now() - StartTime }
	}

	TrainNice(EpochCount = 1) {
		let Outcome = this.Train(EpochCount);

		let Message = "Finished training session ";
		if (EpochCount == 1) {
			Message += "of 1 epoch ";
		} else {
			Message += "of " + EpochCount + " epochs ";
		}

		if (Outcome.SkippedBackpropagations > 0) {
			Message += "(" + Outcome.SkippedBackpropagations + " backpropagations skipped) ";
		}

		let Time = Outcome.Time; //in ms
		if (Time < 5000) {
			Message += "in " + Time.toFixed(2) + " milliseconds.";
		} else {
			Message += "in " + (Time / 1000).toFixed(2) + " seconds.";
		}

		Message += " " + this.EvaluateNice();
		return Message;
	}

}

function ExportNeuralNetwork(Filename, NeuralNetwork) {
	const TempLink = document.createElement('a');
	TempLink.href = URL.createObjectURL(new Blob([JSON.stringify(NeuralNetwork, null, 2)]));
	if (Filename == "") {
		Filename = "Untitled Network";
	}
	TempLink.download = Filename + ".net";
	TempLink.click();

	URL.revokeObjectURL(TempLink.href);
}

async function ImportNeuralNetwork() { //Call this function with await to return a network object!
	return new Promise((Resolve) => {
		let TempUpload = document.createElement('input');
		TempUpload.type = "file";
		TempUpload.accept = ".net";
		TempUpload.click();

		TempUpload.addEventListener("change", function() {
			const Reader = new FileReader();
			Reader.onload = function(Event) {
				let Network = JSON.parse(Event.target.result); //Contains Values
				Object.setPrototypeOf(Network, NeuralNetwork.prototype); //Contains Methods
				Resolve(Network);
			};
			Reader.readAsText(TempUpload.files[0]);
		});
	});
}

async function PreloadNeuralNetwork(URL) {
	return new Promise((Resolve) => {
		let Request = new XMLHttpRequest();
		Request.open("GET", URL);
		Request.responseType = "json";
		Request.onload = (Event) => {
			let Network = Event.target.response; //Contains Values
			Object.setPrototypeOf(Network, NeuralNetwork.prototype); //Contains Methods
			Resolve(Network);
		}
		Request.send();
	});
}