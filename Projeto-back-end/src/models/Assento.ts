import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Assento extends Model {
  declare id_assento: number;
  declare id_sala: number;
  declare numero: string;
  declare fila: string;
}

Assento.init(
  {
    id_assento: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_sala: {
      type: DataTypes.INTEGER,
    },
    numero: {
      type: DataTypes.STRING,
    },
    fila: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize,
    tableName: "assentos",
    timestamps: false,
    indexes: [{ unique: true, fields: ['id_sala', 'fila', 'numero'], name: 'assentos_sala_codigo_unique' }],
  },
);

export default Assento;