const router = require("express").Router();
const {
  getParases,
  addParas,
  removeParas,
  getStat,
  getAddresses,
} = require("../controllers/paras");

router.get("/", getParases);
router.get("/stat", getStat);
router.get("/addresses", getAddresses);
router.post("/add", addParas);
router.delete("/remove", removeParas);

module.exports = router;
