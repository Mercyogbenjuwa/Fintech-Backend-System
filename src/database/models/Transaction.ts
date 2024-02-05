/**===================================== Transaction  Table  ===================================== **/

import { DataTypes, Model } from 'sequelize';
import sequelizeConnection from '../config';
import User from './User';

interface TransactionAttributes {
  transactionID: number;
  senderID: number;
  recipientID: number;
  amount: number;
  timestamp: Date;
  transactionReference: string;
}

export interface TransactionInput {
  senderID: number;
  recipientID: number;
  amount: number;
  transactionReference: string;
}

export interface TransactionOutput extends Required<TransactionAttributes> {
  Sender: User;
  Recipient: User;
}

class Transaction extends Model<TransactionAttributes, TransactionInput> implements TransactionAttributes {
  public transactionID!: number;
  public senderID!: number;
  public recipientID!: number;
  public amount!: number;
  public timestamp!: Date;
  public transactionReference!: string;

  public readonly Sender?: User;
  public readonly Recipient?: User;
}

Transaction.init(
  {
    transactionID: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    senderID: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    recipientID: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    transactionReference: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    sequelize: sequelizeConnection,
  }
);


export default Transaction;
