var express = require('express');
let adresseDAO = require('./DAO/Adresse')
var app = express();
const mysql      = require('mysql');
myConnection = require('express-myconnection'); // express-myconnection module

dbOptions = {
      host: 'localhost',
      user: 'root',
      password: 'mysqlvitech',
      database: 'parseTest'
};

app.use(myConnection(mysql, dbOptions, 'single'));

app.get('/test', (req, res) => {
    let adresse = {idAdresse : 1} 
    adresseDAO.getUser(req, adresse, res => {
        console.log(res);
        
    });
});
app.listen(3000)


