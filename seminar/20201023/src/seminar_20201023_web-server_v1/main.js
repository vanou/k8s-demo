// SPDX-License-Identifier: Apache-2.0

// Copyright 2020 Vanou Ishii
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const os = require('os');
const process = require('process');
const express = require('express');
const app = express();
const { MongoClient } = require('mongodb');
const layouts = require('express-ejs-layouts');
const viewController = require('./controllers/viewController');
const dbController = require('./controllers/dbController');

// Web server configuration
const hostname = os.hostname();
const netInterfaces = os.networkInterfaces();
const webPort = process.env.WEB_PORT || 80;
const dbPort = process.env.DB_PORT || 27017;
const dbTimeout = process.env.DB_TIMEOUT || 10000;

const dbURL = process.env.DB_URL;
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;
const dbName = process.env.DB_NAME;
const dbColl = process.env.DB_COLL;

if ( !( dbURL && dbUser && dbPass && dbName && dbColl) ) {
     console.error('All of following environment variables should be set: DB_URL, DB_USER, DB_PASS, DB_NAME & DB_COLL');
     process.exit(1);
}

const dbClient = new MongoClient(`mongodb://${dbUser}:${dbPass}@${dbURL}:${dbPort}/${dbName}`);
dbController.setDBClient(dbClient);
dbController.setDBTimeout(dbTimeout);
dbController.setDBName(dbName);
dbController.setCollName(dbColl);

const versionNum = '1';

var netAddressList = {};
for (let i in netInterfaces) {
  if ( i !== 'lo' && netInterfaces[i].length !== 0 ) {
    netAddressList[i] = [];
    for ( let j of netInterfaces[i] ) {
      netAddressList[i].push(j['address']);
    }
  }
}

// First try to connect to DB
dbController.checkDBConnection();

// Configure template engine
app.set('view engine', 'ejs');
app.locals.ejsHostname = hostname;
app.locals.ejsAddressList = netAddressList;
app.locals.ejsVersion = versionNum;
app.use(layouts);

// Configure MW
app.use( express.urlencoded({extended: false}) );
app.use(express.json());

// DB Connection Check MW
app.use(dbController.checkDBConnectionMW);

// Page handling for POST
app.post('/delete-item', viewController.itemDeletionHandler);
app.post('/*', viewController.itemAdditionHandler);

// Page handling for GET
app.get('/*', viewController.homePageHandler);


// Configure error handler
app.use(viewController.internalErrorHandler);

app.listen(webPort);
console.log(`Web server starts & listens on port ${webPort}`);
console.log(`URL of peer DB server: ${dbURL}`);
console.log(`Port number of peer DB server: ${dbPort}`);
