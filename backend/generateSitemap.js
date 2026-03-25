import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Book from './models/Book.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const DOMAIN = 'https://www.ps-white.com';

const generateSitemap = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.warn('No MONGODB_URI found. Skipping sitemap generation.');
      return;
    }

    await mongoose.connect(process.env.MONGODB_URI);
    const books = await Book.find({ active: true }).select('_id updatedAt');

    const urls = books.map((book) => {
      const lastMod = book.updatedAt ? book.updatedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      return `  <url>
    <loc>${DOMAIN}/book/${book._id}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // Add static pages
    urls.unshift(`  <url>
    <loc>${DOMAIN}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`);

    const sitemapXML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    // Output to the frontend public folder
    const outputPath = path.join(__dirname, '../frontend/public/sitemap.xml');
    fs.writeFileSync(outputPath, sitemapXML, 'utf-8');
    console.log(`Successfully generated sitemap.xml with ${urls.length} URLs at ${outputPath}`);
  } catch (error) {
    console.error('Failed to generate sitemap:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
};

generateSitemap();
