'use strict';

module.exports = (sequelize, DataTypes) => {
  const Watchlist = sequelize.define('Watchlist', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    movieId: { type: DataTypes.INTEGER, allowNull: false },
  });

  Watchlist.associate = (models) => {
    Watchlist.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });

    Watchlist.belongsTo(models.Movie, {
      foreignKey: 'movieId',
      as: 'movie',
    });
  };

  return Watchlist;
};
