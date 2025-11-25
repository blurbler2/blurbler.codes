
const express = require('express');
const { get } = require('http');
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

// interrupt handler to close the database connection gracefully
process.on('SIGINT', () => {
    console.log('Received SIGINT. Shutting down gracefully...');
    // close all websocket connections
    wss.clients.forEach((client) => {
        client.close();
    });
    console.log('Closed all websocket connections.');
    server.close(() => {
        shutdownDatabase(); 
    });
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

    // write session info to database
    db.run(`INSERT INTO visitors(count, time) VALUES(${numClients}, datetime('now'))` , function(err) {
        if (err) {
            return console.error(err.message);
        }
        console.log(`A row has been inserted with rowid ${this.lastID}`);
    });

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

/** Begin database */

const sqlite = require('sqlite3');
// const db = new sqlite.Database('./database.db');
const db = new sqlite.Database(':memory:');

db.serialize(() => {
    db.run(`
        CREATE TABLE visitors (
            count INTEGER,
            time TEXT
        )
    `);
});

function getCounts() {
    db.each('SELECT * FROM visitors', (err, row) => {
        if (err) {
            console.error(err.message);
        }
        console.log(`Count: ${row.count}, Time: ${row.time}`);
    });
}

function shutdownDatabase() {
    getCounts();
    console.log('Shutting down database...');
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Closed the database connection.');
    });

}

/** End database */