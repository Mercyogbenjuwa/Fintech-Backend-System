import express, { Application, Request, Response } from 'express'
import dotenv from 'dotenv';
import dbInit from './src/database/init';

dotenv.config();

const app: Application = express()
const port = 3000

dbInit();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


try {
    app.listen(port, () => {
        console.log(`Server running on ${port}`)
    })
} catch (error) {
    console.log(`Error occured ${error}`)
}