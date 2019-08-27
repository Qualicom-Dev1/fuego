const Sequelize = require("sequelize");

// const sequelize = new Sequelize("fuegookadmin", "fuegookadmin", "Bouboulover21", {
//     host: 'fuegookadmin.mysql.db', 
//     dialect: 'mysql',
//     logging: false,//passer a true pour voir les différentes requêtes effectuées par l'ORM
// });

const sequelize = new Sequelize("fuegookadmin", "root", "", {
    host: 'localhost', 
    dialect: 'mysql',
    logging: false,//passer a true pour voir les différentes requêtes effectuées par l'ORM
});

module.exports = sequelize;
global.sequelize = sequelize;