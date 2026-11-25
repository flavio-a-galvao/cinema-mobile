import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Sessao extends Model {
  declare id_sessao: number;
  declare id_filme: number;
  declare id_sala: number;
  declare horario: Date;
  declare preco: number;
}

Sessao.init(
  {
    id_sessao: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_filme: {
      type: DataTypes.INTEGER,
    },
    id_sala: {
      type: DataTypes.INTEGER,
    },
    horario: {
      type: DataTypes.DATE,
    },
    preco: {
      type: DataTypes.DECIMAL(6, 2),
    },
  },
  {
    sequelize,
    tableName: "sessoes",
    timestamps: true,
    createdAt: false,
    updatedAt: false,
    paranoid: true,
    deletedAt: "excluido_em",
    defaultScope: { attributes: { exclude: ["excluido_em"] } },
  },
);

export default Sessao;