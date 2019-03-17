var express = require("express");

var app = express();

const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://discountdb:27017';
const dbName = 'shopmany';
const client = new MongoClient(url, { useNewUrlParser: true });
app.use(errorHandler)

const logger = require('pino')()
const expressPino = require('express-pino-logger')({
  logger: logger.child({"service": "httpd"})
})
app.use(expressPino)

app.get("/health", function(req, res, next) {
  var resbody = {
    "status": "healthy",
    checks: [],
  };
  var resCode = 200;

  client.connect(function(err) {
    var mongoCheck = {
      "name": "mongo",
      "status": "healthy",
    };
    if (err != null) {
      req.log.warn(err.toString());
      mongoCheck.error = err.toString();
      mongoCheck.status = "unhealthy";
      resbody.status = "unhealthy"
      resCode = 500;
    }
    resbody.checks.push(mongoCheck);
    res.status(resCode).json(resbody)
  });
});

app.get("/discount", function(req, res, next) {
  client.connect(function(err) {
    db = client.db(dbName);
    db.collection('discount').find({}).toArray(function(err, discounts) {
      if (err != null) {
        req.log.error(err.toString());
        return next(err)
      }
      var goodDiscount = null
      discounts.forEach(function (s) {
        if (s.itemID+"" == req.query.itemid) {
          goodDiscount = s
        }
      });
      if (goodDiscount != null) {
        res.json({"discount": goodDiscount})
      } else {
        req.log.warn("discount not found");
        res.status(404).json({ error: 'Discount not found' });
      }
      return
    })
  });
});

app.use(function(req, res, next) {
  req.log.warn("route not found");
  return res.status(404).json({error: "route not found"});
});

function errorHandler(err, req, res, next) {
  req.log.error(err.toString(), {
    error_status: err.status
  });
  var st = err.status
  if (st == 0 || st == null) {
    st = 500;
  }
  res.status(err.status);
  res.json({ error: err })
}

app.listen(3000, () => {
  logger.info("Server running on port 3000");
});
