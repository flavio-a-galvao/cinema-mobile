import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Filme extends Model {
  declare id_filme: number;
  declare titulo: string;
  declare genero: string;
  declare classificacao_etaria: string;
  declare duracao: number;
  declare sinopse: string;
  declare poster_url: string;
  declare data_lancamento: Date;
}

Filme.init(
  {
    id_filme: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    titulo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    genero: {
      type: DataTypes.STRING,
    },
    classificacao_etaria: {
      type: DataTypes.STRING,
    },
    duracao: {
      type: DataTypes.INTEGER,
    },
    sinopse: {
      type: DataTypes.TEXT,
    },
    poster_url: {
      type: DataTypes.STRING,
    },
    data_lancamento: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    tableName: "filmes",
    timestamps: false,
  },
);

export default Filme;