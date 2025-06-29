import express from 'express';

const app = express();

app.get('/status', (request, response) => {
  response.json({ status: 'Agent service is running 🚀' });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`✅Agent service running at http://localhost:${PORT}`);
});
