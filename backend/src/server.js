require('dotenv').config();
const app = require('./app.js');
const { error } = require('node:console');
const Port = process.env.PORT || 3000;

const StartServer = async () =>  {
    try {
        // await ConnectDb();

        app.on("error", (error) => {
            console.log("Error :", error);
            throw error;
        })

        app.listen(Port, () => {
            console.log(`Server is listening on Port ${Port}`);
        })

    } catch (error) {
        console.log(error, 'Can not start Server, App is not connected');
        process.exit(1);
    }   
}

StartServer();