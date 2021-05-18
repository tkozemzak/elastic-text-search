const express = require("express");
const router = express.Router();
const quotes = require("./quotes.json");

const elastic = require("elasticsearch");

const bodyParser = require("body-parser").json();

const elasticClient = new elastic.Client({
  host: "localhost:9200",
});

let bulk = [];

quotes.forEach((quote) => {
  bulk.push({
    index: {
      _index: "quotes",
      _type: "quotes_list",
    },
  });
  bulk.push(quote);
});

elasticClient.bulk({ body: bulk }, function (err, response) {
  if (err) {
    console.log("Bulk operation failed", err);
  } else {
    console.log("successfully imported: ", quotes.length);
  }
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

router.post("/quotes", bodyParser, (req, res) => {
  elasticClient
    .index({
      index: "quotes",
      body: req.body,
    })
    .then((res) => {
      return res.status(200).json({
        msg: "Quote Indexed",
      });
    })
    .catch((err) => {
      return res.status(500).json({
        msg: "Error",
        err,
      });
    });
});

router.get("/quotes/:id", (req, res) => {
  console.log("req");
  let query = {
    index: "quotes",
    id: req.params.id,
  };
  elasticClient
    .get(query)
    .then((res) => {
      if (!res) {
        return res.status(404).json({
          quote: res,
        });
      }
      return res.status(200).json({
        quote: res,
      });
    })
    .catch((err) => {
      return res.status(500).json({
        msg: "Error. Not Found",
        err,
      });
    });
});

router.put("/quotes/:id", bodyParser, (req, res) => {
  elasticClient
    .update({
      index: "quotes",
      id: req.params.id,
      body: {
        doc: req.body,
      },
    })
    .then((res) => {
      return res.status(200).json({
        msg: "quote updated",
      });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({
        msg: "Error",
        err,
      });
    });
});

router.delete("/quotes/:id", (req, res) => {
  elasticClient
    .delete({
      index: "quotes",
      id: req.params.id,
    })
    .then((res) => {
      res.status(200).json({
        msg: "Quote Deleted",
      });
    })
    .catch((err) => {
      res.status(404).json({
        msg: "Error",
      });
    });
});

router.get("/quotes", (req, res) => {
  let query = {
    index: "quotes",
  };
  if (req.query.quote) query.q = `*${req.query.quote}*`;
  elasticClient
    .search(query)
    .then((resp) => {
      return res.status(200).json({
        quotes: resp.hits.hits,
      });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({
        msg: "error",
        err,
      });
    });
});

module.exports = router;
