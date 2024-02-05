/**===================================== Database  Initialization  ===================================== **/

import User from '../database/models/User';
import Wallet from '../database/models/Wallet';
import Transaction from '../database/models/Transaction';
import dotenv from 'dotenv';
dotenv.config();

const isDev = process.env.NODE_ENV === 'development';
const dbInit = async () => {
  try {
    console.log('Syncing User model...');
    await User.sync({ alter: isDev });
    console.log('User model synced successfully.');
    await Wallet.sync({ alter: isDev });
    await Transaction.sync({ alter: isDev });
    console.log('Database tables synchronized successfully.');
  } catch (error: any) {
    console.error('Error syncing database tables:', error);
  }
};

export default dbInit;
