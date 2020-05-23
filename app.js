const express = require('express')
const app = express()
var servestatic = require('serve-static')
const mongoose = require('mongoose')
const PORT = 5000
// const PORT = process.env.PORT || 5000
const {MONGOURI} = require('./config/key')

 

mongoose.connect(MONGOURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})


mongoose.connection.on('connected', ()=>{
    console.log("Connected to MongoDB!")
})

mongoose.connection.on('error', (err)=>{
    console.log("Error while Connecting to MongoDB!", err)
})

require('./models/user')
require('./models/post')

app.use(express.json())
app.use (require('./routes/auth'))
app.use(require('./routes/post'))
app.use(require('./routes/user'))


app.use(servestatic(__dirname + "/build"))
app.get('/', function (req, res) {   res.sendFile(path.join(__dirname, 'build', 'index.html')); });



app.listen(PORT,()=>{
    console.log("server is running on", PORT);
})