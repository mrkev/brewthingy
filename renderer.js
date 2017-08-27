// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const split = require('split');
const spawn = require('child_process').spawn;
const KNEXT = 'next next'

const getDeps = function (onLine, onDone) {
  const cmd = `brew list | while read cask; do echo -n $cask; brew deps $cask | awk '{printf(" %s", $0)}'; echo ""; done`
  const child = spawn('bash', ['-c', cmd]);
  child.stdout.pipe(split()).on('data', function (line) {
    const [pkg, ...deps] = line.split(' ')
    onLine({
      name: pkg,
      deps
    })
  })
  child.on('close', onDone || function () {});
}

// const json = {
//   nodes: [{
//     name: 'first',
//     deps: ['hi']
//   }],

//   links: [
//     // source, target, value
//   ],

//   index: {
//     [KNEXT]: 1 //index of next entry
//   },

//   // todo: allows for duplicates
//   addNode(node) {
//     this.nodes.push(node)
//     this.index[node.name] = this.index[KNEXT]++
//       node.deps.forEach(depname => {
//         if (!this.index[depname]) {
//           this.nodes.push({
//             name: depname
//           })
//           this.index[depname] = this.index[KNEXT]++
//         }
//         this.links.push({
//           source: this.index[node.name],
//           target: this.index[depname],
//           value: 1,
//         })
//       })
//   }
// }


const db2 = {
  nodes: {},
  links: [],

  nodes() {
    return Object.keys(this.nodes).map(n => this.nodes[n])
  },

  addNode(node) {
    this.nodes[node.name] = node;
    node.deps.forEach(depname => {
      if (!this.nodes[depname]) {
        this.nodes[depname] = {
          name: depname
        };
      }
      this.links.push({
        source: this.nodes[node.name],
        target: this.nodes[depname],
      })
    })
  }
}



/**
 * D3 !!!
 */

const width = 960,
  height = 500;

const svg = d3.select("#graph").append("svg")
  .attr("width", width)
  .attr("height", height);

// const force = d3.layout.force()
//   .gravity(0.05)
//   .distance(100)
//   .charge(-100)
//   .size([width, height]);

// force
//   .nodes(json.nodes)
//   .links(json.links)
//   .start();

// var node = svg.selectAll(".node")
//   .data(json.nodes)

// var link = svg.selectAll(".link")
//   .data(json.links)

// force.on("tick", function () {
//   link.attr("x1", function (d) {
//       return d.source.x;
//     })
//     .attr("y1", function (d) {
//       return d.source.y;
//     })
//     .attr("x2", function (d) {
//       return d.target.x;
//     })
//     .attr("y2", function (d) {
//       return d.target.y;
//     });

//   node.attr("transform", function (d) {
//     return "translate(" + d.x + "," + d.y + ")";
//   });
// });

// function draw() {

//   var node = svg.selectAll(".node")
//     .data(json.nodes)

//   var link = svg.selectAll(".link")
//     .data(json.links)

//   link.enter()
//     .append("line")
//     .attr("class", "link");

//   node.enter()
//     .append("g")
//     .attr("class", "node")
//     .call(force.drag)
//     .append("image")
//     .attr("xlink:href", "https://github.com/favicon.ico")
//     .attr("x", -8)
//     .attr("y", -8)
//     .attr("width", 16)
//     .attr("height", 16);

//   node.append("text")
//     .attr("dx", 12)
//     .attr("dy", ".35em")
//     .text(d => d.name);

//   node.exit().remove()
//   link.exit().remove()

// }



var color = d3.scaleOrdinal(d3.schemeCategory10)
let nodes = db2.nodes()
let links = db2.links

console.log(nodes, links)

var simulation = d3.forceSimulation(nodes)
  .force("charge", d3.forceManyBody().strength(-100))
  .force("link", d3.forceLink(links).distance(50))
  .force("x", d3.forceX())
  .force("y", d3.forceY())
  .alphaTarget(1)
  .on("tick", function ticked () {
    node
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)

    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y)
  });

var g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")"),
  link = g.append("g").attr("stroke", "#000").attr("stroke-width", 1.5).selectAll(".link"),
  node = g.append("g").attr("stroke", "#fff").attr("stroke-width", 1.5).selectAll(".node");
  
draw();

function draw() {
  const nodes = db2.nodes()
  const links = db2.links
  // Apply the general update pattern to the nodes.
  node = node.data(nodes, d => d.id);
  node.exit().remove();
  node = node.enter()
    .append("circle")
    .attr("fill", d => color(d.id))
    .attr("r", 8)
    .merge(node)

  // Apply the general update pattern to the links.
  link = link.data(links, d => d.source.id + "-" + d.target.id);
  
  link.exit().remove();
  link = link.enter().append("line").merge(link);
  // Update and restart the simulation.
  simulation.nodes(nodes);
  simulation.force("link").links(links);
  simulation.alpha(1).restart();
}

getDeps(({
  name,
  deps
}) => {
  var li = document.createElement("li");
  li.appendChild(document.createTextNode(`${name} - ${deps.join(', ')}`));
  document.getElementById('pkgs').appendChild(li);

  db2.addNode({
    name,
    deps
  })

  draw();
})