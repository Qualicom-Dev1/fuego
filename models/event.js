'use strict';

const moment = require('moment');

module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define('Event', {
    idCommercial: DataTypes.NUMBER,
    start: {
      type: DataTypes.DATE,
      get() {
        return moment(this.getDataValue('start')).format('DD/MM/YYYY HH:mm');
      }
    },
    end: {
      type: DataTypes.DATE,
      get() {
        return moment(this.getDataValue('end')).format('DD/MM/YYYY HH:mm');
      }
    },
    allDay: {
      type: DataTypes.TEXT,
    },
    motif: DataTypes.TEXT
  }, {});
  Event.associate = function(models) {
     Event.belongsTo(models.User, {foreignKey: 'idCommercial'})
  };
  return Event;
};