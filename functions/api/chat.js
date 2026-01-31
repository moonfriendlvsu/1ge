// Cloudflare Pages Function - Gemini AI Proxy
// This keeps the API key secret on the server side

export async function onRequest(context) {
    // Only allow POST requests
    if (context.request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (context.request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Get message from request
        const { message } = await context.request.json();

        if (!message) {
            return new Response(JSON.stringify({ error: 'Message required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Get API key from environment variable (set in Cloudflare dashboard)
        const apiKey = context.env.GEMINI_API_KEY;

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'API key not configured' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // System prompt for the AI
        const systemPrompt = `Ты — дружелюбный помощник благотворительной платформы 1=GE.

О платформе 1=GE:
- 1=GE — это платформа благотворительности в Казахстане
- Каждый человек жертвует всего 1 тенге в день
- Все средства идут на помощь нуждающимся людям
- Деньги распределяются на проверенные проекты (медицина, социальная помощь)
- Регистрация бесплатная, нужен только email
- Контакты: support@1ge.kz, Telegram: @1ge_support

Правила ответа:
- Отвечай коротко и дружелюбно (1-3 предложения)
- Используй эмодзи для тепла
- Отвечай на том языке, на котором спрашивают (казахский или русский)
- Если вопрос не о 1=GE, вежливо верни к теме платформы
- Не выдумывай информацию, которой нет выше`;

        // Call Gemini API
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `${systemPrompt}\n\nПользователь спрашивает: ${message}`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 200
                    }
                })
            }
        );

        if (!geminiResponse.ok) {
            throw new Error('Gemini API error');
        }

        const data = await geminiResponse.json();
        const reply = data.candidates[0].content.parts[0].text;

        return new Response(JSON.stringify({ reply }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to get response' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
