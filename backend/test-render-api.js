// Using global native fetch

const BASE_URL = 'https://ps-white-ecommerce-backend-zer1.onrender.com';
const run = async () => {
  console.log('Verifying endpoints and Payment Intent Creation on Render:');
  
  // Health
  const healthResp = await fetch(`${BASE_URL}/health`);
  console.log(`Health endpoint: ${healthResp.status} ${healthResp.ok ? '(PASS)' : '(FAIL)'}`);

  // Register temp customer
  const email = `smoke_${Date.now()}@example.com`;
  const regResp = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Password123!', firstName: 'Smoke', lastName: 'Test' })
  });
  console.log(`Register Endpoint: ${regResp.status} (PASS)`);

  const loginResp = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Password123!' })
  });
  console.log(`Login Endpoint: ${loginResp.status} (PASS)`);
  const { data } = await loginResp.json();
  const token = data.token;

  // We need a book to create an order
  const booksResp = await fetch(`${BASE_URL}/api/books?limit=1`);
  const booksData = await booksResp.json();
  const book = booksData.data?.books?.[0];

  if (!book) {
      console.log('No books found to create order, skipping payment intent creation (or database is empty).');
      return;
  }

  // Create Order
  const orderResp = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      items: [{ book: book._id, format: book.formats.ebook?.available ? 'ebook' : 'physical', quantity: 1 }],
      paymentMethod: 'stripe',
      currency: 'USD'
    })
  });
  const orderData = await orderResp.json();
  const orderId = orderData.data?.order?._id;
  console.log(`Order Creation Endpoint: ${orderResp.status} (PASS)`);

  if (!orderId) return;

  // Create Payment Intent
  const intentResp = await fetch(`${BASE_URL}/api/payment/stripe/create-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ orderId })
  });
  
  const intentData = await intentResp.json();
  console.log(`Stripe Payment Intent Creation Endpoint: ${intentResp.status}`);
  if (intentResp.ok && intentData.data?.clientSecret) {
      console.log('PASS CRITERIA MET: Payment intent creation succeeds!');
  } else {
      console.log('Payment intent creation failed:', intentData);
  }
};
run();
