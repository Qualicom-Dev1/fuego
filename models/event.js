'use strict';

const moment = require('moment');

module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define('Event', {
    idCommercial: {
      type : DataTypes.NUMBER,
      allowNull : false
    },
    start: {
      type: DataTypes.DATE,
      allowNull : false,
      get() {
        return moment(this.getDataValue('start')).format('DD/MM/YYYY HH:mm');
      }
    },
    end: {
      type: DataTypes.DATE,
      allowNull : false,
      get() {
        return moment(this.getDataValue('end')).format('DD/MM/YYYY HH:mm');
      }
    },
    allDay: {
      type: DataTypes.BOOLEAN,
      defaultValue : false
    },
    motif: {
      type : DataTypes.STRING(255),
      allowNull : false
    }
  }, {});
  Event.associate = function(models) {
     Event.belongsTo(models.User, {foreignKey: 'idCommercial'})
  };
  return Event;
};