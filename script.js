const API_KEY = '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';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
let conversationHistory = [];
let contextMemory = new Map();

async function typeText(element, text) {
    const words = text.split(' ');
    element.textContent = '';
    for (let word of words) {
        await new Promise(r => setTimeout(r, 30));
        element.textContent += word + ' ';
        element.scrollIntoView({ behavior: 'smooth', block: 'end' });
        if (Math.random() < 0.1) await new Promise(r => setTimeout(r, Math.random() * 300));
    }
}

function analyzeTopicShift(input) {
    const lastConversation = conversationHistory[conversationHistory.length - 1];
    return lastConversation ? {
        topicShift: true,
        previousContext: lastConversation,
        currentInput: input,
        contextualMemory: Array.from(contextMemory.entries())
    } : {
        topicShift: false,
        currentInput: input
    };
}

async function neuralTraining(input) {
    const topicAnalysis = analyzeTopicShift(input);
    const systemPrompt = `You are MetaDeep, an advanced AI assistant created by NZ R. Your role is to provide insightful and contextual responses to the user's input. Analyze the current input and generate a comprehensive response that demonstrates your deep understanding of the topic.`;

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: "undi95/toppy-m-7b:free",
            messages: [{
                role: "system",
                content: systemPrompt
            }],
            temperature: 0.9,
            max_tokens: 2500
        })
    });
    const data = await response.json();
    return data.choices[0].message.content;
}

async function processResponse(input, training) {
    const contextKey = input.toLowerCase().split(' ').slice(0, 3).join('_');
    contextMemory.set(contextKey, {
        input,
        training,
        timestamp: Date.now()
    });

    conversationHistory.push({
        input,
        training,
        contextKey
    });

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: "undi95/toppy-m-7b:free",
            messages: [{
                role: "system",
                content: `You are MetaDeep's synthesis core. Generate a concise, insightful, and contextually relevant response based on the following information:`
            }],
            temperature: 0.9,
            max_tokens: 1900
        })
    });
    const data = await response.json();
    return data.choices[0].message.content;
}

function addElement(className, text = '') {
    const element = document.createElement('div');
    element.className = className;
    element.textContent = text;
    document.getElementById('chatContainer').appendChild(element);
    element.scrollIntoView({ behavior: 'smooth', block: 'end' });
    return element;
}

async function processInput() {
    const input = document.getElementById('userInput').value.trim();
    if (!input) return;

    document.getElementById('userInput').value = '';
    const userInputElement = addElement('user-input', input);

    const trainerElement = addElement('training-process', "Initiating continuous thought process...");
    await typeText(trainerElement, "Initiating continuous thought process...");

    const trainingInstructions = await neuralTraining(input);
    await typeText(trainerElement, trainingInstructions);

    const learnerElement = addElement('neural-conversation', "Synthesizing contextual response...");
    await typeText(learnerElement, "Synthesizing contextual response...");

    const finalResponse = await processResponse(input, trainingInstructions);
    const finalElement = addElement('final-output', finalResponse);
    await typeText(finalElement, finalResponse);
}

document.getElementById('userInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') processInput();
});
