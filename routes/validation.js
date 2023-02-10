const express = require('express');

const router = express.Router();
const needle = require('needle');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/db');

const sendLinkUrl = `${process.env.BASE_URL}/auth/sendlink`;

router.post(
  '/loginform',
  body('email', 'Email required').trim().isEmail().escape(),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error(errors.array());
      // res.render('login', {
      //   title: 'Login to Moscow Ministorage',
      //   errors: errors.array(),
      // });
    } else {
      const dbUser = await prisma.user.findUnique({
        where: {
          email: req.body.email,
        },
      });
      let givenName = '';
      if (!dbUser) {
        givenName = 'Guest';
      } else {
        givenName = dbUser.givenName;
      }
      needle.post(
        sendLinkUrl,
        {
          destination: {
            email: req.body.email,
            givenName,
          },
        },
        { json: true },
        (err, response) => {
          if (err) {
            console.error(err);
            res.set(err);
            res.send();
          }
          if (response.body.success === true) {
            res.render('loginSuccessfullEmailSent');
          }
        },
      );
    }
  },
);

module.exports = router;

// const stateCodes = [
//   'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'PR', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'VI', 'WA', 'WV', 'WI', 'WY',
// ];

// const zipcodeRegex = /(^d{5}$)|(^d{9}$)|(^d{5}-d{4}$)/;
// const phoneRegex = /^([0-9]{3})[0-9]{3}-[0-9]{4}$/;

// const buildingEnum = ['1', '2', '3', '4', 'Outside'];
// const unitEnum = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '90', '91', '92', '93', '94', '95', '96', '97', '98', '99', '100', '101', '102', '103.01', '103.02', '103.03', '103.04', '103.05', '103.06', '103.07', '103.08', '104', '105.01', '105.02', '105.03', '105.04', '105.05', '105.06', '105.07', '105.08', '106', '107', '108', '109.01', '109.02', '109.03', '109.04', '109.05', '109.06', '109.07', '109.08', '109.09', '109.1', '109.11', '109.12', '109.13', '109.14', '109.15', '109.16', '110.01', '110.02', '110.03', '110.04', '110.05', '110.06', '110.07', '110.08', '110.09', '110.1', '110.11', '110.12', '110.13', '110.14', '110.15', '110.16', '111', '112', '113', '114', '115', '116', '117', '118', '119', '120', '121', '122', '123', '124', '125', '126', '127', '128', '129', '130', '131', '132', '133', '134', '135', '136', '137', '138', '139', '140', '141', '142', '143', '144', '145', '146', '147', '148', '149', '150', '151', '152', '153', '154', '155', '156', '157', '158', '159', '160', '161', '162', '163', '164', '165', '166', '167', '168', '169', '170', '171', '172', '173', '174', '175', '176', '177', '178', '179', '180', '181', '182', '183', '184', '185', '186', '187', '188', '189', '190', '191', '192', '193', '194', '195', '196', '197', '198', '199', '200', '201', '202', '302', '303', '304', '305', '306', '307', '308', '309', '310', '311', '312', '313', '314', '315', '316', '317', '318', '319', '320', '321', '322', '323', '324',
// ];
// const unitSizeEnum = ['04x06', '06x08', '06x10', '06x12', '06x16', '08x10', '08x12', '10x12', '12x16', '12x20', '12x22', '12x24', '12x32', 'Outside'];
// const roleEnum = ['ADMIN', 'CUSTOMER', 'EMPLOYEE'];