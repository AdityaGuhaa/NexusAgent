/*
 * Copyright 2026 Aditya Guha
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// ── Conversation history ──
let conversationHistory = [];
let isProcessing = false;


// ── Main send function ──
async function handleSend() {
    if (isProcessing) {
        console.log('[NexusAgent] Blocked: still processing previous request');
        return;
    }

    const input = document.getElementById('userInput');
    const text = input.value.trim();

    if (!text) return;

    // Lock FIRST — before anything else
    isProcessing = true;
    setSendEnabled(false);
    input.disabled = true;

    input.value = '';
    input.style.height = 'auto';

    // 1. Append user message to DOM
    appendUserMessage(text);

    // 2. Add to conversation history
    conversationHistory.push({ role: 'user', content: text });

    // 3. Create assistant bubble immediately after user message
    const bubble = createAssistantMessage();
    const bubbleId = bubble.id;
    console.log('[NexusAgent] Sending request, bubble:', bubbleId);
    showTypingIndicator(bubble);

    try {
        const response = await sendMessage(conversationHistory);
        // Re-fetch bubble from DOM by ID to ensure we have the right reference
        const targetBubble = document.getElementById(bubbleId);
        console.log('[NexusAgent] Response received, rendering to:', bubbleId, 'found:', !!targetBubble);
        await processStream(response, targetBubble || bubble);

        const finalBubble = document.getElementById(bubbleId) || bubble;
        const assistantText = finalBubble.innerText || finalBubble.textContent || '';
        conversationHistory.push({
            role: 'assistant',
            content: assistantText
        });

    } catch (error) {
        const errorBubble = document.getElementById(bubbleId) || bubble;
        errorBubble.innerHTML = `<span style="color: var(--error);">Error: ${escapeHTML(error.message)}</span>`;
        console.error('[NexusAgent]', error);
    }

    // Unlock
    isProcessing = false;
    setSendEnabled(true);
    input.disabled = false;
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