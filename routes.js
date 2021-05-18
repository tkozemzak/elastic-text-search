const express = require("express");
const router = express.Router();

const elastic = require("elasticsearch");

const bodyParser = require("body-parser").json();

const elasticClient = elastic.Client({
  host: "localhost:9200",
});

router.use((req, res, next) => {
  elasticClient
    .index({
      index: "logs",
      body: {
        url: req.url,
        method: req.method,
      },
    })
    .then((res) => {
      console.log("Logs Indexed");
    })
    .catch((err) => {
      console.log("ERROR: ", err);
    });
  next();
});
