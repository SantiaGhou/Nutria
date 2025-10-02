import generateResponse from '../services/openaiService.js';
import { saveMessage, getMessageHistory } from '../database/db.js'; 


async function handleMessage(client, message) {
    const userMessage = message.body.toLowerCase();
    const from = message.from;
    try {
        const response = await generateResponse(userMessage);
        await message.reply(response);
        await saveMessage(from, userMessage, response);
    } catch (error) {
        await message.reply('Desculpe, não consegui gerar uma resposta.');
    }
}

module.exports = { handleMessage };