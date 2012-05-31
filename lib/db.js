//deployment-staging
/*const redis = module.exports.db = require("redis");
const client = module.exports.client = redis.createClient('2267', '50.30.35.9');
client.auth('808f6be60ec2d569bf85a6e0445dea72');*/

//development
/*const redis = module.exports.db = require("redis");
const client = module.exports.client = redis.createClient();*/

const redis = module.exports.db = require("redis");
const client = module.exports.client = redis.createClient('9608', 'panga.redistogo.com');
client.auth('9208f2e1896c3dbf082f5f0e75d70df4');
