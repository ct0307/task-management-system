require('dotenv').config();
const jwt = require('jsonwebtoken');
const token = jwt.sign({id:1, username:'ct', role:'user'}, process.env.JWT_SECRET, {expiresIn:'7d'});
console.log(token);
