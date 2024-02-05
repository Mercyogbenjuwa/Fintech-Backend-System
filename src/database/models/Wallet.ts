/**===================================== Wallets  Table  ===================================== **/
import { DataTypes, Model } from 'sequelize';
import sequelizeConnection from '../config';
import User from './User';

interface WalletAttributes {
  walletID: number;
  balance: number;
  currency: string;
  userID: number;
}

export interface WalletInput {
  balance: number;
  currency: string;
  userID: number;
}

export interface WalletOutput extends Required<WalletAttributes> {
  User: User;
}

class Wallet extends Model<WalletAttributes, WalletInput> implements WalletAttributes {
  public walletID!: number;
  public balance!: number;
  public currency!: string;
  public userID!: number;

  public readonly User?: User;
}

Wallet.init(
  {
    walletID: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    balance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userID: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    sequelize: sequelizeConnection,
  }
);


export default Wallet;
