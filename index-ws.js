
const express = require('express');
const server = require('http').createServer();
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: __dirname });
});

server.on('request', app);
server.listen(port, () => {
  console.log(`Express server listening at http://localhost:${port}`);
});	

/** Begin websockets */
const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({ server });

wss.on('connection', function connection(ws) {
    console.log('New client connected');
    const numClients = wss.clients.size;
    console.log(`Number of connected clients: ${numClients}`);

    wss.broadcast(`Current visitors online: ${numClients}`);

    if(ws.readyState === ws.OPEN){
            ws.send(`Welcome to my server! There are currently ${numClients} visitors online.`);
    }

    ws.on('close', function close() {
        wss.broadcast(`Current visitors online: ${numClients}`);
        console.log('A Client has disconnected');
    });
});

wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === client.OPEN) {
            client.send(data);
        }
    });
};

/** End websockets */   

console.log(`WebSocket server started on port ${port}`);
