Genetically trained neural network for completing an obstacle course

http://jacob.jkrall.net/neural

What's going on here?
---------------------

Each box represents a neuron. 
A neuron has two weights that are multiplied by its two inputs 
(distance to next obstacle, and current energy),
and an activation level that determines when the neuron will jump.

Jumping expends energy.

Neurons regain energy with time.

If a neuron tries to jump, and does not have enough energy available, it dies.

The fitness function for a neuron is how far it travels in a round. During the mating phase, neurons are more likely to reproduce if they have a high fitness.
