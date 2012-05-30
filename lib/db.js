const redis = module.exports.db = require("redis");
const client = module.exports.client = redis.createClient();