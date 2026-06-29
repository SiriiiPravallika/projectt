const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    }
    ,
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    verifyToken: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  });
};
