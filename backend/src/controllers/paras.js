const { Op } = require("sequelize");
const { Paras,  sequelize } = require("../sequelize");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));


module.exports = {
  
  getParases: async (req, res) => {
    const params = req.query
    var url = new URL('https://api-v2-mainnet.paras.id/collections')
    url.search = new URLSearchParams(params).toString();
    const response = await fetch(url)
    const data = await response.json()

    return res.status(200).json(data);
  },
  getStat: async (req, res) => {
    const params = req.query
    var url = new URL('https://api-v2-mainnet.paras.id/collection-stats')
    url.search = new URLSearchParams(params).toString();
    const response = await fetch(url)
    const data = await response.json()
    return res.status(200).json(data);
  },
  getAddresses: async (req, res) => {
    const addresses = await Paras.findAll({
      attributes: ["address"],
      raw: true,
    });
    return res.status(200).json(addresses.map(address => address.address));
  },
  addParas: async (req, res) => {
    // body -> { address }
    console.log('--', req.body)
    const [paras, created] = await Paras.findOrCreate({
      where: req.body,
      defaults: req.body,
    });

    if (!created)
      return res
        .status(403)
        .json({ errors: "Collection is already in the Market list" });

    return res.status(200).json({ paras });
  },
  removeParas: async (req, res) => {
    // body -> {address}
   
    const remParas = await Paras.destroy({
      where: req.body,
    });
    // If user tries to remove tweet from Paras that is not added to Paras
    if (remParas == 0)
      return res
        .status(403)
        .json({ errors: "Collection is already not in the Market list" });

    return res.status(200).json({ remParas });
  },
};
