'use strict';

module.exports = (sequelize, DataTypes) => {
  const Movie = sequelize.define('Movie', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tmdbId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    title: { type: DataTypes.STRING, allowNull: false },
    posterPath: { type: DataTypes.STRING, allowNull: true },
    releaseDate: { type: DataTypes.STRING, allowNull: true },
  });

  Movie.associate = (models) => {
    Movie.hasMany(models.Watchlist, { foreignKey: 'movieId' });
  };

  return Movie;
};
