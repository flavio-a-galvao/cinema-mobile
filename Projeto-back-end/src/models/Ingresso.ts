import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Ingresso extends Model {
  declare id_ingresso: number;
  declare id_sessao: number;
  declare id_cliente: number;
  declare id_assento: number;
  declare data_compra: Date;
}

Ingresso.init(
  {
    id_ingresso: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_sessao: {
      type: DataTypes.INTEGER,
    },
    id_cliente: {
      type: DataTypes.INTEGER,
    },
    id_assento: {
      type: DataTypes.INTEGER,
    },
    data_compra: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "ingressos",
    timestamps: false,
  },
);

export default Ingresso;