'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('admin', 'user'), allowNull: false, defaultValue: 'user' },

    // NEW: simpan TMDB API Key per user (opsional)
    tmdbApiKey: { type: DataTypes.STRING, allowNull: true },

    // NEW: API Key for our own system authentication
    apiKey: { type: DataTypes.STRING(64), allowNull: true },
  });

  User.associate = (models) => {
    User.hasMany(models.Watchlist, { foreignKey: 'userId', as: 'watchlists' });

    // aman kalau model RefreshToken ada (kalau Anda pakai refresh token)
    if (models.RefreshToken) {
      User.hasMany(models.RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
    }
  };

  return User;
};
