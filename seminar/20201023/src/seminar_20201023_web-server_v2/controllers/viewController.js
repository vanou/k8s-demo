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

const dbController = require('./dbController');

function *internalHomePageHandler(req, res) {
  let doc;
  try {
    doc = yield;
    res.render('index', {docItems: doc.items});
  } catch(err) {
    // internal error page
    console.log(err);
    res.render('internalError');
  }
}

exports.homePageHandler = function(req, res) {
  let internalHandler = internalHomePageHandler(req, res);
  internalHandler.next();
  // This dbController function call last next()
  dbController.fetchDoc(internalHandler, 0);
}

function *internalItemAdditionHandler(req, res) {
  let doc;
  try {
    doc = yield;
    res.render('index', {docItems: doc.items});
  } catch(err) {
    // internal error page
    console.log(err);
    res.render('internalError');
  }
}

exports.itemAdditionHandler = function(req, res) {
  let internalHandler = internalItemAdditionHandler(req, res);
  internalHandler.next();
  // This dbController function call last next()
  dbController.addItemToDoc(internalHandler, 0, req.body.itemName)
  .then(
    function() { dbController.fetchDoc(internalHandler, 0); }
  );
}

function *internalItemDeletionHandler(req, res) {
  let doc;
  try {
    doc = yield;
    res.render('index', {docItems: doc.items});
  } catch(err) {
    // internal error page
    console.log(err);
    res.render('internalError');
  }
}

exports.itemDeletionHandler = function(req, res) {
  let internalHandler = internalItemDeletionHandler(req, res);
  internalHandler.next();
  // This dbController function call last next()
  dbController.deleteItemFromDoc(internalHandler, 0, req.body.itemName)
  .then(
    function() { dbController.fetchDoc(internalHandler, 0); }
  );
}

exports.internalErrorHandler = function(err, req, res, next) {
  if(err) {
    console.log(err);
    res.send('Sorry. Internal Error Happens.');
  }
}
