import dotenv from 'dotenv';

dotenv.config();

import app from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[INFO] Servidor CRM Concesionaria en ejecucion en http://localhost:${PORT}`);
  console.log(`[INFO] Endpoints disponibles:`);
  console.log(`   - POST /auth/registro`);
  console.log(`   - POST /auth/login`);
  console.log(`   - GET  /clientes`);
  console.log(`   - POST /clientes`);
});
