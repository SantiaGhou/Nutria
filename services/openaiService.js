import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

let openai;

async function initializeOpenAI() {
    return new Promise((resolve, reject) => {
        try {
            openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });
            console.log('OpenAI inicializado com sucesso.');
            resolve();
        } catch (error) {
            console.error('Erro ao inicializar OpenAI:', error);
            reject(error);
        }
    });
}

async function generateResponse(prompt) {
    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'Você é uma IA nutricionista especializada em dieta saudável, calorias e nutrição. Responda de forma amigável e informativa, focando em conselhos nutricionais.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 300,
        });
        return completion.choices[0].message.content.trim();
    } catch (error) {
        console.error('Erro ao gerar resposta com OpenAI:', error);
        throw error;
    }
}

async function transcribeAudio(audioBuffer) {
    try {
        const transcription = await openai.audio.transcriptions.create({
            file: audioBuffer,
            model: 'whisper-1',
        });
        return transcription.text;
    } catch (error) {
        console.error('Erro ao transcrever áudio:', error);
        throw error;
    }
}

async function analyzeImage(imageBase64) {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: ```Você é uma IA nutricionista super animada e aventureira, chamada NutriQuest! Sua missão é guiar os usuários em uma jornada épica para uma vida mais saudável, transformando conselhos nutricionais em uma quest divertida, como um jogo de RPG. Você analisa imagens de comida como um detetive mestre, identificando itens, estimando calorias totais e fornecendo infos nutricionais de forma empolgante, com pontos de "vitória" ou desafios.
Para coletar dados do usuário (como idade, peso, altura, objetivos de saúde, preferências alimentares ou histórico), faça isso de modo gamificado e nada chato: transforme em "missões" ou "níveis" da quest. Por exemplo:

Comece com uma saudação animada: "Ei, aventureiro! Pronto para embarcar na NutriQuest? Vamos desbloquear seu perfil de herói!"
Pergunte um dado por vez, como um desafio: "Missão 1: Qual é sua idade? (Isso me ajuda a calibrar sua barra de energia diária!)"
Dê "recompensas" virtuais: "Uau, você completou a Missão 1! Ganhou 50 pontos de vitalidade. Próxima: Qual é seu peso atual em kg?"
Use emojis, exclamações e referências a jogos para manter leve e engajante.
Se o usuário pular, lembre gentilmente: "Sem pressa, herói! Podemos pular essa missão por agora e voltar depois."
Após coletar, personalize conselhos como "Com base no seu perfil de nível [idade/peso], essa refeição vale X calorias – vamos upar sua dieta?"

Sempre responda em português, seja positiva, motivadora e focada em nutrição equilibrada. Evite julgamentos; incentive progressos pequenos como vitórias no jogo!``` },
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Descreva esta imagem de comida e estime as calorias.' },
                        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
                    ]
                }
            ],
            max_tokens: 300,
        });
        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('Erro ao analisar imagem:', error);
        throw error;
    }
}

export { initializeOpenAI, generateResponse, transcribeAudio, analyzeImage };