
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

export const getGroqResponse = async (userPrompt: string, imageUrl?: string): Promise<string> => {
    try {
        const messages: any[] = [
            {
                role: "system",
                content: "You are a helpful and intelligent AI assistant for the TeamSync Pro application. Your responses should be professional, concise, and helpful."
            }
        ];

        if (imageUrl) {
            messages.push({
                role: "user",
                content: [
                    { type: "text", text: userPrompt || "What is in this image?" },
                    { type: "image_url", image_url: { url: imageUrl } }
                ]
            });
        } else {
            messages.push({
                role: "user",
                content: userPrompt
            });
        }

        // Updated Model Selection based on user request for advanced reasoning models
        // Text: deepseek-r1-distill-llama-70b (Top-tier reasoning model available on Groq)
        // Vision: llama-3.2-11b-vision-preview (Best for image tasks)
        const model = imageUrl ? "llama-3.2-11b-vision-preview" : "deepseek-r1-distill-llama-70b";

        // Increase token limit for reasoning models as they output "thought" tokens
        const maxTokens = imageUrl ? 1024 : 8192;
        const temperature = imageUrl ? 0.7 : 0.6; // Slightly lower temp for reasoning consistency

        console.log(`Sending request to Groq (Model: ${model})...`);

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: messages,
                model: model,
                temperature: temperature,
                max_tokens: maxTokens,
                top_p: 0.95,
                stream: false
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
            console.error("Groq API Error:", errorData);
            return `System Error: ${errorData.error?.message || response.statusText} (Status: ${response.status})`;
        }

        const data = await response.json();
        let content = data.choices[0]?.message?.content || "No response generated.";

        // Optional: Clean up DeepSeek's <think> tags if you don't want to show the reasoning process to the end user
        // content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

        return content;
    } catch (error: any) {
        console.error("Groq Service Network Error:", error);
        return `Network Error: ${error.message}`;
    }
};
