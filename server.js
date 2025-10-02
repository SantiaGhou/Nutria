import pkg from 'whatsapp-web.js';

import qrcode from 'qrcode-terminal';
import { initializeDatabase } from './database/db.js';
import { initializeOpenAI } from './services/openaiService.js';
import { handleMessage } from './handlers/messageHandler.js';
import dotenv from 'dotenv';

dotenv.config();
const { Client, LocalAuth } = pkg;
const client = new Client({
    authStrategy: new LocalAuth(),
});


async function startBot() {
    try {
        await initializeDatabase();
        await initializeOpenAI();
        console.log('Bot inicializado com sucesso!');
    } catch (error) {
        console.error('Erro ao inicializar o bot:', error);
        process.exit(1);
    }
}


client.on('qr', (qr) => {
    console.log('Escaneie o QR code abaixo para conectar ao WhatsApp:');
    qrcode.generate(qr, { small: true });
});

// Evento: Cliente pronto
client.on('ready', () => {
    console.log('Cliente WhatsApp conectado!');
});

// Evento: Recebimento de mensagem
client.on('message', async (message) => {
    try {
        await handleMessage(client, message);
    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
        message.reply('Desculpe, ocorreu um erro ao processar sua mensagem.');
    }
});


startBot().then(() => client.initialize());