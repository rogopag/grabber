const redis = module.exports.db = require("redis");
const client = module.exports.client = redis.createClient('2267', '50.30.35.9');
client.auth('808f6be60ec2d569bf85a6e0445dea72');