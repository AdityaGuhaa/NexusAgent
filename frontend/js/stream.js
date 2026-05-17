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

async function processStream(response, bubble) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let activeToolIndicators = {};

    while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
            if (!line.startsWith('data: ')) continue;

            const raw = line.slice(6).trim();
            if (!raw) continue;

            let event;
            try {
                event = JSON.parse(raw);
            } catch {
                continue;
            }

            handleEvent(event, bubble, activeToolIndicators);
        }
    }

    // Process any remaining buffer
    if (buffer.startsWith('data: ')) {
        const raw = buffer.slice(6).trim();
        if (raw) {
            try {
                const event = JSON.parse(raw);
                handleEvent(event, bubble, activeToolIndicators);
            } catch {
                // ignore malformed final chunk
            }
        }
    }
}


function handleEvent(event, bubble, activeToolIndicators) {
    switch (event.type) {

        case 'tool_call':
            // Model decided to call a tool
            break;

        case 'tool_running':
            // Tool is executing — show spinner
            const indicatorId = appendToolIndicator(
                bubble,
                event.tool,
                event.query || ''
            );
            activeToolIndicators[event.tool] = indicatorId;
            break;

        case 'tool_result':
            // Tool finished — mark done
            const id = activeToolIndicators[event.tool];
            if (id) markToolDone(id);
            break;

        case 'text':
            // Final answer — render into bubble
            renderFinalResponse(bubble, event.content || '');
            break;

        case 'done':
            // Stream complete — nothing to do, app.js handles re-enabling input
            break;

        default:
            console.warn('[NexusAgent] Unknown event type:', event.type);
    }
}