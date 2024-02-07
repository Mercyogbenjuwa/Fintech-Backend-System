/**===================================== Users  Table  ===================================== **/
import { DataTypes, Model } from "sequelize";
import sequelizeConnection from "../config";
import Wallet from "./Wallet";
import Transaction from "./Transaction";

interface UserAttributes {
    userID: number;
    username: string;
    email: string;
    password: string;
    accountNumber: string;
    verificationToken: string;
    emailVerified: boolean;
}

export interface UserInput {
    username: string;
    email: string;
    password: string;
    accountNumber: string;
    verificationToken: string;
    emailVerified: boolean;
}

export interface UserOutput extends Required<UserAttributes> {
    Wallets: Wallet[];
    Transactions: Transaction[];
}

class User extends Model<UserAttributes, UserInput> implements UserAttributes {
    public userID!: number;
    public username!: string;
    public email!: string;
    public password!: string;
    public accountNumber!: string;
    public verificationToken!: string;
    public emailVerified!: boolean;

    public readonly Wallets?: Wallet[];
    public readonly Transactions?: Transaction[];
}

User.init(
    {
        userID: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        accountNumber: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        verificationToken: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        emailVerified: {
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

User.hasMany(Wallet, {
    foreignKey: "userID",
    as: "Wallets",
});

User.hasMany(Transaction, {
    foreignKey: "senderID",
    as: "SentTransactions",
});

User.hasMany(Transaction, {
    foreignKey: "recipientID",
    as: "ReceivedTransactions",
});

Wallet.belongsTo(User, {
    foreignKey: "userID",
    as: "User",
});

Transaction.belongsTo(User, {
    foreignKey: "senderID",
    as: "Sender",
});

Transaction.belongsTo(User, {
    foreignKey: "recipientID",
    as: "Recipient",
});

export default User;
