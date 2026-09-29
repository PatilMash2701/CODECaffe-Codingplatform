import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { Send, AlertTriangle } from 'lucide-react';

function ChatAi({ problem, getCurrentCode, language = 'cpp' }) {
    const [messages, setMessages] = useState([
        { 
            role: 'model', 
            parts: [{text: "Hello! I'm your DSA assistant (fine-tuned on this platform). Ask about approaches, hints, or your current code — problem context and your editor code are sent automatically."}] 
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, reset,formState: {errors} } = useForm();
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const onSubmit = async (data) => {
        if (!data.message.trim()) return;
        
        const userMessage = { role: 'user', parts: [{text: data.message}] };
        setMessages(prev => [...prev, userMessage]);
        reset();
        setIsLoading(true);

        try {
            const currentCode = typeof getCurrentCode === 'function'
                ? getCurrentCode()
                : '';

            const startCodeEntry = Array.isArray(problem?.startCode)
                ? problem.startCode.find((s) => s.language === language)
                : null;

            const requestData = {
                question: data.message,
                title: problem?.title || '',
                description: problem?.description || '',
                testCases: problem?.visibleTestCases || [],
                startCode: 'code here',   //dont make changes here
                currentCode,
                language,
            };

            console.log('AI Service Request:', requestData);

            const response = await axios.post("http://localhost:8000/chat", requestData);

            if (response.data?.message) {
                setMessages(prev => [...prev, { 
                    role: 'model', 
                    parts: [{text: response.data.message}] 
                }]);
            } else {
                throw new Error('No response from AI service');
            }
        } catch (error) {
            console.error("API Error:", error);
            const serverMsg = error.response?.data?.message;
            const errorText = serverMsg || "Sorry, I'm having trouble connecting to the AI service. Please try again later.";
            setMessages(prev => [...prev, { 
                role: 'model', 
                parts: [{ text: errorText }]
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen max-h-[80vh] min-h-[500px]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                    <div 
                        key={index} 
                        className={`chat ${msg.role === "user" ? "chat-end" : "chat-start"}`}
                    >
                        <div className={`chat-bubble ${msg.role === 'model' ? 'bg-base-200' : 'bg-primary text-primary-content'} text-base-content`}>
                            {msg.parts[0].text}
                            {msg.role === 'model' && msg.parts[0].text.includes('trouble') && (
                                <div className="flex items-center mt-1 text-warning">
                                    <AlertTriangle size={16} className="mr-1" />
                                    <span className="text-xs">Connection Issue</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form 
                onSubmit={handleSubmit(onSubmit)} 
                className="sticky bottom-0 p-4 bg-base-100 border-t"
            >
                <div className="flex items-center">
                    <input 
                        placeholder="Ask me anything" 
                        className="input input-bordered flex-1" 
                        {...register("message", { required: true, minLength: 2 })}
                    />
                    <button 
                        type="submit" 
                        className="btn btn-ghost ml-2"
                        disabled={!!errors.message || isLoading}
                    >
                        {isLoading ? (
                            <span className="loading loading-spinner"></span>
                        ) : (
                            <Send size={20} />
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ChatAi;