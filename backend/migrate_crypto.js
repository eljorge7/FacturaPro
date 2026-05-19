const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
require('dotenv').config();

const prisma = new PrismaClient();
const prefix = 'enc:v1:';
const algorithm = 'aes-256-gcm';

function getSecretKey() {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) return '';
    if (key.length !== 32) return crypto.createHash('sha256').update(String(key)).digest('base64').substring(0, 32);
    return key;
}

function encrypt(text) {
    if (!text) return text;
    if (text.startsWith(prefix)) return text;
    const key = getSecretKey();
    if (!key) return text;

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'utf8'), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${prefix}${iv.toString('hex')}:${authTag}:${encrypted}`;
}

async function run() {
    console.log('Migrando TaxProfiles en FacturaPro...');
    const profiles = await prisma.taxProfile.findMany();
    let count = 0;
    for (const p of profiles) {
        let updated = false;
        const data = {};
        if (p.cerBase64 && !p.cerBase64.startsWith(prefix)) { data.cerBase64 = encrypt(p.cerBase64); updated = true; }
        if (p.keyBase64 && !p.keyBase64.startsWith(prefix)) { data.keyBase64 = encrypt(p.keyBase64); updated = true; }
        if (p.keyPassword && !p.keyPassword.startsWith(prefix)) { data.keyPassword = encrypt(p.keyPassword); updated = true; }
        if (p.fielCerBase64 && !p.fielCerBase64.startsWith(prefix)) { data.fielCerBase64 = encrypt(p.fielCerBase64); updated = true; }
        if (p.fielKeyBase64 && !p.fielKeyBase64.startsWith(prefix)) { data.fielKeyBase64 = encrypt(p.fielKeyBase64); updated = true; }
        if (p.fielPassword && !p.fielPassword.startsWith(prefix)) { data.fielPassword = encrypt(p.fielPassword); updated = true; }
        
        if (updated) {
            await prisma.taxProfile.update({ where: { id: p.id }, data });
            count++;
        }
    }
    console.log(`Migrados ${count} perfiles en FacturaPro.`);
}

run().finally(() => prisma.$disconnect());
