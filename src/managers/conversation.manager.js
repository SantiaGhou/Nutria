const databaseService = require('../services/database.service');
const openaiService = require('../services/openai.service');

class ConversationManager {
  constructor() {
    this.pendingActions = new Map();
  }

  async handleMessage(phoneNumber, messageText, hasMedia = false) {
    try {
      const user = databaseService.getOrCreateUser(phoneNumber);

      databaseService.addConversationMessage(user.id, 'user', messageText);

      const conversationHistory = databaseService.getConversationHistory(user.id, 15);

      const todayMeals = databaseService.getTodayMeals(user.id);

      const userContext = {
        name: user.name,
        weight: user.weight,
        height: user.height,
        age: user.age,
        gender: user.gender,
        goal: user.goal,
        todayMeals: todayMeals
      };

      const messages = conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      messages.push({
        role: 'user',
        content: messageText
      });

      const aiResponse = await openaiService.chat(messages, userContext);

      databaseService.addConversationMessage(user.id, 'assistant', aiResponse);

      databaseService.clearOldConversationHistory(user.id, 50);

      this.extractAndUpdateUserInfo(user.id, messageText, aiResponse);

      return aiResponse;
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      return 'Desculpe, tive um problema ao processar sua mensagem. Pode tentar novamente?';
    }
  }

  async handleImageMessage(phoneNumber, imageBase64, mimeType, caption = '') {
    try {
      const user = databaseService.getOrCreateUser(phoneNumber);

      const analysisResult = await openaiService.analyzeImage(imageBase64, mimeType);

      databaseService.addConversationMessage(
        user.id,
        'user',
        `[Imagem enviada] ${caption}`
      );
      databaseService.addConversationMessage(
        user.id,
        'assistant',
        analysisResult
      );

      const calories = openaiService.extractCaloriesFromText(analysisResult);
      const foodName = openaiService.extractFoodName(analysisResult);

      if (calories) {
        this.pendingActions.set(phoneNumber, {
          type: 'meal_registration',
          foodName: foodName,
          calories: calories,
          imageAnalyzed: true,
          timestamp: Date.now()
        });

        const followUpMessage = `\n\nGostaria de registrar "${foodName}" (${calories} kcal) na sua refeição de hoje? Responda "sim" para registrar ou "não" se preferir não registrar.`;

        return analysisResult + followUpMessage;
      }

      return analysisResult;
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      return 'Desculpe, tive dificuldade em analisar esta imagem. Pode tentar enviar novamente ou descrever o que comeu?';
    }
  }

  async checkPendingActions(phoneNumber, messageText) {
    const pendingAction = this.pendingActions.get(phoneNumber);

    if (!pendingAction) {
      return null;
    }

    if (Date.now() - pendingAction.timestamp > 300000) {
      this.pendingActions.delete(phoneNumber);
      return null;
    }

    const lowerText = messageText.toLowerCase().trim();

    if (pendingAction.type === 'meal_registration') {
      if (lowerText.includes('sim') || lowerText.includes('quero') || lowerText.includes('registr')) {
        const user = databaseService.getOrCreateUser(phoneNumber);

        const mealType = this.determineMealType();

        databaseService.addMeal(user.id, {
          mealType: mealType,
          foodName: pendingAction.foodName,
          calories: pendingAction.calories,
          imageAnalyzed: pendingAction.imageAnalyzed
        });

        this.pendingActions.delete(phoneNumber);

        return `Perfeito! Registrei "${pendingAction.foodName}" no seu ${mealType}. Continue assim! 💪`;
      } else if (lowerText.includes('não') || lowerText.includes('nao')) {
        this.pendingActions.delete(phoneNumber);
        return 'Tudo bem! Não vou registrar. Se precisar de algo, é só chamar!';
      }
    }

    return null;
  }

  determineMealType() {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 11) {
      return 'breakfast';
    } else if (hour >= 11 && hour < 15) {
      return 'lunch';
    } else if (hour >= 15 && hour < 19) {
      return 'snack';
    } else {
      return 'dinner';
    }
  }

  async extractAndUpdateUserInfo(userId, userMessage, aiResponse) {
    const lowerMessage = userMessage.toLowerCase();

    const updates = {};

    const weightMatch = userMessage.match(/(\d+(?:[.,]\d+)?)\s*kg/i) ||
                       userMessage.match(/peso\s*(?:é|:)?\s*(\d+(?:[.,]\d+)?)/i);
    if (weightMatch) {
      updates.weight = parseFloat(weightMatch[1].replace(',', '.'));
    }

    const heightMatch = userMessage.match(/(\d+(?:[.,]\d+)?)\s*cm/i) ||
                       userMessage.match(/altura\s*(?:é|:)?\s*(\d+(?:[.,]\d+)?)/i) ||
                       userMessage.match(/(\d{3})\s*cm/i) ||
                       userMessage.match(/1[.,]?\d{2}/);
    if (heightMatch) {
      updates.height = parseFloat(heightMatch[1].replace(',', '.'));
    }

    const ageMatch = userMessage.match(/(\d{1,2})\s*anos/i) ||
                    userMessage.match(/idade\s*(?:é|:)?\s*(\d{1,2})/i);
    if (ageMatch) {
      updates.age = parseInt(ageMatch[1]);
    }

    if (lowerMessage.includes('homem') || lowerMessage.includes('masculino')) {
      updates.gender = 'male';
    } else if (lowerMessage.includes('mulher') || lowerMessage.includes('feminino')) {
      updates.gender = 'female';
    }

    if (lowerMessage.includes('ganhar massa') || lowerMessage.includes('ganhar peso') || lowerMessage.includes('hipertrofia')) {
      updates.goal = 'gain_muscle';
    } else if (lowerMessage.includes('emagrecer') || lowerMessage.includes('perder peso') || lowerMessage.includes('emagrecimento')) {
      updates.goal = 'lose_weight';
    } else if (lowerMessage.includes('manter') || lowerMessage.includes('manutenção')) {
      updates.goal = 'maintain_weight';
    }

    const nameMatch = userMessage.match(/(?:me chamo|meu nome é|sou (?:a |o )?)\s*([A-ZÀ-Ú][a-zà-ú]+)/i);
    if (nameMatch) {
      updates.name = nameMatch[1];
    }

    if (Object.keys(updates).length > 0) {
      try {
        databaseService.updateUserProfile(userId, updates);
      } catch (error) {
        console.error('Erro ao atualizar perfil do usuário:', error);
      }
    }
  }

  async handleAudioMessage(phoneNumber, audioBuffer) {
    try {
      const user = databaseService.getOrCreateUser(phoneNumber);

      const buffer = Buffer.from(audioBuffer, 'base64');

      const transcription = await openaiService.transcribeAudio(buffer);

      console.log(`🎤 Transcrição: ${transcription}`);

      databaseService.addConversationMessage(user.id, 'user', `[Áudio] ${transcription}`);

      const conversationHistory = databaseService.getConversationHistory(user.id, 15);
      const todayMeals = databaseService.getTodayMeals(user.id);

      const userContext = {
        name: user.name,
        weight: user.weight,
        height: user.height,
        age: user.age,
        gender: user.gender,
        goal: user.goal,
        todayMeals: todayMeals
      };

      const messages = conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      messages.push({
        role: 'user',
        content: transcription
      });

      const aiResponse = await openaiService.chat(messages, userContext);

      databaseService.addConversationMessage(user.id, 'assistant', aiResponse);
      databaseService.clearOldConversationHistory(user.id, 50);
      this.extractAndUpdateUserInfo(user.id, transcription, aiResponse);

      return aiResponse;
    } catch (error) {
      console.error('Erro ao processar áudio:', error);
      return 'Desculpe, tive um problema ao processar seu áudio. Pode tentar novamente?';
    }
  }

  async getTodaySummary(phoneNumber) {
    try {
      const user = databaseService.getUserProfile(phoneNumber);
      if (!user) {
        return 'Ainda não tenho informações suas. Vamos começar?';
      }

      const todayMeals = databaseService.getTodayMeals(user.id);

      if (todayMeals.length === 0) {
        return 'Você ainda não registrou nenhuma refeição hoje. Que tal me enviar uma foto do que comeu?';
      }

      let summary = 'Aqui está o resumo das suas refeições de hoje:\n\n';

      const mealTypeMap = {
        'breakfast': 'Café da manhã',
        'lunch': 'Almoço',
        'dinner': 'Jantar',
        'snack': 'Lanche'
      };

      const totalCalories = todayMeals.reduce((sum, meal) => sum + parseFloat(meal.calories), 0);

      todayMeals.forEach(meal => {
        summary += `${mealTypeMap[meal.meal_type] || meal.meal_type}: ${meal.food_name} (${meal.calories} kcal)\n`;
      });

      summary += `\nTotal: ${totalCalories.toFixed(0)} kcal`;

      return summary;
    } catch (error) {
      console.error('Erro ao gerar resumo:', error);
      return 'Desculpe, tive um problema ao buscar suas informações.';
    }
  }
}

module.exports = new ConversationManager();
