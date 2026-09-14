import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Cliente extends Model {
  declare id_cliente: number;
  declare nome: string;
  declare cpf: string;
  declare email: string;
  declare telefone: string;
  declare data_nascimento: Date;
}

Cliente.init(
  {
    id_cliente: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cpf: {
      type: DataTypes.STRING,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
    },
    telefone: {
      type: DataTypes.STRING,
    },
    data_nascimento: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    tableName: "clientes",
    timestamps: false,
  },
);

export default Cliente;