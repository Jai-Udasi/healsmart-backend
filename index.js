const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const dotenv = require('dotenv');
const { Configuration, OpenAIApi } = require('openai');
const fs = require('fs');

dotenv.config();

const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.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,
}));

app.get('/', (req, res) => {
  res.send('HealSmart Backend is Live!');
});

// 🔒 Secure route using Firebase token
app.post('/secure-data', async (req, res) => {
  const idToken = req.headers.authorization;
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    res.json({ message: `Welcome, ${decoded.name}` });
  } catch (err) {
    res.status(401).send('Unauthorized');
  }
});

// 🧠 Symptom analysis using OpenAI
app.post('/analyze-symptoms', async (req, res) => {
  const { symptoms } = req.body;
  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: `Suggest medicine for these symptoms: ${symptoms}. Keep it short and safe.`
      }],
    });
    const suggestion = response.data.choices[0].message.content;
    res.json({ suggestion });
  } catch (err) {
    console.error(err);
    res.status(500).send('AI Error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

let symptomRecords = [];

app.post('/save-symptoms', async (req, res) => {
  const idToken = req.headers.authorization;
  const { symptoms } = req.body;

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const record = {
      name: decoded.name,
      email: decoded.email,
      symptoms,
      timestamp: new Date().toISOString(),
    };
    symptomRecords.push(record);
    res.json({ message: 'Symptoms saved successfully' });
  } catch (err) {
    res.status(401).send('Unauthorized');
  }
});

app.get('/symptom-records', (req, res) => {
  res.json(symptomRecords);
});

