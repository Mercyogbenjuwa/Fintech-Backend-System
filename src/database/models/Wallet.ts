/**===================================== Wallets  Table  ===================================== **/
import { DataTypes, Model } from "sequelize";
import sequelizeConnection from "../config";
import User from "./User";

interface WalletAttributes {
    walletID: number;
    balance: number;
    currency: string;
    userID: number;
    accountNumber: string;
}

export interface WalletInput {
    balance: number;
    currency: string;
    userID: number;
    accountNumber: string;
}

export interface WalletOutput extends Required<WalletAttributes> {
    User: User;
}

class Wallet
    extends Model<WalletAttributes, WalletInput>
    implements WalletAttributes {
    public walletID!: number;
    public balance!: number;
    public currency!: string;
    public userID!: number;
    public accountNumber!: string;

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
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0.0,
        },
        currency: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        userID: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
        accountNumber: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        timestamps: true,
        sequelize: sequelizeConnection,
    }
);

export default Wallet;
