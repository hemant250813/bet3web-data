var rs = require("jsrsasign");
var rsu = require("jsrsasign-util");

var priv_pem = rsu.readFile("./ec.key");
var priv_key = rs.KEYUTIL.getKey(priv_pem);
var pub_pem = rsu.readFile("./ec.pub");
var pub_key = rs.KEYUTIL.getKey(pub_pem);

module.exports = {
  /**
   * @description This function use to create signature for st8.
   * @param user
   * @param authId
   * @returns boolean
   */
  createSignature: async (data) => {
    var sign = new rs.KJUR.crypto.Signature({ alg: "SHA256withECDSA" });
    sign.init(priv_key);
    var sign_hex = sign.signString(data);
    var sign_b64 = rs.hextob64(sign_hex);
    return sign_b64;
  },

  /**
   * @description This function use to verify signature of st8.
   * @param user
   * @param authId
   * @returns boolean
   */
  verifySignature: async (sign_b64, data) => {
    var signature_to_verify = rs.b64nltohex(sign_b64);
    var sign_pub = new rs.KJUR.crypto.Signature({ alg: "SHA256withECDSA" });
    sign_pub.init(pub_key);
    sign_pub.updateString(data);
    var is_valid = sign_pub.verify(signature_to_verify);
    return is_valid;
  },
};
