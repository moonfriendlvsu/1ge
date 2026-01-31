/* ========================================
   1=GE FAQ Chatbot
   Free scripted bot with pre-programmed answers
   ======================================== */

(function() {
    'use strict';

    // FAQ Database (Bilingual)
    const faqData = {
        greetings: {
            patterns: ['привет', 'салем', 'здравствуй', 'хай', 'hello', 'hi', 'сәлем'],
            response: {
                kk: '👋 Сәлем! Мен 1=GE көмекшісімін. Сізге қалай көмектесе аламын?',
                ru: '👋 Привет! Я помощник 1=GE. Чем могу помочь?'
            }
        },
        whatIs1ge: {
            patterns: ['что такое', '1ge', 'не деген', 'деген не', 'бұл не', 'что это', 'как работает', 'қалай жұмыс'],
            response: {
                kk: '💚 1=GE — бұл қайырымдылық платформасы. Әр адам күніне 1 теңге береді, барлығы бірігіп нұсқаушыларға көмектеседі.',
                ru: '💚 1=GE — это платформа благотворительности. Каждый человек жертвует 1 тенге в день, и вместе мы помогаем нуждающимся.'
            }
        },
        howToDonate: {
            patterns: ['как пожертвовать', 'қалай беруге', 'донат', 'аудар', 'перевод', 'перевести', 'помочь', 'көмектес'],
            response: {
                kk: '💸 Жертва беру өте оңай! "1₸ беру" батырмасын басыңыз — автоматты түрде жалпы қорға түседі.',
                ru: '💸 Пожертвовать очень просто! Нажмите кнопку "Внести 1₸" — и ваш вклад автоматически попадёт в общий фонд.'
            }
        },
        whereMoney: {
            patterns: ['куда', 'қайда', 'деньги', 'ақша', 'средства', 'фонд', 'қор', 'распределя'],
            response: {
                kk: '🎯 Барлық қаражат "Жобалар" бөлімінде көрсетілген нақты адамдарға бөлінеді. Әр жоба тексерілген.',
                ru: '🎯 Все средства распределяются между реальными людьми в разделе "Проекты". Каждый проект проверен.'
            }
        },
        safety: {
            patterns: ['безопасн', 'мошенни', 'обман', 'доверя', 'қауіпсіз', 'алаяқ', 'сенім'],
            response: {
                kk: '🛡️ Біз әр өтінішті тексереміз. Құжаттар, медициналық анықтамалар — барлығы расталады.',
                ru: '🛡️ Мы проверяем каждую заявку. Документы, медицинские справки — всё подтверждается.'
            }
        },
        registration: {
            patterns: ['регистра', 'тіркел', 'аккаунт', 'войти', 'кіру', 'вход', 'создать'],
            response: {
                kk: '📝 Тіркелу үшін "Тіркелу" батырмасын басыңыз. Email және құпия сөз қажет.',
                ru: '📝 Для регистрации нажмите "Зарегистрироваться". Нужен email и пароль.'
            }
        },
        contact: {
            patterns: ['связь', 'контакт', 'поддержк', 'байланыс', 'қолдау', 'телефон', 'email', 'написать'],
            response: {
                kk: '📧 Бізбен байланысу: support@1ge.kz немесе Telegram: @1ge_support',
                ru: '📧 Связаться с нами: support@1ge.kz или Telegram: @1ge_support'
            }
        },
        thanks: {
            patterns: ['спасибо', 'рахмет', 'благодар', 'thank'],
            response: {
                kk: '😊 Өзіңізге рахмет! Тағы сұрақ болса — жазыңыз!',
                ru: '😊 Вам спасибо! Если будут ещё вопросы — пишите!'
            }
        }
    };

    // Default response if no match
    const defaultResponse = {
        kk: '🤔 Кешіріңіз, сұрағыңызды түсінбедім. Мына сұрақтарды қоюға болады:\n• 1=GE дегеніміз не?\n• Қалай көмектесуге болады?\n• Ақша қайда жұмсалады?',
        ru: '🤔 Извините, не понял вопрос. Попробуйте спросить:\n• Что такое 1=GE?\n• Как пожертвовать?\n• Куда идут деньги?'
    };

    // Get current language
    function getLang() {
        return localStorage.getItem('1ge-lang') || 'kk';
    }

    // Find matching response
    function findResponse(message) {
        const lowerMsg = message.toLowerCase();
        
        for (const key in faqData) {
            const faq = faqData[key];
            for (const pattern of faq.patterns) {
                if (lowerMsg.includes(pattern)) {
                    return faq.response;
                }
            }
        }
        return defaultResponse;
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
                <span class="chatbot-title">🤖 ${lang === 'kk' ? '1=GE Көмекші' : '1=GE Помощник'}</span>
                <button class="chatbot-close">×</button>
            </div>
            <div class="chatbot-messages" id="chatbot-messages">
                <div class="chatbot-message bot">
                    ${lang === 'kk' ? '👋 Сәлем! Мен 1=GE көмекшісімін. Маған сұрақ қойыңыз!' : '👋 Привет! Я помощник 1=GE. Задайте мне вопрос!'}
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
        
        function sendMessage() {
            const msg = input.value.trim();
            if (!msg) return;
            
            addMessage(msg, 'user');
            input.value = '';
            
            // Simulate typing delay
            setTimeout(() => {
                const response = findResponse(msg);
                const lang = getLang();
                addMessage(response[lang] || response.ru, 'bot');
            }, 500 + Math.random() * 500);
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

    // Initialize when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createChatbotUI);
    } else {
        createChatbotUI();
    }

})();
