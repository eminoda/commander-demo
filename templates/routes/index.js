var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.json({ code: 0, msg: '成功' })
});

module.exports = router;
