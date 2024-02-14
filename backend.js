const bodyParser = require("body-parser");
const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const { exec, spawn } = require("child_process");
const path = require('path');
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

mongoose.connect('mongodb+srv://shaikadam642:PgHZU4iTiJtQlRgY@cluster0.wzj4d7w.mongodb.net/', { useNewUrlParser: true, useUnifiedTopology: true });

const CodeModel = mongoose.model('Code', { code: String, input: String });

// Function to compile and run code
async function compileAndRun(code, input) {
    const fileName = generateRandomString(12);
    const filePath = path.join(__dirname, 'outputs', `${fileName}.cpp`);

    await fs.promises.writeFile(filePath, code);

    const compileProcess = spawn('g++', [filePath, '-o', path.join(__dirname, 'outputs', fileName)]);

    compileProcess.stderr.on('data', (data) => {
        console.error(`Compile error: ${data}`);
        return { error: `Compile error: ${data}` };
    });

    return new Promise((resolve) => {
        compileProcess.on('close', async (compileCode) => {
            if (compileCode === 0) {
                const runProcess = spawn(path.join(__dirname, 'outputs', fileName), { stdio: ['pipe', 'pipe', 'pipe'] });

                runProcess.stdin.write(input);
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
                    resolve({ stdout: output, stderr: errorOutput });
                });
            } else {
                resolve({ error: 'Compilation failed' });
            }
        });
    });
}

const allowedOrigin = '*';
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', allowedOrigin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send("got my get request").status(200);
});

app.post('/', async (req, res) => {
    // Assuming you have a valid MongoDB URI in 'your-mongodb-uri'
    mongoose.connect('your-mongodb-uri', { useNewUrlParser: true, useUnifiedTopology: true });

    const codeModelInstance = new CodeModel({ code: req.body.code, input: req.body.input });
    await codeModelInstance.save();

    const result = await compileAndRun(req.body.code, req.body.input);

    // Optionally, you can save the compilation result or any other relevant data to MongoDB
    // For example:
    // const compilationResultModel = new CompilationResultModel({ result, codeModelInstance });
    // await compilationResultModel.save();

    res.send(result);
});

app.listen(port, () => {
    console.log("Listening on 3000");
});
