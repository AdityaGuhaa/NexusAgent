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

// ── Simple markdown renderer ──

function renderMarkdown(text) {
    if (!text) return '';

    let html = text
        // Code blocks
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Bold
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        // H1
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        // H2
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        // H3
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        // Unordered lists
        .replace(/^\- (.+)$/gm, '<li>$1</li>')
        // Ordered lists
        .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
        // Wrap consecutive <li> in <ul>
        .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
        // Links [text](url)
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        // Line breaks
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br/>');

    return `<p>${html}</p>`;
}


// ── Extract URLs from rendered text for source chips ──

function extractSources(text) {
    const regex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
    const sources = [];
    const seen = new Set();
    let match;

    while ((match = regex.exec(text)) !== null) {
        const title = match[1];
        const url = match[2];
        if (!seen.has(url)) {
            seen.add(url);
            sources.push({ title, url });
        }
    }

    return sources;
}


// ── Hide welcome screen ──

function hideWelcome() {
    const welcome = document.getElementById('welcome');
    if (welcome) welcome.style.display = 'none';
}


function appendUserMessage(text) {
    hideWelcome();

    const messages = document.getElementById('messages');

    const div = document.createElement('div');
    div.className = 'message user';
    div.innerHTML = `
        <div class="message-bubble">
            ${escapeHTML(text)}
        </div>
    `;

    messages.appendChild(div);
    scrollToBottom();

    return div;
}


function createAssistantMessage() {
    hideWelcome();

    const messages = document.getElementById('messages');

    const div = document.createElement('div');
    div.className = 'message assistant';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    const uniqueId = 'bubble-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    bubble.id = uniqueId;
    bubble.dataset.messageIndex = messages.querySelectorAll('.message').length;

    div.appendChild(bubble);
    messages.appendChild(div);

    scrollToBottom();
    console.log('[NexusAgent] Created bubble:', uniqueId);
    return bubble;
}

// ── Show typing indicator ──

function showTypingIndicator(bubble) {
    bubble.innerHTML = `
        <div class="typing-indicator">
            <span></span><span></span><span></span>
        </div>
    `;
}


// ── Append tool indicator to bubble ──

function appendToolIndicator(bubble, toolName, query) {
    const id = `tool-${Date.now()}`;

    const div = document.createElement('div');
    div.className = 'tool-indicator';
    div.id = id;
    div.innerHTML = `
        <div class="spinner"></div>
        <span>Searching: "${query}"</span>
    `;

    // Remove typing indicator if present
    const typing = bubble.querySelector('.typing-indicator');
    if (typing) typing.remove();

    bubble.appendChild(div);
    scrollToBottom();

    return id;
}


// ── Mark tool indicator as done ──

function markToolDone(indicatorId) {
    const el = document.getElementById(indicatorId);
    if (!el) return;

    el.innerHTML = `
        <span class="tool-done">✓</span>
        <span>${el.querySelector('span:last-child')?.textContent || 'Search complete'}</span>
    `;
}


// ── Render final text into bubble ──

function renderFinalResponse(bubble, text) {
    console.log('[NexusAgent] Rendering into bubble:', bubble.id, 'text length:', (text || '').length);
    
    // Remove all tool indicators
    bubble.querySelectorAll('.tool-indicator').forEach(el => el.remove());

    if (!text || text.trim() === '') {
        bubble.innerHTML = '<p><em>No response generated.</em></p>';
        scrollToBottom();
        return;
    }

    const sources = extractSources(text);

    let html = renderMarkdown(text);

    if (sources.length > 0) {
        const chips = sources.map(s =>
            `<a class="source-chip" href="${s.url}" target="_blank" rel="noopener noreferrer">${escapeHTML(s.title)}</a>`
        ).join('');

        html += `<div class="sources">${chips}</div>`;
    }

    bubble.innerHTML = html;
    scrollToBottom();
}


// ── Scroll chat to bottom ──

function scrollToBottom() {
    const messages = document.getElementById('messages');
    messages.scrollTop = messages.scrollHeight;
}


// ── Escape HTML to prevent XSS in user input ──

function escapeHTML(text) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}


// ── Set server status indicator ──

function setServerStatus(online) {
    const el = document.getElementById('serverStatus');
    if (!el) return;
    el.textContent = online ? 'Online' : 'Offline';
    el.classList.toggle('online', online);
    el.classList.toggle('offline', !online);
}


// ── Disable / enable send button ──

function setSendEnabled(enabled) {
    const btn = document.getElementById('sendBtn');
    if (btn) btn.disabled = !enabled;
}