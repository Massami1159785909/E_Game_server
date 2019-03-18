var mysql = require('mysql');
var conn = mysql.createConnection({
    host:'localhost',
    user:'game_appstore_operator',
    password:'xxpmt123456',
    database:'Game_AppStore_db',
    port:3306,
    multipleStatements:true,
});

module.exports = conn;