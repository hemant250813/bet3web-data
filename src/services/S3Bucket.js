const Jimp = require("jimp");
const path = require("path");
const fs = require("fs");
const { s3 } = require("../config/aws");
const { S3_ENABLE } = require("./Constants");
const { log } = require("console");

module.exports = {
  /**
   * @description This function use for uploading the file through base64.
   * @param fileName
   * @param storagePath
   * @param file
   * @param res
   * @returns {*}
   */
  base64ImageUpload: async (fileName, storagePath, file, res) =>
    // eslint-disable-next-line no-async-promise-executor
    new Promise(async (resolve, reject) => {
      const base64 = file;
      const extension = base64.split(";")[0].split("/")[1];
      const decodedImage = Buffer.from(
        base64.replace(/^data:image\/\w+;base64,/, ""),
        "base64"
      );

      const image = await Jimp.read(decodedImage);

      await image.quality(85);
      if (process.env.S3_ENABLE === S3_ENABLE) {
        const operatedImageBuffer = await image.getBufferAsync(Jimp.MIME_PNG);
        const params = {
          Bucket: process.env.AMZ_BUCKET,
          Key: `${storagePath}/${fileName}`,
          Body: operatedImageBuffer,
          ACL: "public-read", // Make the file publicly readable
          ContentEncoding: "base64", // required
          ContentType: extension,
        };

        s3.putObject(params, function (perr, pres) {
          if (perr) {
            reject({
              code: 500,
              perr: perr,
            });
          } else {
            return resolve({
              code: 200,
              body: pres,
            });
          }
        });
      } else {
        const newLocation =
          path.join(__dirname, "../../public/uploads") +
          "/" +
          storagePath +
          "/";
        if (!fs.existsSync(newLocation)) {
          fs.mkdirSync(newLocation, { recursive: true }, () => {});
        }
        await image
          .writeAsync(`${newLocation}/${fileName}`)
          .then((pres) => {
            return resolve({
              code: 200,
              body: pres,
            });
          })
          .catch((e) => {
            return reject({
              code: 500,
            });
          });
      }
    }).catch((e) => {
      console.log("aws bucket error", e);
    }),

  /**
   * @description This function use to remove the file.
   * @param file
   * @param storagePath
   * @param res
   * @returns {*}
   */
  removeOldImage: (file, storagePath, res) =>
    new Promise((resolve, reject) => {
      if (process.env.S3_ENABLE === S3_ENABLE) {
        const params = {
          Bucket: `${process.env.AMZ_BUCKET}/${storagePath}`,
          Key: file,
        };
        try {
          return s3.deleteObject(params, (err, data) => {
            if (data) {
              resolve({
                code: 200,
                body: data,
              });
            }
            return reject({
              code: 500,
              err: err,
            });
          });
        } catch {
          return reject({
            code: 500,
            err: err,
          });
        }
      } else {
        const filePath =
          path.join(__dirname, "../../public/uploads") +
          "/" +
          storagePath +
          "/";
        fs.unlink(`${filePath}${file}`, function (error) {
          if (error) {
            return reject({
              code: 500,
              err: error,
            });
          }
          resolve(true);
        });
      }
      return null;
    }),

  /**
   * @description This function use for generating image link
   * @param folder
   * @param name
   * @returns {*}
   */

  mediaUrl: (folder, date, filename) => {
    if (filename && filename !== "") {
      return `${process.env.API_URL}public/uploads/${folder}/${date}/${filename}`;
    }
    return "";
  },

  /**
   * @description This function use for generating image link
   * @param folder
   * @param name
   * @returns {*}
   */

  s3MediaUrl: (folder, filename) => {
    if (filename && filename !== "") {
      return `${process.env.AMZ_BUCKET_URL}/${folder}/${filename}`;
    }
    return "";
  },

  /**
   * @description This function use for generating image link
   * @param folder
   * @param name
   * @returns {*}
   */

  mediaUrlForS3: (folder, username, profilename, filename) => {
    if (
      username &&
      username !== "" &&
      profilename &&
      profilename !== "" &&
      filename &&
      filename !== ""
    ) {
      if (process.env.S3_ENABLE === Constants.TRUE) {
        return `${process.env.AMZ_BUCKET_URL}${folder}/${username}/${profilename}/${filename}`;
      } else {
        return `${process.env.API_URL}public/uploads/${folder}/${username}/${profilename}/${filename}`;
      }
    }
    return "";
  },
};
