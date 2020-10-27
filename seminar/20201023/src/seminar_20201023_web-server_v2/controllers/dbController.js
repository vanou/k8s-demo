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

var _dbClient;
var _dbTimeout;
var _dbName;
var _collName;

exports.setDBClient = function(dbClient) {
  _dbClient = dbClient;
}

exports.setDBTimeout = function(dbTimeout) {
  _dbTimeout = dbTimeout;
}

exports.setDBName = function(dbName) {
  _dbName = dbName;
}

exports.setCollName = function(collName) {
  _collName = collName;
}

function dbOperationTimer(dbP, fulfilled, rejected) {
  let targetP = Promise.resolve(dbP);
  let timerP = new Promise(function(resolve, reject) {
    setTimeout(function() { reject(); }, _dbTimeout);
  });

  Promise.race([ targetP, timerP ])
  .then(fulfilled, rejected);
}

function returnTargetCollPromise() {
  let targetDB = _dbClient.db(_dbName);
  return new Promise( function(resolve, reject) {
    targetDB.collection(_collName, function(err, coll) {
      if (err) {
        reject(err);
      } else {
        resolve(coll);
      }
    });
  });
}

exports.checkDBConnection = function() {
  if (! _dbClient.isConnected()) {
    dbOperationTimer(_dbClient.connect(),
      function() { console.log('Get connected to DB'); },
      function() { console.log('Timeout trying to connect to DB'); }
    );
  } else {
    console.log('Already connected to DB');
  }
}

exports.checkDBConnectionMW = function(req, res, next) {
  if (! _dbClient.isConnected()) {
    dbOperationTimer(_dbClient.connect(),
      function() {
        console.log('Get connected to DB'); next();
      },
      function() {
        console.log('Timeout trying to connect to DB');
        res.render('noConnectionToDB');
      }
    );
  } else {
    next();
  }
}

exports.fetchDoc = function(viewIt, id) {
  return returnTargetCollPromise()
  .then(
    function fullfilled(coll) {
      return coll.findOne( { '_id': id } );
    }
  )
  .then(
    function fulfilled(doc) {
      viewIt.next(doc);
    }
  )
  .catch(
    function rejected(err) {
      viewIt.throw(err);
    }
  );
}

exports.addItemToDoc = function(viewIt, id, itemName) {
  return returnTargetCollPromise()
  .then(
    function fullfilled(coll) {
      if ( itemName.length !== 0 ) {
        return coll.updateOne( { '_id': id }, { '$addToSet': { 'items': itemName } } );
      }
    }
  )
  .catch(
    function rejected(err) {
      viewIt.throw(err);
    }
  );
}

exports.deleteItemFromDoc = function(viewIt, id, itemName) {
  return returnTargetCollPromise()
  .then(
    function fullfilled(coll) {
      if ( itemName.length !== 0 ) {
        return coll.updateOne( { '_id': id }, { '$pull': { 'items': itemName } } );
      }
    }
  )
  .catch(
    function rejected(err) {
      viewIt.throw(err);
    }
  );
}
