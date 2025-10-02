import { Client, LocalAuth } from "whatsapp-web.js";    
import qrcode from "qrcode-terminal";

const client = new Client ({
    authStrategy: new LocalAuth()
})

async function startBot(){
    try {
        await initializeDatabase();
        await initializeOpenAI();
        console.log('Bot inicializado com sucesso!');
    } catch (error) {
        console.error('Erro ao inicializar o bot:', error);
        process.exit(1);
    }
}
client.on ('qr', (qr) => {
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client Pronto para execução! ')
})

startBot.then(() => client.initialize());
