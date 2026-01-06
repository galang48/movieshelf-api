'use strict';

module.exports = (sequelize, DataTypes) => {
  const Watchlist = sequelize.define(
    'Watchlist',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        // PENTING: jangan unique di userId
      },
      movieId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'watchlists',
      timestamps: true,
      indexes: [
        // ✅ yang unik itu pasangan userId + movieId
        { unique: true, fields: ['userId', 'movieId'] },
        { fields: ['userId'] },
        { fields: ['movieId'] },
      ],
    }
  );

  Watchlist.associate = (models) => {
    Watchlist.belongsTo(models.User, { foreignKey: 'userId' });
    Watchlist.belongsTo(models.Movie, { foreignKey: 'movieId' });
  };

  return Watchlist;
};
