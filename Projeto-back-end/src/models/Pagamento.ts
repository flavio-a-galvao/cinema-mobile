import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Pagamento extends Model {
  declare id_pagamento: number;
  declare id_ingresso: number;
  declare valor: number;
  declare metodo_pagamento: "cartao" | "pix" | "dinheiro";
  declare data_pagamento: Date;
}

Pagamento.init(
  {
    id_pagamento: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_ingresso: {
      type: DataTypes.INTEGER,
    },
    valor: {
      type: DataTypes.DECIMAL(6, 2),
    },
    metodo_pagamento: {
      type: DataTypes.ENUM("cartao", "pix", "dinheiro"),
    },
    data_pagamento: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "pagamentos",
    timestamps: false,
  },
);

export default Pagamento;