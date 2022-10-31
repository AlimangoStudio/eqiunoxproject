require("dotenv").config();
const fs = require("fs")
const https = require("https")
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const Paras = require("./routes/paras");


const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));
app.use("/paras", Paras);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`server started on port ${PORT}`));

// https
//   .createServer(
// 		// Provide the private and public key to the server by reading each
// 		// file's content with the readFileSync() method.
//     {
//       key: fs.readFileSync("key.pem"),
//       cert: fs.readFileSync("cert.pem"),
//     },
//     app
//   )
//   .listen(PORT, () => {
//     console.log("serever is runing at port 5000");
//   });

