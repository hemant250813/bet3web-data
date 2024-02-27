const bcrypt = require("bcrypt");
const ip = require("ip");
const { User, UserLoginHistory } = require("../models");
const {
  ACTIVE,
} = require("../services/Constants");
const { issueAdmin } = require("../services/Admin_jwtToken");
const { issueUser } = require("../services/User_jwtToken");

module.exports = {
  /**
   * @description This function use for converting string to uppercase.
   * @param length
   * @returns {*}
   */
  authLogin: async (req, res, reqParam) => {
    let findQuery = {};
    findQuery = {
      $and: [
        { type: { $eq: 1 } },
        {
          $or: [
            { email: { $eq: reqParam.user } },
            { username: { $eq: reqParam.user } },
          ],
        },
      ],
    };

    let admin = await User.findOne(findQuery);

    if (admin) {
      if (admin?.status === ACTIVE) {
        const comparePassword = await bcrypt.compare(
          reqParam.password,
          admin.password
        );

        if (comparePassword) {
          const alreadyExitList = await User.find(
            {},
            { username: 1, email: 1, mobileNo: 1 }
          );
          
          let system_ip = ip.address(); //system ip address
     
          // let browser_ip = await axios.get(
          //   "https://api.ipify.org/?format=json" //get browser ip address
          // );
          let browser_ip = "0.0.0.1"

          const superAdminExpTime =
            Math.floor(Date.now() / 1000) +
            60 * 60 * 24 * process.env.SUPER_ADMIN_TOKEN_EXP;
           
          const payload = {
            id: admin._id,
            type: admin.type,
            exp: superAdminExpTime,
          };
          
          const token = issueAdmin(payload);
          const meta = { token };

          let loginHistory = await UserLoginHistory.findOne({
            userId: admin._id,
          });
          let loginHistoryObject = {};
          if (loginHistory) {
            loginHistoryObject = {
              loginDetails: {
                ip_address: {
                  system_ip: system_ip,
                  browser_ip: browser_ip?.data?.ip,
                },
                last_login: new Date(),
              },
            };

            let update = {};
            if (loginHistory?.loginDetails?.length !== 10) {
              tenRecords = loginHistoryObject;
              update = {
                $push: {
                  loginDetails: loginHistoryObject?.loginDetails,
                },
              };
            } else {
              update = {
                $set: {
                  loginDetails: [],
                },
              };
            }

            await UserLoginHistory.updateOne({ userId: admin._id }, update);
          } else {
            loginHistoryObject = {
              userId: admin._id,
              loginDetails: {
                ip_address: {
                  system_ip: system_ip,
                  browser_ip: browser_ip?.data?.ip,
                },
                last_login: new Date(),
              },
            };

            await UserLoginHistory.create(loginHistoryObject);
          }

          const adminObj = {
            name: admin.name,
            username: admin.username,
            type: admin.type,
            email: admin.email,
            mobileNo: admin.mobileNo,
            balance: admin.balance,
            alreadyExitList: alreadyExitList,
          };

          let adminob = {
            adminObj: adminObj,
            meta: meta,
          };
          return adminob;
        } else {
          return "userNamePasswordNotMatch";
        }
      } else {
        return "accountIsInactive";
      }
    } else {
      return "userNameNotExist";
    }
  },

  /**
   * @description This function use for create random number.
   * @param length
   * @returns {*}
   */
  userLogin: async (req, res, reqParam) => {
    let findQuery = {};
    findQuery = {
      $and: [
        { type: { $eq: 2 } },
        {
          $or: [
            { email: { $eq: reqParam.user } },
            { username: { $eq: reqParam.user } },
          ],
        },
      ],
    };

    const user = await User.findOne(findQuery);
    let browser_ip =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    const system_ip = req.clientIp;
    if (user) {
      if (user?.status === ACTIVE) {
        const comparePassword = await bcrypt.compare(
          reqParam.password,
          user.password
        );
        if (comparePassword) {
          const USER_TOKEN_EXPIRY_TIME =
            Math.floor(Date.now() / 1000) +
            60 * 60 * 24 * process.env.USER_TOKEN_EXP;

          const payload = {
            id: user._id,
            exp: USER_TOKEN_EXPIRY_TIME,
          };

          const token = issueUser(payload);
          const meta = { token };
          let tokenUpdate = {};

          tokenUpdate = {
            $set: {
              last_login: new Date(),
              token: token,
              "ip_address.system_ip": system_ip,
              "ip_address.browser_ip": browser_ip,
            },
          };

          await User.updateOne({ _id: user?._id }, tokenUpdate);

          let userOb = {
            user: user,
            meta: meta,
          };
          return userOb;
        } else {
          return "emailPasswordNotMatch";
        }
      } else {
        return "accountIsInactive";
      }
    } else {
      return "userNameNotExist";
    }
  },
};
