jQuery(function($){
	var $canvas = $("<canvas width='400' height='300'></canvas>");
	var ctx = $canvas[0].getContext("2d");
	$("body").append($canvas);

	// How many pixels must we travel, minimum, before spawning next obstacle?
	var refill = 10; 
	var certaindeath = GEN_FACTOR*generationNum;
	var obstacles = [ ];
	var actors = [ ];
	var GROUND = 270;
	var GEN_FACTOR = 100;

	var clearCanvas = function(){
		ctx.fillStyle = "white";
		ctx.fillRect(0,0, $canvas.width(), $canvas.height());
	};
	var drawGround = function(){
		ctx.fillStyle = "green";
		ctx.fillRect(0, GROUND, $canvas.width(), $canvas.height()-GROUND);
	};
	var drawObstacles = function(){
		obstacles.forEach(function(obstacle){
			obstacle.draw();
		});
		ctx.fillStyle= "rgba(0,0,0,0.7)";
		ctx.fillRect(certaindeath+5, 1, 400, 300);
	};
	var drawObstacle = function(){
		ctx.fillStyle = "red";
		ctx.fillRect(this.x, 250, 3, 50);
	};
	var drawActors = function(){
		actors.forEach(function(actor){
			actor.draw();
		});
	};
	var moveObstacles = function(){
		obstacles = obstacles
			.map(function(obstacle){ obstacle.x--; return obstacle; })
			.filter(function(obstacle){ return obstacle.x>0; });
		refill--;
		certaindeath--;
		if(refill<0 && Math.random() < 0.03){
			refill = 30;
			obstacles.push({x: $canvas.width(), draw: drawObstacle, 
					collide: function(y){ return y > 250; }  });
		}
	};

	var triggerNeuron = function(){
		var xx = this.x;
		var incoming = obstacles.filter(function(o){ var d= o.x > xx; return d; });
		incoming.sort(function(a,b){return a.x-b.x;});
		var input = [600, this.energy];

		if(incoming.length>0){
			input[0] = incoming[0].x - this.x;
		}
		var activation = 0;
		for(var iw in this.weights)
		{
			activation += this.weights[iw] * input[iw];
		}
		if(activation > this.activationLevel)
			this.jump();
	};
	var drawNeuron = function(){
		ctx.strokeRect(this.x, this.y-10, 10, 10);
		var health255 = Math.floor(2.55*this.energy);
		ctx.fillStyle = "rgb("+(255-health255)+"," +health255+",0)";
		ctx.fillRect(this.x, this.y-10, 10, 10);
		ctx.fillStyle = "black";
		for(var i in this.weights)
		{
			ctx.fillRect(this.x+2*i, 15, 2, this.weights[i]*15);
		}
		ctx.fillText(Math.floor(this.activationLevel), this.x, 50);
	};

	var jumpNeuron = function(){ if(this.y==GROUND){ this.dy = -6; this.energy-=50; } }
	var randomNeuron = function(x){
		return {
			x: 0,
			y: GROUND,
			weights: [Math.random()*2 -1, Math.random()*2 - 1],
			activationLevel: Math.random()*100-50,
			energy: 0,
			input: triggerNeuron,
			draw: drawNeuron,
			jump: jumpNeuron,
			dy: 0,
			fitness: 0
		}
	}

	var generation = [];
	var generationNum = 1;
	var combine = function(mo,fa,ran)
	{
		var seed = Math.random();
		if(seed<0.1)
			return mo;
		else if(seed<0.2)
			return fa;
		else if(seed<0.9)
			return (mo+fa)/2 * ( Math.random()/10 + .95);
		else
			return ran;
	};
	var mate = function(mother, father){
		var child = randomNeuron();

		for(var ix in mother.weights)
		{
			child.weights[ix] = combine(mother.weights[ix], father.weights[ix], child.weights[ix]);
		}
		child.activationLevel = combine(mother.activationLevel, father.activationLevel, child.activationLevel);

		return child;
	}
	var orgy = function(participants){
		var totalFitness = participants.reduce(function(pr,cur){
				return pr + cur.fitness;}, 0);
		var box = []
		for(var i in participants)
		{
			var stud = participants[i];
			var slots = Math.floor(stud.fitness/totalFitness*100);
			while(slots>0) {
				box.push(stud);
				slots--;
			}
		}
		while(box.length<100) box.push(randomNeuron());

		var children = [];
		while(children.length < 5)
		{
			var r1 = Math.floor(Math.random()*box.length);
			var r2 = Math.floor(Math.random()*box.length);
			children.push(mate(box[r1], box[r2]));
		}
		return children;
	}
	var newGeneration=function(){
		generationNum++;
		certaindeath = generationNum * GEN_FACTOR;
		if(generation.length==0){
			for(var x=0;x<10;x++)
			generation.push(randomNeuron(x));
		}else{

			generation.sort(function(a,b){ return b.fitness-a.fitness; });
			generation = generation.filter(function(el,ix){return ix<=5;});
			generation = generation.concat(orgy(generation));
		}
		generation = generation.reverse();
		generation = generation.map(function(a,ix){ a.fitness = a.x = 12*ix; a.energy=0; return a;});
		actors = generation.map(function(g){return g;});
		obstacles = [];
		refill = 10;
	}

	var getInput = function(){
		if(actors.length == 0){
			newGeneration();
		}
		actors.forEach(function(actor){
			actor.y += actor.dy;
			actor.dy+= .5;
			if(actor.y >= GROUND){
				actor.y = GROUND;
				actor.dy = 0;
			}

			actor.energy = Math.min(actor.energy+1, 100);
		});
		actors = actors.map(function(actor){
			actor.input();
			return actor;
		}).filter(function(actor){
			return obstacles.every(function(obstacle){
				var distance = (obstacle.x - actor.x)
				var died= 
					actor.fitness> GEN_FACTOR*generationNum||
					actor.energy<0 ||
					(distance <=10 && distance>=0
					&& obstacle.collide(actor.y));

				return !died;
			});
		});
		actors.forEach(function(actor){ actor.fitness++ });
	};

	var tick = function(){
		clearCanvas();

		drawGround();
		drawActors();
		drawObstacles();

		moveObstacles();

		getInput();
	};

	setInterval(tick, 09);
});
