/**===================================== Transaction  Table  ===================================== **/

import { DataTypes, Model } from 'sequelize';
import sequelizeConnection from '../config';
import User from './User';

interface TransactionAttributes {
  transactionID: number;
  senderID: number;
  recipientID: number;
  accountNumber : string;
  amount: number;
  transactionReference: string;
  status: boolean;
  timestamp: Date;
}

export interface TransactionInput {
  senderID: number;
  recipientID: number;
  amount: number;
  accountNumber : string;
  transactionReference: string;
  status: boolean;
}

export interface TransactionOutput extends Required<TransactionAttributes> {
  Sender: User;
  Recipient: User;
}

class Transaction extends Model<TransactionAttributes, TransactionInput> implements TransactionAttributes {
  public transactionID!: number;
  public senderID!: number;
  public recipientID!: number;
  public accountNumber! : string;
  public amount!: number;
  public transactionReference!: string;
  public status!: boolean;
  public timestamp!: Date;

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
    accountNumber: {
        type: DataTypes.STRING,
        allowNull: false,
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
    status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
  },
  {
    timestamps: true,
    sequelize: sequelizeConnection,
  }
);
//PENDING OR SUCESSFUL STATUS

export default Transaction;
