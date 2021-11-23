const functions = require("firebase-functions");
const admin = require('firebase-admin');
const fs = require('fs');
const axios = require('axios').default;

const path = `${__dirname}/files/img.jpeg`;

exports.uploadImageToStorage = async function uploadImageToStorage(change) {
    functions.logger.info("Upload image to storage triggered...");
    if (change.after.exists && change.after.data()) {
        functions.logger.info("Triggering storage upload for beer ", change.after.data().name);

        await downloadFile(change.after.data().imageExternalUrl);
        await uploadFile();
    }
}

async function downloadFile(url) {
    try {
        functions.logger.info("Starting download...");
        functions.logger.info("URL", url);
        const imageFile = await axios({
            url: url,
            method: "GET",
            responseType: "stream"
        });
        functions.logger.info("Got axios file");
        const download = fs.createWriteStream(path, { flags: 'w+' });
        functions.logger.info("Created write stream");
        await new Promise((resolve) => {
            functions.logger.info("Resolving promise...");
            imageFile.data.pipe(download);
            functions.logger.info("Piped...");
            download.on("close", resolve);
            download.on("error", functions.logger.info);
        });
        functions.logger.info("Resolved promised...");
    } catch (e) {
        functions.logger.info("Exception while downloading file", e);
    }
}

async function uploadFile() {
    try {
        functions.logger.info("Uploading file !");
        admin.storage().bucket().upload(path).then(() => {
            functions.logger.info("Upload completed !");
        });
    } catch (e) {
        functions.logger.info("Exception while uploading file", e);
    }
}