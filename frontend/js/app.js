// ── Conversation history ──

let conversationHistory = [];
let isProcessing = false;


// ── Main send function ──

async function handleSend() {
    if (isProcessing) return;

    const input = document.getElementById('userInput');
    const text = input.value.trim();

    if (!text) return;

    // Clear input
    input.value = '';
    input.style.height = 'auto';

    // Add to history and UI
    conversationHistory.push({ role: 'user', content: text });
    appendUserMessage(text);

    // Lock input
    isProcessing = true;
    setSendEnabled(false);

    // Create assistant bubble with typing indicator
    const bubble = createAssistantMessage();
    showTypingIndicator(bubble);

    try {
        const response = await sendMessage(conversationHistory);
        await processStream(response, bubble);

        // Extract final text from bubble for history
        const assistantText = bubble.innerText || bubble.textContent || '';
        conversationHistory.push({
            role: 'assistant',
            content: assistantText
        });

    } catch (error) {
        bubble.innerHTML = `<span style="color: var(--error);">Error: ${escapeHTML(error.message)}</span>`;
        console.error('[NexusAgent]', error);
    }

    // Unlock input
    isProcessing = false;
    setSendEnabled(true);
    input.focus();
}


// ── Auto resize textarea ──

function initTextarea() {
    const input = document.getElementById('userInput');

    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 160) + 'px';
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });
}


// ── Suggestion buttons ──

function initSuggestions() {
    document.querySelectorAll('.suggestion-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = document.getElementById('userInput');
            input.value = btn.textContent.trim();
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 160) + 'px';
            handleSend();
        });
    });
}


// ── New chat button ──

function initNewChat() {
    document.getElementById('newChatBtn').addEventListener('click', () => {
        conversationHistory = [];

        const messages = document.getElementById('messages');
        messages.innerHTML = `
            <div class="welcome" id="welcome">
                <div class="welcome-icon">⬡</div>
                <h2>How can I help you?</h2>
                <p>I can answer questions and search the web for real-time information.</p>
                <div class="suggestions">
                    <button class="suggestion-btn">What's happening in AI today?</button>
                    <button class="suggestion-btn">Latest news on open source LLMs</button>
                    <button class="suggestion-btn">How does retrieval augmented generation work?</button>
                    <button class="suggestion-btn">Best lightweight models for local inference</button>
                </div>
            </div>
        `;

        initSuggestions();
    });
}


// ── Send button ──

function initSendButton() {
    document.getElementById('sendBtn').addEventListener('click', handleSend);
}


// ── Health check ──

async function runHealthCheck() {
    const online = await checkHealth();
    setServerStatus(online);

    // Recheck every 30 seconds
    setTimeout(runHealthCheck, 30000);
}


// ── Init ──

document.addEventListener('DOMContentLoaded', () => {
    initTextarea();
    initSuggestions();
    initNewChat();
    initSendButton();
    runHealthCheck();
});