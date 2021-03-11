import express from 'express';
let app = require('express')();
let http = require('http').createServer(app);
export let io = require('socket.io')(http, {
    handlePreflightRequest: (req, res) => {
        const headers = {
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Origin": req.headers.origin,
            "Access-Control-Allow-Credentials": true
        };
        res.writeHead(200, headers);
        res.end();
}});

import mongoose from 'mongoose';

import { listServices } from "./src/services/serviceProjService";

import { taskRoutes } from "./src/routes/taskRoutes.js";
import { resourceRoutes } from "./src/routes/resourceRoutes";
import { projectRoutes } from "./src/routes/ProjectRoutes";
import { serviceRoutes } from "./src/routes/serviceRoutes";
import { milestonesRoutes } from "./src/routes/milestonesRoutes";
import { groupTaskRoutes } from "./src/routes/groupTaskRoutes";

const PORT = 3000;

const socket = require('socket.io-client');
let client = socket.connect('http://51.15.137.122:18000/', {reconnect: true});

client.on('connect', () => {
    console.log('connected');

    client.emit('getServices');
    client.on('servicies', (data) => console.log(data));

    // client.emit('needHelp');
    // client.on('info', (data) => console.log(data));

    io.on('connection', (socket) => {
        console.log(`Socket ${socket.id} connected`);
    
        socket.on('disconnect', () => {
            console.log(`socket ${socket.id} disconnected`);
        });
    
        /**
         * On getUpdate event, send an update event containing the services object
         */
        socket.on('getUpdate', () => {
            let listServicesPromise = listServices();
            
            listServicesPromise.then((data) => {client.emit('sendUpdate', data);}, error => console.log(error));
        });
    });

    client.on('projectUpdated', (data) => {
        console.log(data);
        io.emit('update', data);
    });
    
    client.on('errorOnProjectUpdate', (data) => console.log(data));
});


app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-Width, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
    next();
});

export const autoIncrement = require('mongoose-auto-increment');

// mongoose connection
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/NodeJSDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, error => {
    if(error) {
        console.log(error);
        process.exit(1);       
    }
});

// Routes initialisation
taskRoutes(app);
resourceRoutes(app);
projectRoutes(app);
serviceRoutes(app);
milestonesRoutes(app);
groupTaskRoutes(app);

http.listen(PORT, 
    console.log(`listening on port ${PORT}`)
);