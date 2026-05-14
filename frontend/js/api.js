const API_BASE = 'http://localhost:8000';


async function sendMessage(messages) {
    const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`API error ${response.status}: ${error}`);
    }

    return response;
}


async function checkHealth() {
    try {
        const response = await fetch(`${API_BASE}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000)
        });
        return response.ok;
    } catch {
        return false;
    }
}