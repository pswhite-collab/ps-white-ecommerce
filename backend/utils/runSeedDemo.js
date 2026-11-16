process.env.APP_ENV = 'local-test';

const run = async () => {
  const { runSeed } = await import('./seedDatabase.js');
  await runSeed();
  process.exit(0);
};

run().catch((error) => {
  console.error('Seed run failed:', error);
  process.exit(1);
});
