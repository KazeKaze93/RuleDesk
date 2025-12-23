/**
 * scripts/viz/server.cjs
 * v1.2 - Fix infinite connecting issue
 */
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const chokidar = require("chokidar");
const madge = require("madge");
const { spawn } = require("child_process");
const path = require("path");

const PORT = 3000;
const ROOT_DIR = path.resolve(__dirname, "../../");
const SRC_DIR = path.join(ROOT_DIR, "src");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Cache for immediate load
let lastGraphData = null;

io.on("connection", (socket) => {
  console.log("🔌 Client connected");
  if (lastGraphData) {
    socket.emit("graph-data", lastGraphData);
  } else {
    // First build might be in progress or not started
    buildGraph().then((data) => {
      lastGraphData = data;
      socket.emit("graph-data", data);
    });
  }
});

// --- HTML Frontend ---
const HTML_CONTENT = `
<!DOCTYPE html>
<html>
<head>
    <title>Code Dependency Graph</title>
    <script src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
    <script src="/socket.io/socket.io.js"></script>
    <style>
        body { margin: 0; font-family: sans-serif; background: #1e1e1e; color: #ccc; overflow: hidden; }
        #mynetwork { width: 100vw; height: 100vh; }
        #controls { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 8px; z-index: 100; }
        .legend-item { display: flex; align-items: center; margin-bottom: 4px; font-size: 12px; }
        .dot { width: 10px; height: 10px; border-radius: 50%; margin-right: 8px; }
        button { background: #333; color: white; border: 1px solid #555; padding: 5px 10px; cursor: pointer; }
        button:hover { background: #444; }
        #status { font-size: 12px; color: #888; margin-top: 5px; }
    </style>
</head>
<body>
    <div id="controls">
        <h3 style="margin-top:0">Dependency Map</h3>
        <div class="legend-item"><div class="dot" style="background:#97C2FC"></div>TypeScript</div>
        <div class="legend-item"><div class="dot" style="background:#FFD700"></div>Python</div>
        <div class="legend-item"><div class="dot" style="background:#FB7E81"></div>Orphan (No deps)</div>
        <hr style="border-color: #444;">
        <button onclick="fitGraph()">Fit Graph</button>
        <button onclick="togglePhysics()">Toggle Physics</button>
        <div id="status">Connecting...</div>
    </div>
    <div id="mynetwork"></div>

    <script>
        const socket = io();
        let network = null;
        let physicsEnabled = true;

        const options = {
            nodes: { 
                shape: 'dot', 
                size: 16,
                font: { color: '#ffffff', size: 14, strokeWidth: 2, strokeColor: '#000000' }
            },
            edges: {
                color: { color: '#555555', highlight: '#00ff00' },
                arrows: { to: { enabled: true, scaleFactor: 0.5 } },
                smooth: { type: 'continuous' }
            },
            physics: {
                stabilization: false,
                barnesHut: { gravitationalConstant: -2000, springConstant: 0.04, springLength: 95 }
            },
            layout: { randomSeed: 2 }
        };

        socket.on('graph-data', (data) => {
            const statusEl = document.getElementById('status');
            if(statusEl) statusEl.innerText = 'Nodes: ' + data.nodes.length;
            drawGraph(data.nodes, data.edges);
        });

        function drawGraph(nodesData, edgesData) {
            const container = document.getElementById('mynetwork');
            const data = { nodes: new vis.DataSet(nodesData), edges: new vis.DataSet(edgesData) };
            
            if (!network) {
                network = new vis.Network(container, data, options);
                network.on("click", function (params) {
                    if (params.nodes.length > 0) {
                        console.log("Selected:", params.nodes[0]);
                    }
                });
            } else {
                network.setData(data);
            }
        }

        function fitGraph() { network.fit(); }
        function togglePhysics() {
            physicsEnabled = !physicsEnabled;
            network.setOptions({ physics: physicsEnabled });
        }
    </script>
</body>
</html>
`;

app.get("/", (req, res) => res.send(HTML_CONTENT));

// --- ANALYZER LOGIC ---

async function getTSGraph() {
  try {
    const res = await madge(SRC_DIR, {
      fileExtensions: ["ts", "tsx"],
      tsConfig: path.join(ROOT_DIR, "tsconfig.json"),
    });
    return res.obj();
  } catch (e) {
    console.error("Madge Error:", e);
    return {};
  }
}

function getPyGraph() {
  return new Promise((resolve) => {
    const pyScript = path.join(__dirname, "py_parser.py");
    const pythonProcess = spawn("python", [pyScript, SRC_DIR]);

    let data = "";
    pythonProcess.stdout.on("data", (chunk) => (data += chunk));

    pythonProcess.on("close", (code) => {
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        console.error("Python parse error (JSON)");
        resolve({});
      }
    });
  });
}

async function buildGraph() {
  console.log("🔄 Rebuilding graph...");
  const [tsDeps, pyDeps] = await Promise.all([getTSGraph(), getPyGraph()]);

  const nodes = [];
  const edges = [];
  const nodeSet = new Set();

  const addNode = (id, type) => {
    if (!nodeSet.has(id)) {
      let color = type === "ts" ? "#97C2FC" : "#FFD700";
      nodes.push({
        id,
        label: path.basename(id),
        title: id,
        color: color,
        group: type,
      });
      nodeSet.add(id);
    }
  };

  for (const [file, deps] of Object.entries(tsDeps)) {
    addNode(file, "ts");
    deps.forEach((dep) => {
      addNode(dep, "ts");
      edges.push({ from: file, to: dep });
    });
  }

  for (const [file, deps] of Object.entries(pyDeps)) {
    addNode(file, "py");
    deps.forEach((dep) => {
      addNode(dep, "py");
      edges.push({ from: file, to: dep });
    });
  }

  nodes.forEach((n) => {
    const hasEdges = edges.some((e) => e.from === n.id || e.to === n.id);
    if (!hasEdges) n.color = "#FB7E81";
  });

  return { nodes, edges };
}

// --- INITIALIZATION ---

let debounceTimer;
const triggerUpdate = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    const data = await buildGraph();
    lastGraphData = data; // Cache it!
    io.emit("graph-data", data);
    console.log(`✅ Graph updated: ${data.nodes.length} nodes`);
  }, 1000);
};

chokidar
  .watch(SRC_DIR, { ignored: /node_modules|\.git|dist|out/ })
  .on("all", (event, path) => {
    if (path.endsWith(".ts") || path.endsWith(".tsx") || path.endsWith(".py")) {
      triggerUpdate();
    }
  });

const start = async () => {
  try {
    const { default: open } = await import("open");

    server.listen(PORT, () => {
      console.log(`🚀 Visualizer running at http://localhost:${PORT}`);
      open(`http://localhost:${PORT}`);
      triggerUpdate(); // First run
    });
  } catch (err) {
    console.error("Failed to start server:", err);
  }
};

start();
