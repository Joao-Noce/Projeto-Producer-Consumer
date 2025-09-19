const amqp = require('amqplib');
const mysql = require('mysql2/promise');
const express = require('express');

const app = express();
const QUEUE = 'messages';
const RABBIT_URL = process.env.RABBIT_URL || 'amqp://guest:guest@rabbitmq:5672';

const MYSQL_CONFIG = {
    host: process.env.MYSQL_HOST || 'mysql',
    user: process.env.MYSQL_USER || 'consumer',
    password: process.env.MYSQL_PASSWORD || 'consumerpass',
    database: process.env.MYSQL_DATABASE || 'consumerdb',
    waitForConnections: true,
    connectionLimit: 10,
}

let pool;

async function waitForDb(retries = 10, delay = 3000) {
    for (let i = 0; i < retries; i++) {
        try {
            await pool.query('SELECT 1');
            console.log('MySQL is ready');
            return;
        } catch (err) {
            console.log(`MySQL not ready yet, retrying in ${delay / 1000}s...`);
            await new Promise(r => setTimeout(r, delay));
        }
    }
    throw new Error('MySQL never became ready');
}

async function initDb() {
    pool = mysql.createPool(MYSQL_CONFIG);
    await waitForDb();

    await pool.query(`
        CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        payload JSON,
        received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
        `);
}

async function start() {
    await initDb();

    const conn = await amqp.connect(RABBIT_URL);
    const channel = await conn.createChannel();
    await channel.assertQueue(QUEUE, { durable: true });

    console.log('Waiting for messages...');

    channel.consume(QUEUE, async (msg) => {
        if (msg !== null) {
            const content = msg.content.toString();
            console.log('Received: ', content);
            try {
                await pool.query('INSERT INTO messages (payload) VALUES (?)', [content]);
                channel.ack(msg);
                console.log('Saved to DB');
            } catch (err) {
                console.error('DB insert error: ', err);
                channel.nack(msg, false, true); //? o que são os 3 parâmetros?
            }
        }
    });

    app.get('/', async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT id, payload, received_at FROM messages ORDER BY id DESC');

            let html = `
        <html>
            <head><title>Mensagens</title></head>
            <body>
                <h1>Mensagens recebidas</h1>
                <ul>
        `;

            rows.forEach(row => {
                let payload = row.payload;
                if (typeof payload === 'string') {
                    try { payload = JSON.parse(payload); } catch (e) { }
                }

                html += `<li>
                        <b>#${row.id}</b> | 
                        Title: ${payload.title || ''} | 
                        Body: ${payload.body || ''} | 
                        Sender: ${payload.sender || ''} | 
                        Recebido em: ${configurarData(row.received_at)}
                     </li>`;
            });

            html += `
                </ul>
            </body>
        </html>
        `;

            res.send(html);
        } catch (err) {
            console.error(err);
            res.status(500).send("Erro ao buscar mensagens");
        }
    });

    app.listen(3000, () => console.log('Consumer HTTP running on port 3000'));
}

const configurarData = (data) => {
    const date = new Date(data);

    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0'); // meses começam em 0
    const ano = date.getFullYear();

    const hora = String(date.getHours()).padStart(2, '0');
    const minuto = String(date.getMinutes()).padStart(2, '0');
    const segundo = String(date.getSeconds()).padStart(2, '0');

    return `${dia}/${mes}/${ano} ${hora}:${minuto}:${segundo}`;
}

start().catch(err => {
    console.error('Startup error: ', err);
    process.exit(1);
})