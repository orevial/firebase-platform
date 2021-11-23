const functions = require("firebase-functions");
const admin = require('firebase-admin');
const { populateDatabase } = require("./populate-database-function");
const { uploadImageToStorage } = require("./upload-image-to-storage");

admin.initializeApp();

exports.populateDatabase = functions
   .region('europe-west1')
   .https.onRequest(async () => {
      return populateDatabase();
   });

exports.uploadImageToStorage = functions
   .region('europe-west1')
   .firestore
   .document('breweries/{breweryId}/beers/{beerId}')
   .onWrite(async (change) => {
      await uploadImageToStorage(change);
   });