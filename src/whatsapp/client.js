const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const conversationManager = require('../managers/conversation.manager');

class WhatsAppClient {
  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: '.wwebjs_auth'
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      }
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.client.on('qr', (qr) => {
      console.log('\n=================================');
      console.log('NUTRI.IA - Bot WhatsApp');
      console.log('=================================\n');
      console.log('Escaneie o QR Code abaixo com o WhatsApp:\n');
      qrcode.generate(qr, { small: true });
      console.log('\n=================================\n');
    });

    this.client.on('ready', () => {
      console.log('\n✅ Nutri.ia está online e pronto para atender!\n');
      console.log('Aguardando mensagens...\n');
    });

    this.client.on('authenticated', () => {
      console.log('✅ Autenticado com sucesso!');
    });

    this.client.on('auth_failure', (msg) => {
      console.error('❌ Falha na autenticação:', msg);
    });

    this.client.on('disconnected', (reason) => {
      console.log('⚠️  Desconectado:', reason);
    });

    this.client.on('message', async (message) => {
      await this.handleIncomingMessage(message);
    });
  }

  async handleIncomingMessage(message) {
    try {
      if (message.from === 'status@broadcast') {
        return;
      }

      const phoneNumber = message.from.replace('@c.us', '');

      console.log(`\n📱 Mensagem de ${phoneNumber}:`);
      console.log(`   ${message.body || '[Imagem]'}`);

      const pendingActionResponse = await conversationManager.checkPendingActions(
        phoneNumber,
        message.body
      );

      if (pendingActionResponse) {
        await message.reply(pendingActionResponse);
        console.log(`🤖 Nutri.ia: ${pendingActionResponse}\n`);
        return;
      }

      if (message.hasMedia) {
        await this.handleMediaMessage(message, phoneNumber);
      } else {
        await this.handleTextMessage(message, phoneNumber);
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      await message.reply(
        'Desculpe, tive um problema ao processar sua mensagem. Pode tentar novamente? 😊'
      );
    }
  }

  async handleTextMessage(message, phoneNumber) {
    const lowerBody = message.body.toLowerCase().trim();

    if (lowerBody === 'resumo' || lowerBody === 'resumo do dia') {
      const summary = await conversationManager.getTodaySummary(phoneNumber);
      await message.reply(summary);
      console.log(`🤖 Nutri.ia: ${summary}\n`);
      return;
    }

    const response = await conversationManager.handleMessage(
      phoneNumber,
      message.body
    );

    await message.reply(response);
    console.log(`🤖 Nutri.ia: ${response}\n`);
  }

  async handleMediaMessage(message, phoneNumber) {
    try {
      const media = await message.downloadMedia();

      if (media.mimetype.startsWith('image/')) {
        await this.handleImageMedia(message, phoneNumber, media);
      } else if (media.mimetype.includes('audio') || media.mimetype.includes('ogg')) {
        await this.handleAudioMedia(message, phoneNumber, media);
      } else {
        await message.reply(
          'Por favor, envie imagens ou áudios para que eu possa te ajudar! 📸🎤'
        );
      }
    } catch (error) {
      console.error('Erro ao processar mídia:', error);
      await message.reply(
        'Desculpe, tive dificuldade em processar essa mídia. Pode tentar enviar novamente?'
      );
    }
  }

  async handleImageMedia(message, phoneNumber, media) {
    try {
      await message.reply('Analisando sua imagem... 🔍');

      const response = await conversationManager.handleImageMessage(
        phoneNumber,
        media.data,
        media.mimetype,
        message.body || ''
      );

      await message.reply(response);
      console.log(`🤖 Nutri.ia: ${response}\n`);
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      await message.reply(
        'Desculpe, tive dificuldade em processar esta imagem. Pode tentar enviar novamente?'
      );
    }
  }

  async handleAudioMedia(message, phoneNumber, media) {
    try {
      await message.reply('Ouvindo seu áudio... 🎧');

      const response = await conversationManager.handleAudioMessage(
        phoneNumber,
        media.data
      );

      await message.reply(response);
      console.log(`🤖 Nutri.ia: ${response}\n`);
    } catch (error) {
      console.error('Erro ao processar áudio:', error);
      await message.reply(
        'Desculpe, tive dificuldade em processar este áudio. Pode tentar enviar novamente ou escrever sua mensagem?'
      );
    }
  }

  async sendMessage(phoneNumber, messageText) {
    try {
      const chatId = `${phoneNumber}@c.us`;
      await this.client.sendMessage(chatId, messageText);
      console.log(`📤 Mensagem enviada para ${phoneNumber}`);
      return true;
    } catch (error) {
      console.error(`Erro ao enviar mensagem para ${phoneNumber}:`, error);
      return false;
    }
  }

  async initialize() {
    console.log('🚀 Iniciando Nutri.ia...\n');
    await this.client.initialize();
  }

  getClient() {
    return this.client;
  }
}

module.exports = new WhatsAppClient();
