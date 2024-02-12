const bodyParser = require("body-parser");
const { exec, spawn } = require("child_process");
const express = require("express");
const app = express();
const fs = require("fs");
const cors = require("cors");
const { stdin } = require("process");
const port = process.env.PORT || 3000;



function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters.charAt(randomIndex);
    }
    
    return result;
}
const allowedOrigin = '*'
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // '*' allows any origin, consider setting it to a specific origin in production
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
app.use(bodyParser.json());
app.get('/code',(req,res) => {
    res.send("got my get request").status(200)
})
app.post('/code', async (req, res) => {
  var fileName = generateRandomString(12);
  console.log(fileName)
  await fs.writeFile(`./outputs/${fileName}.cpp`, req.body.code, (err) => {
      if (err) {
          console.log("error in writing code");
          res.sendStatus(401);
      }
  })

  const compileProcess = spawn('g++', [`./outputs/${fileName}.cpp`, '-o', `./outputs/${fileName}`]);
  compileProcess.stderr.on('data', (data) => {
      console.error(`Compile error: ${data}`);
      res.status(500).send(`Compile error: ${data}`);
  });
  compileProcess.on('close', (compileCode) => {
      if (compileCode === 0) {

          const runProcess = spawn(`./outputs/${fileName}`, { stdio: ['pipe', 'pipe', 'pipe'] });

          const userInput = req.body.input;

          runProcess.stdin.write(userInput);
          runProcess.stdin.end();

          let output = '';
          let errorOutput = '';

          runProcess.stdout.on('data', (data) => {
              output += data;
          });

          runProcess.stderr.on('data', (data) => {
              errorOutput += data;
          });

          runProcess.on('close', () => {
              res.send({ stdout: output, stderr: errorOutput });
          });
      }
  });
});

app.listen(port, () => {
    console.log("Listening on 3000");
})