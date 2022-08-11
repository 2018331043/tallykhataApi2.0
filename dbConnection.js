var mysql = require('mysql');

// console.log(process.env.DB_USERNAME)
var con = mysql.createConnection({
    host: "localhost",
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: 'tally_khata',
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
    con.query(`SELECT * FROM shop_owner `, function (err, result) {
        if (err) throw err;
    });
});

module.exports= con;
