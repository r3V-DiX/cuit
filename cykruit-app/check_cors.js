require('dotenv').config();
console.log(process.env.CORS_ORIGIN);
console.log(process.env.CORS_ORIGIN?.split(',').map(o => o.trim()));
