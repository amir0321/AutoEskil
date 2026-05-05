import { setupDB } from '../db.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

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
