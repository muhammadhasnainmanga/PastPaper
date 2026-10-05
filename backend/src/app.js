const cors = require('cors');
const express = require('express');
const path = require('path');

const app = express();

app.use(cors());


app.use(express.json());
app.use(cookieparser());
app.use(express.urlencoded({extended: false}));

module.exports = app;