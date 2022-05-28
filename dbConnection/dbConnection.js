var mysql = require('mysql');

var con = mysql.createConnection({
    host: "jdbc:mysql://localhost:3306/tally_khata",
    user: "root",
    password: "123456"
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});

export default con;