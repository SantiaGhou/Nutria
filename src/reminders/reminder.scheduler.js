const cron = require('node-cron');
const databaseService = require('../services/database.service');

class ReminderScheduler {
  constructor(whatsappClient) {
    this.whatsappClient = whatsappClient;
    this.scheduledJobs = new Map();
  }

  initialize() {
    cron.schedule('*/15 * * * *', async () => {
      await this.checkAndSendReminders();
    });

    console.log('⏰ Sistema de lembretes ativado (verificação a cada 15 minutos)');

    this.setupDefaultReminders();
  }

  setupDefaultReminders() {
    const defaultReminders = [
      { time: '08:00', mealType: 'breakfast', message: 'Bom dia! ☀️ Já tomou café da manhã? Me envie uma foto do que comeu!' },
      { time: '12:00', mealType: 'lunch', message: 'Hora do almoço! 🍽️ Não se esqueça de registrar sua refeição!' },
      { time: '16:00', mealType: 'snack', message: 'Que tal um lanchinho saudável? 🥗 Me conte o que comeu!' },
      { time: '19:00', mealType: 'dinner', message: 'Hora do jantar! 🌙 Vamos registrar sua última refeição do dia?' }
    ];

    defaultReminders.forEach(reminder => {
      const [hour, minute] = reminder.time.split(':');
      const cronExpression = `${minute} ${hour} * * *`;

      cron.schedule(cronExpression, async () => {
        await this.sendDefaultReminder(reminder.message);
      });
    });

    console.log('✅ Lembretes padrão configurados (8h, 12h, 16h, 19h)');
  }

  async sendDefaultReminder(message) {
    try {
      const reminders = databaseService.getAllActiveReminders();

      for (const reminder of reminders) {
        const phoneNumber = reminder.phone_number;

        if (phoneNumber) {
          await this.whatsappClient.sendMessage(phoneNumber, message);
          console.log(`📤 Lembrete enviado para ${phoneNumber}`);
        }
      }
    } catch (error) {
      console.error('Erro ao enviar lembretes padrão:', error);
    }
  }

  async checkAndSendReminders() {
    try {
      const now = new Date();
      const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

      const reminders = databaseService.getAllActiveReminders();

      for (const reminder of reminders) {
        const reminderTime = reminder.reminder_time.substring(0, 5);

        if (reminderTime === currentTime) {
          await this.sendReminderMessage(reminder);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar lembretes:', error);
    }
  }

  async sendReminderMessage(reminder) {
    try {
      const phoneNumber = reminder.phone_number;

      const mealTypeMessages = {
        'breakfast': 'Bom dia! ☀️ Hora do café da manhã! Me envie uma foto do que vai comer.',
        'lunch': 'Hora do almoço! 🍽️ Não se esqueça de registrar sua refeição!',
        'dinner': 'Boa noite! 🌙 Hora do jantar! Vamos registrar o que você comeu?',
        'snack': 'Hora do lanche! 🥤 Me conte o que vai comer!'
      };

      const message = mealTypeMessages[reminder.meal_type] ||
                     'Olá! Lembrete para registrar sua refeição! 😊';

      await this.whatsappClient.sendMessage(phoneNumber, message);
      console.log(`📤 Lembrete personalizado enviado para ${phoneNumber}`);
    } catch (error) {
      console.error('Erro ao enviar lembrete:', error);
    }
  }

  async scheduleCustomReminder(userId, phoneNumber, mealType, time) {
    try {
      databaseService.setReminderSettings(userId, mealType, time);

      const jobKey = `${phoneNumber}-${mealType}`;

      if (this.scheduledJobs.has(jobKey)) {
        this.scheduledJobs.get(jobKey).stop();
      }

      const [hour, minute] = time.split(':');
      const cronExpression = `${minute} ${hour} * * *`;

      const job = cron.schedule(cronExpression, async () => {
        const mealTypeMessages = {
          'breakfast': 'Bom dia! ☀️ Hora do café da manhã!',
          'lunch': 'Hora do almoço! 🍽️',
          'dinner': 'Boa noite! 🌙 Hora do jantar!',
          'snack': 'Hora do lanche! 🥤'
        };

        const message = mealTypeMessages[mealType] || 'Lembrete de refeição!';
        await this.whatsappClient.sendMessage(phoneNumber, message);
      });

      this.scheduledJobs.set(jobKey, job);

      console.log(`✅ Lembrete personalizado criado para ${phoneNumber} às ${time}`);
      return true;
    } catch (error) {
      console.error('Erro ao agendar lembrete:', error);
      return false;
    }
  }
}

module.exports = ReminderScheduler;
