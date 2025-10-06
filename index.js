const whatsappClient = require('./src/whatsapp/client');
const ReminderScheduler = require('./src/reminders/reminder.scheduler');

async function startNutriIA() {
  try {
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║                                      ║');
    console.log('║          🥗 NUTRI.IA 🥗             ║');
    console.log('║                                      ║');
    console.log('║   Bot de Nutrição para WhatsApp     ║');
    console.log('║                                      ║');
    console.log('╚══════════════════════════════════════╝\n');

    console.log('📋 Funcionalidades:');
    console.log('   ✓ Reconhecimento de alimentos por imagem');
    console.log('   ✓ Reconhecimento de voz (transcrição de áudios)');
    console.log('   ✓ Contagem de calorias automática');
    console.log('   ✓ Registro de refeições diárias');
    console.log('   ✓ Planos alimentares personalizados');
    console.log('   ✓ Lembretes de refeições');
    console.log('   ✓ Memória de conversas\n');

    await whatsappClient.initialize();

    whatsappClient.getClient().on('ready', () => {
      const reminderScheduler = new ReminderScheduler(whatsappClient);
      reminderScheduler.initialize();

      console.log('\n╔══════════════════════════════════════╗');
      console.log('║   ✅ SISTEMA TOTALMENTE ATIVO ✅    ║');
      console.log('╚══════════════════════════════════════╝\n');
    });

  } catch (error) {
    console.error('\n❌ Erro ao iniciar Nutri.ia:', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  console.log('\n\n👋 Encerrando Nutri.ia...');
  process.exit(0);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Erro não tratado:', error);
});

startNutriIA();
