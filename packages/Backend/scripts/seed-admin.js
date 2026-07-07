import { setupDB } from '../db.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

async function isPasswordPwned(password) {
  const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);
  try {
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!response.ok) return false;
    const text = await response.text();
    return text.includes(suffix);
  } catch (error) {
    console.error("Warning: Could not check password against HIBP database.");
    return false;
  }
}

const username = (process.env.ADMIN_SEED_USERNAME || '').trim();
const password = process.env.ADMIN_SEED_PASSWORD || '';

if (!username || !password) {
    console.error('Missing ADMIN_SEED_USERNAME or ADMIN_SEED_PASSWORD.');
    process.exit(1);
}

if (username === 'admin' || password === 'admin123' || password.length < 12) {
    console.error('Unsafe seed credentials. Use a non-default username and a password with at least 12 characters.');
    process.exit(1);
}

const isPwned = await isPasswordPwned(password);
if (isPwned) {
    console.error("❌ Avbrutet: Seed-lösenordet är känt från en databasläcka. Av säkerhetsskäl tillåts det inte. Välj ett starkare och unikt lösenord i din miljövariabel.");
    process.exit(1);
}

const db = await setupDB();
const hash = await bcrypt.hash(password, 10);
const id = crypto.randomUUID();
try {
    await db.run('INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)', [id, username, hash, 'admin']);
    console.log(`✅ Admin user '${username}' created.`);
} catch(e) {
    if (e.message.includes('UNIQUE')) {
        console.log(`ℹ️ User '${username}' already exists.`);
    } else {
        console.error('❌ Error:', e.message);
    }
}
await db.close();
