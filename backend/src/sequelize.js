const { Sequelize } = require("sequelize");
const ParasModel = require("./models/paras");

// Connect to database
const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT } = process.env;
console.log("Env User", process.env.DB_USER)
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: "mysql",
});
(async () => {
  try {
    const res = await sequelize.sync();
  } catch (err) {
    console.log(err);
  }
})();

const Paras = ParasModel(sequelize);
console.log( Paras === sequelize.models.Paras)

module.exports = {
 
  Paras,
  sequelize,
};
