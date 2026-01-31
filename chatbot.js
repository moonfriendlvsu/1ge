/* ========================================
   1=GE AI Chatbot - Powered by Gemini
   Secure version using serverless function
   ======================================== */

(function () {
    'use strict';

    // API endpoint (Cloudflare Function)
    const CHAT_API_URL = '/api/chat';

    // Get current language
    function getLang() {
        return localStorage.getItem('1ge-lang') || 'kk';
    }

    // Call our secure API
    async function getAIResponse(userMessage) {
        try {
            const response = await fetch(CHAT_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userMessage })
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            return data.reply;
        } catch (error) {
            console.error('Chat API error:', error);
            const lang = getLang();
            return lang === 'kk'
                ? '😔 Кешіріңіз, қазір жауап бере алмадым. Кейінірек қайталап көріңіз.'
                : '😔 Извините, не смог ответить. Попробуйте позже.';
        }
    }

    // Create chatbot UI
    function createChatbotUI() {
        const lang = getLang();

        // Chat toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'chatbot-toggle';
        toggleBtn.innerHTML = '💬';
        toggleBtn.setAttribute('aria-label', 'Открыть чат');

        // Chat window
        const chatWindow = document.createElement('div');
        chatWindow.className = 'chatbot-window';
        chatWindow.innerHTML = `
            <div class="chatbot-header">
                <span class="chatbot-title">🤖 ${lang === 'kk' ? '1=GE AI Көмекші' : '1=GE AI Помощник'}</span>
                <button class="chatbot-close">×</button>
            </div>
            <div class="chatbot-messages" id="chatbot-messages">
                <div class="chatbot-message bot">
                    ${lang === 'kk' ? '👋 Сәлем! Мен 1=GE жасанды интеллект көмекшісімін. Кез келген сұрақ қойыңыз!' : '👋 Привет! Я AI-помощник 1=GE. Задайте любой вопрос!'}
                </div>
            </div>
            <div class="chatbot-input-area">
                <input type="text" class="chatbot-input" id="chatbot-input" 
                       placeholder="${lang === 'kk' ? 'Сұрағыңызды жазыңыз...' : 'Напишите вопрос...'}"
                       autocomplete="off">
                <button class="chatbot-send" id="chatbot-send">➤</button>
            </div>
        `;

        // Add to page
        document.body.appendChild(toggleBtn);
        document.body.appendChild(chatWindow);

        // Event listeners
        toggleBtn.addEventListener('click', () => {
            chatWindow.classList.toggle('open');
            toggleBtn.classList.toggle('hidden');
            if (chatWindow.classList.contains('open')) {
                document.getElementById('chatbot-input').focus();
            }
        });

        chatWindow.querySelector('.chatbot-close').addEventListener('click', () => {
            chatWindow.classList.remove('open');
            toggleBtn.classList.remove('hidden');
        });

        const input = document.getElementById('chatbot-input');
        const sendBtn = document.getElementById('chatbot-send');
        let isProcessing = false;

        async function sendMessage() {
            const msg = input.value.trim();
            if (!msg || isProcessing) return;

            isProcessing = true;
            addMessage(msg, 'user');
            input.value = '';

            // Show typing indicator
            const typingId = showTyping();

            // Get AI response
            const response = await getAIResponse(msg);

            // Remove typing indicator and show response
            removeTyping(typingId);
            addMessage(response, 'bot');
            isProcessing = false;
        }

        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    // Add message to chat
    function addMessage(text, sender) {
        const messagesDiv = document.getElementById('chatbot-messages');
        const msgDiv = document.createElement('div');
        msgDiv.className = `chatbot-message ${sender}`;
        msgDiv.textContent = text;
        messagesDiv.appendChild(msgDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    // Show typing indicator
    function showTyping() {
        const messagesDiv = document.getElementById('chatbot-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chatbot-message bot typing';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
        messagesDiv.appendChild(typingDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        return 'typing-indicator';
    }

    // Remove typing indicator
    function removeTyping(id) {
        const typingDiv = document.getElementById(id);
        if (typingDiv) typingDiv.remove();
    }

    // Initialize when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createChatbotUI);
    } else {
        createChatbotUI();
    }

})();
