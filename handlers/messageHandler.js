import { generateResponse, transcribeAudio, analyzeImage } from '../services/openaiService.js';
import { saveMessage } from '../database/db.js';

async function handleMessage(client, message) {
    const from = message.from;
    let userInput = '';
    let response = '';
    let messageType = message.type;

    try {
        if (message.type === 'chat') {
       
            userInput = message.body;
            response = await generateResponse(userInput);
        } else if (['audio', 'ptt'].includes(message.type)) {
      
            const media = await message.downloadMedia();
            if (!media) throw new Error('Falha ao baixar áudio.');
            userInput = await transcribeAudio(media.data);

            const audioBuffer = Buffer.from(media.data, 'base64');
            userInput = await transcribeAudio(audioBuffer);
            response = await generateResponse(userInput);
        } else if (message.type === 'image') {
            // Mensagem de imagem
            const media = await message.downloadMedia();
            if (!media) throw new Error('Falha ao baixar imagem.');
            const imageBase64 = media.data;
            response = await analyzeImage(imageBase64);
            userInput = '[Imagem analisada]';
        } else {
          
            response = 'Desculpe, só posso processar texto, áudio ou imagens no momento.';
            userInput = message.body || '[Mídia não suportada]';
        }

        await message.reply(response);
        await saveMessage(from, messageType, userInput, response);
    } catch (error) {
        await message.reply('Desculpe, não consegui processar isso. Tente novamente.');
    }
}

export { handleMessage };