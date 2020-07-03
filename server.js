// TEST CI/CD
const express = require('express');
const app = express();
const constants=require('config');
const connectDB = require('./config/db');
var cors = require('cors');
app.use(cors());
//connect to the database
connectDB();

//init middleware
app.use(express.json({ extended: false }));

app.get('/', (req, res) => res.send('API RUNNING \n version: '+constants.get("major_version")+"."+constants.get("minor_version")));


//define routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/interactions', require('./routes/api/interactions'));


const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => console.log('Server started on port  ' + PORT));