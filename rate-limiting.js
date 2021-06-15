const redis = require("redis");
const redisClient = redis.createClient();
const moment = require("moment");

const RedisServer = require("redis-server");
const server = new RedisServer(6379);

server.open(err => {
  if (err === null) {
  }
});

module.exports = (req, res, next) => {
  redisClient.exists(req.ip, (err, reply) => {
    if (err) {
      console.log("Redis not working...");
      system.exit(0);
    }
    if (reply === 1) {
      // user exists
      // check time interval

      redisClient.get(req.ip, (err, reply) => {
        let data = JSON.parse(reply);
        console.log(" access granted", data);
        let currentTime = moment().unix();
        let difference = (currentTime - data.startTime) / 60;

        if (difference >= 1) {
          // allow the request
          let body = {
            count: 1,
            startTime: moment().unix()
          };

          redisClient.set(req.ip, JSON.stringify(body));

          next();
        }

        if (difference < 1) {
          //block the request
          if (data.count >= 20) {
            let countdown = 60 - (moment().unix() - data.startTime);

            let timeLeft = { time: countdown };
            return res.status(429).render("rate_limit", timeLeft);
          }

          // update the count and allow the request
          data.count++;
          redisClient.set(req.ip, JSON.stringify(data));
          next();
        }
      });
    } else {
      console.log("added new user");
      // add new user
      let body = {
        count: 1,
        startTime: moment().unix()
      };
      redisClient.set(req.ip, JSON.stringify(body));
      // allow request
      next();
    }
  });
};
