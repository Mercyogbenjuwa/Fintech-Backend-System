import express, { Application, Request, Response } from 'express'
import dotenv from 'dotenv';
import dbInit from './src/database/init';
import authRouter from './src/api/routes/Auth';

dotenv.config();

const app: Application = express()
const port = 3000

dbInit();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', authRouter);


try {
    app.listen(port, () => {
        console.log(`Server running on ${port}`)
    })
} catch (error) {
    console.log(`Error occured ${error}`)
}