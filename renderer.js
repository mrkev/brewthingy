// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const split = require('split');
const spawn = require('child_process').spawn;

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

const db2 = {
  nodes: {},
  links: [],

  nodes() {
    return Object.keys(this.nodes).map(n => this.nodes[n])
  },

  addNode(node) {
    if (!this.nodes[node.name]) {
      this.nodes[node.name] = node;
    } else {
      this.nodes[node.name].deps = node.deps
    }
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
  .attr("height", height)

  svg.append("svg:defs").append("svg:marker")
  .attr("id", "triangle")
  .attr("refX", 12)
  .attr("refY", 3)
  .attr("markerWidth", 30)
  .attr("markerHeight", 30)
  .attr("orient", "auto")
  .append("path")
  .attr("d", "M 0 0 6 3 0 6 1.5 3")
  .style("fill", "black");
  
let nodes = db2.nodes()
let links = db2.links

console.log(nodes, links)

var simulation = d3.forceSimulation(nodes)
  .force("charge", d3.forceManyBody().strength(-150))

  .force("link", d3.forceLink(links).distance(100))
  .force("x", d3.forceX())
  .force("y", d3.forceY())
  .alphaTarget(1)
  .on("tick", function ticked() {
    node
      .attr("transform", d => `translate(${d.x},${d.y})`);

    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y)
  });

var g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")"),
  link = g.append("g").attr("class", 'layer_links').selectAll(".link"),
  node = g.append("g").attr("class", 'layer_nodes').selectAll(".node");

d3.select(".layer_nodes")
  .call(d3.drag()
    .subject(dragsubject)
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended));

draw();

function draw() {
  const nodes = db2.nodes()
  const links = db2.links
  // Apply the general update pattern to the nodes.
  node = node.data(nodes, d => d.name);
  node.exit().remove();

  node = node.enter().append("g")
    .attr('class', 'node')
    .merge(node)

  node.append('circle')
    .attr('r', 8)

  node.append("text")
    .attr("dx", 12)
    .attr("dy", ".35em")
    .text(d => d.name)
    .call(function getBB(selection) {
      selection.each((d, i) => d.bbox = selection.nodes()[i].getBBox())
    })

  node.insert("rect", "text")
    .attr("width", function (d) {
      return d.bbox.width
    })
    .attr("height", function (d) {
      return d.bbox.height
    })
    .attr("x", 12)
    .attr("y", "-.35em")
    .style("fill", "yellow");



  // Apply the general update pattern to the links.
  link = link.data(links, d => d.source.name + "-" + d.target.name);
  link.exit().remove();
  link = link.enter()
    .append("line")
    .attr("marker-end", "url(#triangle)")
    .attr('class', 'link')
    .merge(link);
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


function dragstarted() {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d3.event.subject.fx = d3.event.subject.x;
  d3.event.subject.fy = d3.event.subject.y;
}

function dragged() {
  d3.event.subject.fx = d3.event.x;
  d3.event.subject.fy = d3.event.y;
}

function dragended() {
  if (!d3.event.active) simulation.alphaTarget(0);
  d3.event.subject.fx = null;
  d3.event.subject.fy = null;
}

function dragsubject() {
  return simulation.find(d3.event.x, d3.event.y);
}