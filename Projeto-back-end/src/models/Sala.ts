import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Sala extends Model {
  declare id_sala: number;
  declare nome: string;
  declare capacidade: number;
}

Sala.init(
  {
    id_sala: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING(50),
      validate: { len: [1, 50] },
    },
    capacidade: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "salas",
    timestamps: false,
  },
);

export default Sala;