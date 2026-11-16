process.env.APP_ENV = 'local-test';

const run = async () => {
  const { getDevToken } = await import('./devToken.js');
  const email = process.argv[2];
  const token = await getDevToken(email);
  console.log(token);
  process.exit(0);
};

run().catch((error) => {
  console.error('Dev token failed:', error);
  process.exit(1);
});
