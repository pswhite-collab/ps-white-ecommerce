const generateSignedUrl = (baseUrl, expiresInMinutes = 60) => {
  const expiry = Date.now() + expiresInMinutes * 60 * 1000;
  return `${baseUrl}?expires=${expiry}`;
};

export default generateSignedUrl;
