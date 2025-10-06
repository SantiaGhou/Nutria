const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class OpenAIService {
  constructor() {
    this.systemPrompt = `Você é Nutri.ia, uma nutricionista profissional virtual altamente experiente e empática que atua via WhatsApp.

Sua personalidade:
- Amigável, acolhedora e motivadora
- Faz perguntas de forma natural e conversacional, nunca de forma robotizada
- Coleta informações aos poucos, sem interrogar o usuário
- Demonstra interesse genuíno pela saúde e bem-estar do usuário
- Usa linguagem simples e acessível

Suas responsabilidades:
1. Reconhecer alimentos em fotos e estimar calorias com precisão
2. Registrar refeições quando o usuário concordar
3. Coletar informações do perfil (peso, altura, idade, sexo, objetivo) de forma natural e gradual
4. Criar planos alimentares personalizados baseados nos objetivos do usuário
5. Dar sugestões práticas e motivadoras sobre alimentação
6. Lembrar o contexto das conversas anteriores

Diretrizes importantes:
- Nunca force o usuário a responder perguntas
- Seja proativa em sugerir melhorias na alimentação
- Celebre as conquistas do usuário
- Adapte suas recomendações ao estilo de vida e preferências do usuário
- Mantenha um tom positivo e encorajador`;
  }

  async analyzeImage(imageBase64, mimeType) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Você é um especialista em nutrição que identifica alimentos em imagens e estima suas calorias. Responda SEMPRE em português do Brasil de forma clara e objetiva."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analise esta imagem e identifique os alimentos presentes. Para cada alimento, estime a quantidade em gramas e as calorias totais. Se não conseguir identificar comida na imagem, diga isso claramente. Formato da resposta: [Nome do alimento] - [quantidade estimada] - [calorias estimadas]"
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 500
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Erro ao analisar imagem:', error);
      throw error;
    }
  }

  async chat(messages, userContext = {}) {
    try {
      const contextPrompt = this.buildContextPrompt(userContext);

      const systemMessage = {
        role: "system",
        content: this.systemPrompt + "\n\n" + contextPrompt
      };

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [systemMessage, ...messages],
        max_tokens: 1000,
        temperature: 0.8
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Erro ao conversar com OpenAI:', error);
      throw error;
    }
  }

  buildContextPrompt(userContext) {
    let context = "Contexto do usuário:\n";

    if (userContext.name) {
      context += `- Nome: ${userContext.name}\n`;
    }
    if (userContext.weight) {
      context += `- Peso: ${userContext.weight}kg\n`;
    }
    if (userContext.height) {
      context += `- Altura: ${userContext.height}cm\n`;
    }
    if (userContext.age) {
      context += `- Idade: ${userContext.age} anos\n`;
    }
    if (userContext.gender) {
      context += `- Sexo: ${userContext.gender}\n`;
    }
    if (userContext.goal) {
      const goalMap = {
        'gain_muscle': 'ganhar massa muscular',
        'lose_weight': 'emagrecer',
        'maintain_weight': 'manter o peso'
      };
      context += `- Objetivo: ${goalMap[userContext.goal] || userContext.goal}\n`;
    }

    if (userContext.todayMeals && userContext.todayMeals.length > 0) {
      context += `\nRefeições de hoje:\n`;
      userContext.todayMeals.forEach(meal => {
        context += `- ${meal.meal_type}: ${meal.food_name} (${meal.calories} kcal)\n`;
      });

      const totalCalories = userContext.todayMeals.reduce((sum, meal) => sum + parseFloat(meal.calories), 0);
      context += `Total de calorias hoje: ${totalCalories.toFixed(0)} kcal\n`;
    }

    return context;
  }

  extractCaloriesFromText(text) {
    const calorieMatches = text.match(/(\d+)\s*(kcal|calorias)/i);
    if (calorieMatches) {
      return parseInt(calorieMatches[1]);
    }

    const numberMatches = text.match(/(\d+)\s*-\s*(\d+)/);
    if (numberMatches) {
      return parseInt(numberMatches[numberMatches.length - 1]);
    }

    return null;
  }

  extractFoodName(text) {
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.trim() && !line.toLowerCase().includes('não consigo') && !line.toLowerCase().includes('não há')) {
        const foodMatch = line.match(/^([^-]+)/);
        if (foodMatch) {
          return foodMatch[1].trim();
        }
      }
    }
    return 'Alimento não identificado';
  }

  async transcribeAudio(audioBuffer) {
    try {
      const fs = require('fs');
      const path = require('path');
      const tmpDir = path.join(__dirname, '../../tmp');

      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      const tempFilePath = path.join(tmpDir, `audio_${Date.now()}.ogg`);
      fs.writeFileSync(tempFilePath, audioBuffer);

      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-1',
        language: 'pt'
      });

      fs.unlinkSync(tempFilePath);

      return transcription.text;
    } catch (error) {
      console.error('Erro ao transcrever áudio:', error);
      throw error;
    }
  }
}

module.exports = new OpenAIService();
