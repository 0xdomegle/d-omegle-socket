const app = require('./server').app;

app.get('/test', (req, res) => {
    res.json("test route");
})