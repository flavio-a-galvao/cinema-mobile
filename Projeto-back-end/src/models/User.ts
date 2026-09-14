import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class User extends Model {
  declare id_usuario: number;
  declare nome: string;
  declare cpf: string;
  declare email: string;
  declare senha: string;
  declare tipo_usuario: "admin" | "funcionario" | "cliente";
  declare data_criacao: Date;
}

User.init(
  {
    id_usuario: {
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
      allowNull: true,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    senha: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tipo_usuario: {
      type: DataTypes.ENUM("admin", "funcionario", "cliente"),
      defaultValue: "cliente",
    },
    data_criacao: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "usuarios",
    timestamps: false,
  },
);

export default User;