const express = require('express');
const multer = require('multer');
const { AsyncLocalStorage } = require('async_hooks');
const axios = require('axios');
const FormData = require('form-data');

const dbContext = new AsyncLocalStorage();
const app = express();
const upload = multer();

app.use((req, res, next) => {
  const dbName = req.headers['x-db-name'];
  dbContext.run(dbName, next);
});

app.post('/test-multer', upload.single('image'), (req, res) => {
  const storeInRoute = dbContext.getStore();
  const headerInRoute = req.headers['x-db-name'];
  console.log('Inside multer route:');
  console.log('  header:', headerInRoute);
  console.log('  AsyncLocalStorage store:', storeInRoute);
  res.json({ storeInRoute, headerInRoute });
});

const server = app.listen(4567, async () => {
  try {
    const form = new FormData();
    form.append('field', 'value');
    const res = await axios.post('http://localhost:4567/test-multer', form, {
      headers: {
        ...form.getHeaders(),
        'X-Db-Name': 'UCSKARAIKUDICR'
      }
    });
    console.log('Response from test server:', res.data);
  } catch (e) {
    console.error(e);
  } finally {
    server.close();
    process.exit(0);
  }
});
