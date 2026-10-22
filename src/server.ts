import app from './app';
import { env } from './config/env';
import { testDbConnection } from './db';

const port = env.PORT;

app.listen(port, async () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`🌍 Environment: ${env.NODE_ENV}`);

  // Test database connection on startup
  await testDbConnection();
});
  