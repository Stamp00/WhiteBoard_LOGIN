import { config } from './config.js';
import { app } from './app.js';

app.listen(config.port, () => {
  console.log(`Login-API lyssnar på port ${config.port}`);
});
