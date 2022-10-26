require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const Paras = require("./routes/Paras");


const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));
app.use("/paras", Paras);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`server started on port ${PORT}`));
