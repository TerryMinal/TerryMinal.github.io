//y = sigma/sqrt(2) x = mu

/*Each Gaussian distribution is an object with:
  mu, sigma, corresponding point on the circle
  array of coordinates that are graphed
  graphing function
 */
class gaussDistribution {

  constructor(circleX, circleY) {
    //y = sigma/sqrt(2) x = mu
    this.mu = circleX;
    this.sigma = Math.abs(circleY * Math.sqrt(2));
    this.circleX = circleX;
    this.circleY = circleY;

    this.graph = [];

  }

  //returns the point on the gaussian given the x-cor g
  gaussianPointAt(g) {
    var coeff = 1/( this.sigma * Math.sqrt(2 * Math.PI) );
    var powr = -1/2 * Math.pow((g - this.mu), 2) / Math.pow(this.sigma, 2);
    return coeff * Math.exp(powr);
  }

  //create an array of points on the gaussian given mu sigma in the given interval with each point dx away
  createGraph() {
    var newGraph = [];
    for(var i = this.mu - 6 * this.sigma - 5 ; i <= this.mu + 6 * this.sigma + 5; i += .1) {
      newGraph.push(
        {
         "x": i ,
         "y": this.gaussianPointAt(i)
        }
      );
    }
    this.graph = newGraph;
    return newGraph;
  }

} //end of Gaussian class


class arcPlane {
  //we assume that the y is 0
  constructor(start, end) {
    this.start = start;
    this.end = end;

    this.center = 0;
    this.radius = 0;
    this.arc = [];
    this.gaussDistros = [];
  }

  setup() {
    this.center = this.calcCircleCenter();
    this.radius = this.calcRadius();
    this.arc = this.createArc();
    this.gaussDistros = this.createGaussDistributions();
  }

  // returns a center of circle on the x-axis
  calcCircleCenter() {
    var x1 = this.start[0];
    var y1 = this.start[1];
    var x2 = this.end[0];
    var y2 = this.end[1];
    var t = 1/2 * ( (Math.pow(y2, 2) - Math.pow(y1, 2))/(x2 - x1) + x2 + x1);
    return [t, 0];
  }

  //given a point and the circleCenter
  calcRadius() {
    return Math.sqrt( Math.pow(this.start[0] - this.center[0], 2) + Math.pow(this.start[1], 2) );
  }

  //create set of points of an arc given a start and end point
  createArc() {
    var n = 20;
    var startPoint = this.start[0] - this.center[0];
    var endPoint = this.end[0] - this.center[0];
    var startAngle = Math.acos(startPoint/this.radius);
    var endAngle = Math.acos(endPoint/this.radius);
    var dtheta = (endAngle - startAngle)/n;
    var theta = startAngle;
    var x1, y1;
    var arcPoints = [];
    var cn = 0;
    while (cn <= n) { //while the start point is not at the end point
      x1 = this.center[0] + this.radius * Math.cos(theta);
      y1 = this.center[1] + this.radius * Math.sin(theta);
      arcPoints.push( {x: x1, y: y1} );
      theta += dtheta;
      cn += 1;
    }
    this.arc = arcPoints;
    return arcPoints;
  }

  createGaussDistributions() {
    var point, distro;
    var gaussDistros = [];
    for(var i = 0; i < this.arc.length; i++) {
      point = this.arc[i];
      //y = sigma/sqrt(2) x = mu
      if (point.y >= 0.01) { //prevent sigma from being close to zero
        distro = new gaussDistribution(point.x, point.y);
        gaussDistros.push(distro);
      }
    }
    this.gaussDistros = gaussDistros;
    return gaussDistros;
  }

} //end of arcplane

var margin = {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
    };

// svg element definition
var svgH = {
  height: 600 - margin.top - margin.bottom,
  width: 600 - margin.left - margin.right,
  id: "infogeo",
}

var svg = d3.select("body").append("svg")
    .attr("width", svgH.width + margin.left + margin.right)
    .attr("height", svgH.height + margin.top + margin.bottom)
    .attr("id", svgH.id)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//define range of X and range of Y
var x = d3.scaleLinear().rangeRound([0, svgH.width]);
var y = d3.scaleLinear().range([svgH.height, 0]);

var line = d3.line()
    .x(function (d) { return x(d.x); })
    .y(function (d) { return y(d.y); })
    .curve(d3.curveBasis);

// var POINT = [Math.cos(90), Math.sin(90)];
// var POINT = [0, 1/Math.sqrt(2)];
side1 = new arcPlane([1, 1], [0, 0]);
side1.setup();
side2 = new arcPlane([0, 0], [-1, 1]);
side2.setup();
side3 = new arcPlane([-1, 1], [1, 1]);
side3.setup();

//stores all sides of hyperbolic triangle and their corresponding distributions
var sides = [side1, side2, side3];
var muDistros = [];
var currentGaussDistro;

//generate muDistros which contains all gaussian(mu) of sides
for (var i = 0; i < sides.length; i++) {
  var side = sides[i];
  for (var j = 1; j < side.gaussDistros.length; j++) {
    currentGaussDistro = side.gaussDistros[j];
    currentGaussDistro.createGraph();
    muDistros.push(currentGaussDistro.gaussianPointAt(currentGaussDistro.mu));
  }
}

var maxRadius = d3.max(sides, function(side) { return side.radius} );
var maxY = d3.max(muDistros, function (d) { return d; });
//

x.domain( [-2 * maxRadius, 2 * maxRadius]).nice;
y.domain( [-2 * maxRadius, 2 * maxRadius] );

//
// var gX = svg.append("g")
//             .attr("class", "x axis")
//             .attr("transform", "translate(0," + svgH.height + ")")
//             .call(d3.axisBottom(x));
//
// var gY = svg.append("g")
//            .attr("class", "y axis")
//            .call(d3.axisLeft(y));
//
//creating color gradient
var svgDef = svg.append("defs");
var colorGradient = svgDef.append('linearGradient')
    .attr('id', 'colorGradient');

colorGradient.append('stop')
    .attr('class', 'stop-left')
    .attr('offset', '0.25');

  colorGradient.append('stop')
      .attr('class', 'stop-mid')
      .attr('offset', '0.50');

colorGradient.append('stop')
    .attr('class', 'stop-right')
    .attr('offset', '0.7');
//finished creating color gradient

//flipping arc over x axis
for (var i = 0; i < sides.length; i++) {
  var side = sides[i];
  for (var j = 0; j < side.arc.length; j++) {
    side.arc[j].y = -side.arc[j].y; //flip over x axis
  }
}


//adding arc
for (var i = 0; i < sides.length; i++) {
  svg.append("path")
    .datum(sides[i].arc)
     .attr("class", "line")
     .attr("d", line)
     // .style("stroke", "black");
}


// //adding reference gaussian distributions in the background
for (var i = 0; i < sides.length; i++) {
  var side = sides[i];
  for (var j = 0; j < side.gaussDistros.length; j++) {
    distro = side.gaussDistros[j];
    svg.append("path")
        .datum(distro.graph)
        .attr("class", "line")
        .attr("id", "reference")
        .attr("d", line)
        .style("stroke", "#3a1c71")
        .style("opacity", 0.045);
  }
}

//used for animation: stores necessary variables
var progress = {
  sideIndex: 0 , //stores which side we're on
  distroIndex: 0 , //stores which distro we're animating for the side
  startTime: null ,
  fpsInterval: 1000/10 ,
  dt: 1
};

//function to pass to requestAnimationFrame
function animate(time) { //time has time of animation execution in milliseconds

  if (!progress.startTime) //initiate startTime to be start of the first frame
    progress.startTime = time;

  //animate only at time of the given fps occurring and only if there are still distributions to animate
  if(time - progress.startTime > progress.fpsInterval && progress.distroIndex < sides[progress.sideIndex].gaussDistros.length) {
    progress.startTime = time - (time - progress.startTime)%progress.fpsInterval; //reset time variable
    var distro = sides[progress.sideIndex].gaussDistros[progress.distroIndex]; //get distribution you need to draw
    //remove previous distribution
    svg.selectAll("#animation").remove();
    //draw new distribution
    svg.append("path")
        .datum(distro.graph)
        .attr("class", "line")
        .attr("id", "animation")
        .attr("d", line);

    var coor = {x: sides[progress.sideIndex].arc[progress.distroIndex].x, y: sides[progress.sideIndex].arc[progress.distroIndex].y};

    // line illustrating connection between arc and distribution
    var l = [
      {x: sides[progress.sideIndex].arc[progress.distroIndex].x, y: sides[progress.sideIndex].arc[progress.distroIndex].y} ,
      {x: distro.mu, y:  sides[progress.sideIndex].radius}
    ];

    svg.append("path")
       .datum(l)
       .attr("class", "line")
       .attr("id", "animation")
       .attr("d", line)
       .attr("r", 10)
       .style("stroke-dasharray", ("3, 3"))
       .style("stroke", "#3a1c71")
       .style("opacity", 0.4);


    progress.distroIndex += progress.dt;
  }

  if (progress.distroIndex >= sides[progress.sideIndex].gaussDistros.length) { //if done with all gaussians to animate for current side
    progress.sideIndex = (progress.sideIndex + 1)%3; //go on to next side
    // cancelAnimationFrame(progress.animationID);
    progress.distroIndex = 0; //resets from gaussDistros.length to gaussDistros.length - 1
    // progress.dt = -1;
  }
  // else if (progress.animateNumber < 0) {
  //   progress.animateNumber = 0; //resets animateNumber to 0
  //   progress.dt = 1;
  // }

  // else {
    requestAnimationFrame(animate);
  // }
}

progress.animationID = requestAnimationFrame(animate);
