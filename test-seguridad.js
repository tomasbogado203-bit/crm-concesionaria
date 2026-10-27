// Test automatizado de CORS y Rate Limiting para Clase 9
const baseUrl = 'http://127.0.0.1:3000';

async function testCORS() {
  console.log('\n--- 1. PRUEBA DE CORS ---');

  // Caso A: Origen permitido (Frontend legítimo)
  const resPermitido = await fetch(`${baseUrl}/health`, {
    headers: { Origin: 'http://localhost:5173' },
  });
  console.log('[Caso A - Origen permitido: http://localhost:5173]');
  console.log('Status:', resPermitido.status);
  console.log('Access-Control-Allow-Origin:', resPermitido.headers.get('access-control-allow-origin'));
  console.log('Access-Control-Allow-Credentials:', resPermitido.headers.get('access-control-allow-credentials'));

  // Caso B: Origen no autorizado (Sitio ajeno)
  const resNoPermitido = await fetch(`${baseUrl}/health`, {
    headers: { Origin: 'http://sitio-atacante.com' },
  });
  console.log('\n[Caso B - Origen no autorizado: http://sitio-atacante.com]');
  console.log('Status:', resNoPermitido.status);
  console.log('Access-Control-Allow-Origin:', resNoPermitido.headers.get('access-control-allow-origin') || 'BLOQUEADO (null / no emitido)');
}

async function testRateLimiting() {
  console.log('\n--- 2. PRUEBA DE RATE LIMITING EN /auth/login ---');
  console.log('Configurado: max 5 intentos cada 15 minutos.');

  for (let i = 1; i <= 6; i++) {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'carlos@concesionaria.com',
        password: 'password_incorrecta_' + i,
      }),
    });

    const data = await res.json().catch(() => ({}));
    const remaining = res.headers.get('ratelimit-remaining');
    const limit = res.headers.get('ratelimit-limit');

    console.log(
      `Intento #${i}: Status ${res.status} ${res.statusText} | Restantes: ${remaining}/${limit} | Mensaje:`,
      JSON.stringify(data)
    );
  }
}

async function main() {
  await testCORS();
  await testRateLimiting();
}

main().catch(console.error);
