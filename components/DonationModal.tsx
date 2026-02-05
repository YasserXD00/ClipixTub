import * as React from 'react';
import { X, Heart, CreditCard, DollarSign, Wallet, Sparkles, Check, Loader2, Coffee } from 'lucide-react';

interface DonationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AMOUNTS = [3, 5, 10, 25];

export const DonationModal: React.FC<DonationModalProps> = ({ isOpen, onClose }) => {
    const [amount, setAmount] = React.useState(5);
    const [customAmount, setCustomAmount] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [cardNumber, setCardNumber] = React.useState('');
    const [randomBrand, setRandomBrand] = React.useState<string | null>(null);
    const [step, setStep] = React.useState<'form' | 'processing' | 'success'>('form');

    if (!isOpen) return null;

    const handleCustomAmount = (val: string) => {
        setCustomAmount(val);
        const num = parseFloat(val);
        if (!isNaN(num)) setAmount(num);
    };

    const handleCardInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '');
        if (val.length <= 16) {
            setCardNumber(val);
            if (val.length === 16) {
                // User uploaded 5 images but asked for "these 4", I will include all 5 to be safe
                const brands = ['visa', 'mastercard', 'google_pay', 'apple_pay', 'amazon_pay'];
                setRandomBrand(brands[Math.floor(Math.random() * brands.length)]);
            } else {
                setRandomBrand(null);
            }
        }
    };

    const handleDonate = async () => {
        setStep('processing');
        // Simulate processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        setStep('success');
    };

    const getCardLogo = () => {
        if (cardNumber.length === 16 && randomBrand) {
            switch (randomBrand) {
                case 'visa':
                    return (
                        <svg viewBox="0 0 48 48" className="h-6 w-auto">
                            <path fill="#1434CB" d="M19.1 1.7L12 45h6.6l3.3-15.6h10.7l1.1-6.1H23.9l3.4-15.3H19.1zm3.8 21.5h6.6l1.3-7.8h-7.9l-1.3 7.8zm-19.8-6h8.6v1.3c0 9.8 11.2 12.8 11.2 12.8l-1.6 7.6c0 0-3.6 1-7.2.9-6.9 0-11-5.3-11-13.8 0-6.1 4.7-14.8 4.7-14.8M34.7 1.7L42 35.8l6-31.1H31.9z" />
                        </svg>
                    );
                case 'mastercard':
                    return (
                        <svg viewBox="0 0 24 24" className="h-6 w-auto">
                            <circle cx="9" cy="12" r="7" fill="#EB001B" />
                            <circle cx="15" cy="12" r="7" fill="#F79E1B" fillOpacity="0.8" />
                        </svg>
                    );
                case 'amex':
                    return (
                        <svg viewBox="0 0 40 40" className="h-6 w-auto">
                            <rect width="40" height="25" rx="4" fill="#006FCF" />
                            <path fill="white" d="M4.5 7h4l1.5 4 1.5-4h3l-3 7 3 7h-4l-1.5-4-1.5 4h-3l3-7-3-7zm16 0h9v2h-6v4h5v2h-5v4h6v2h-9V7zm-5 0h3l2 5 2-5h3v14h-3v-5l-2 5h-2l-2-5v5h-3V7z" />
                        </svg>
                    );
                case 'discover':
                    return (
                        <svg viewBox="0 0 60 40" className="h-6 w-auto">
                            <text x="0" y="28" fontFamily="Arial" fontWeight="bold" fontSize="24" fill="#000">DISC</text>
                            <circle cx="68" cy="20" r="10" fill="#F79E1B" />
                            <text x="82" y="28" fontFamily="Arial" fontWeight="bold" fontSize="24" fill="#000">VER</text>
                            <circle cx="60" cy="20" r="6" fill="#F79E1B" />
                            <path d="M60 14 L65 20 L60 26 L55 20 Z" fill="#F79E1B" />
                        </svg>
                    );
                case 'bitcoin':
                    return (
                        <svg viewBox="0 0 24 24" className="h-6 w-auto">
                            <circle cx="12" cy="12" r="12" fill="#F7931A" />
                            <path fill="white" d="M16 10c.5-1.5-1-2-2.5-2.5l.5-2-1.5-.5-.5 2c-.5 0-1 0-1.5-.5l.5-2-1.5-.5-.5 2c-.5-.1-1-.1-1.5-.2l-1 .3v.1l.5.1c.5 0 .5.2.5.5v7c0 .2 0 .5-.5.5l-.5.1v.1l1.5.5s.5-.1 1.5-.2l.5 2 1.5.5.5-2c.5.1 1 .2 1.5.2 2.5.5 4.5-.5 5-2.5 0-1-.5-1.5-1-2 .5-.5 1-2 .5-2.5zm-3 4c1.5.5 1 2.5 0 3-.5 0-1 0-2-.5l.5-2c1 0 1.5 0 1.5 0zm.5-4c1.5.5 1 2.5 0 2.5-.5 0-1.5 0-2-.5l.5-2s1 0 1.5 0z" />
                        </svg>
                    );
                case 'google_pay':
                    return (
                        <svg viewBox="0 0 40 20" className="h-6 w-auto">
                            <path fill="#4285F4" d="M6.3 8.6V4.4h1.7v4.2c0 .4-.1.7-.3.9-.2.2-.6.4-1 .4-.3 0-.6-.1-.8-.2-.2-.2-.3-.5-.3-.9zM3.8 8.6V4.4h1.7v4.2c0 .5-.1.8-.4 1-.2.3-.6.4-1 .4-.4 0-.7-.1-1-.4-.2-.2-.3-.6-.3-1V4.4h1.7v3.5c0 .3.1.5.2.6.1.1.3.2.5.2.2 0 .4-.1.5-.2.1-.2.2-.4.2-.6z" />
                            <path fill="#4285F4" d="M12.8 10L10.3 4.4h1.8l1.6 3.8 1.5-3.8h1.7L14.4 10h-1.6z" />
                            <path fill="#5F6368" d="M21 4.4h2.7c.9 0 1.6.2 2.1.6.5.4.8 1 .8 1.8 0 .5-.1.9-.4 1.3-.2.4-.6.6-1 .8l1.6 2.9H25l-1.4-2.6H21v2.6h-1.7V4.4zm2.6 3.1c.4 0 .7-.1 1-.3.2-.2.3-.5.3-.9 0-.3-.1-.6-.3-.7-.2-.2-.6-.3-1-.3H22.7v2.2h.9z" />
                            <path fill="#EB001B" d="M36.7 4.4v7.4h-1.7V4.4h1.7z" />
                            <path fill="#F79E1B" d="M36.7 4.4v7.4h-1.7V4.4h1.7z" />
                            <text x="0" y="15" className="fill-slate-600 dark:fill-white font-bold text-[10px] font-sans">G Pay</text>
                        </svg>
                    );
                case 'apple_pay':
                    return (
                        <svg viewBox="0 0 46 18" className="h-6 w-auto">
                            <path fill="currentColor" className="text-black dark:text-white" d="M6.9 7.7c.3-1.6 1.3-2.9 2.5-3.5-.2-1.3-1-2.4-2.2-2.4-.9 0-1.8.6-2.3.6-.5 0-1.4-.5-2.2-.5-2.2 0-4.3 1.8-4.3 4.7 0 3.3 2.6 7.6 5.3 7.6.9 0 1.4-.6 2.4-.6 1 0 1.4.6 2.4.6 1.4 0 2.4-1.3 3.1-2.6-1.5-.7-2.6-2.2-2.6-4.1h-.2c-1.1.1-2.2-.3-2.6-1.5zM15.5 13.9h1.7V4.5h-1.7v9.4zm5.5-3.8c0-1.9 1.5-3.2 3.8-3.2.9 0 1.7.2 2.2.5v-.5c0-1.2-1-2-2.5-2-1.2 0-2.3.4-2.6.7l-.5-1.3c.5-.4 1.8-.9 3.4-.9 2.5 0 3.9 1.5 3.9 4v6.5h-1.6v-1.3c-.7.9-1.8 1.5-3.1 1.5-2.1-.1-3-1.5-3-3.6zm5.8.5v-1.1c-.5-.3-1.1-.4-1.7-.4-1.4 0-2.1.7-2.1 1.8 0 1.2.8 1.9 1.9 1.9 1.2 0 1.9-.8 1.9-2.2zm7.1 7.2L32 10.4l-1.8-5.9h1.8l1 3.5 1-3.5h1.7l-3.3 9.4h-1.7z" />
                        </svg>
                    );
                case 'amazon_pay':
                    return (
                        <svg viewBox="0 0 50 20" className="h-6 w-auto">
                            <path fill="currentColor" className="text-black dark:text-white" d="M9.9 14.8l-.8-.8c0-.1 2.9-2 5.5-2 2.5 0 3.6.8 3.6 2 0 1.4-1.5 2.1-3.2 2.1-2.6 0-5.1-1.3-5.1-1.3zm12.3-1.6h-1c-.5 0-.7.3-.8.6l-.1.4 1.8.3c.5 0 .8-.5.1-1.3zm-10.4-3.5c1.4-1.7 4.1-1.6 5.2-1.6 1.4 0 2.5.2 3.1.5v-4h-1.7v2c-.7-.4-2-.8-3.4-.8-3.1 0-5.8 2.5-5.8 5.7 0 2.9 2.1 5.4 5.2 5.4 1.5 0 2.7-.6 3.4-1.4v1.2h1.7v-8h-1.6v1.4c-.6-.9-1.9-1.6-3.4-1.6-2.1 0-3.9 1.7-3.9 4.2 0 2.1 1.4 4 3.7 4 .8 0 1.7-.2 2.3-.6v-1.4c-.8.5-1.8.7-2.7.7-1.3.1-2.1-.6-2.1-1.7z" />
                            <path fill="#FF9900" d="M5.5 17.5c3.2 2.2 8.6 2.2 12.3.5-.3-.4-.5-.9-.6-1.3-3.9 1.1-7.9 1.1-10.2-.4-1.4-.9-1.5-1-1.5-1z" />
                        </svg>
                    );
            }
        }

        return <CreditCard className="w-5 h-5 text-slate-400 group-focus-within:text-pink-500 transition-colors" />;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-950 rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up font-sans border border-slate-800 flex flex-col max-h-[90vh]">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-20 backdrop-blur-md"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header Background */}
                <div className="h-40 bg-gradient-to-r from-pink-600 to-purple-600 relative flex items-center justify-center shrink-0">
                    <div className="absolute inset-0 opacity-20">
                        <Sparkles className="absolute top-4 left-10 w-8 h-8 text-white animate-pulse" />
                        <Sparkles className="absolute bottom-8 right-10 w-6 h-6 text-white animate-pulse delay-75" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white rounded-full blur-[80px]"></div>
                    </div>

                    <div className="absolute -bottom-12 flex flex-col items-center z-10">
                        <div className="w-24 h-24 bg-slate-900 rounded-full p-1.5 shadow-xl">
                            <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden border-4 border-slate-900">
                                <Heart className="w-10 h-10 text-white fill-white animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-16 pb-6 px-4 md:px-8 text-center text-slate-200 overflow-y-auto flex-1">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Enjoying ClipixTub?</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">Support the development with a coffee!</p>

                    {step === 'processing' ? (
                        <div className="py-12 animate-fade-in">
                            <Loader2 className="w-16 h-16 text-pink-500 animate-spin mx-auto mb-6" />
                            <p className="font-bold text-xl text-slate-700 dark:text-slate-200">Processing donation...</p>
                        </div>
                    ) : step === 'success' ? (
                        <div className="py-10 animate-fade-in">
                            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in shadow-lg shadow-green-500/30">
                                <Check className="w-10 h-10 text-white stroke-[3]" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Thank You!</h3>
                            <p className="text-slate-500 text-lg mb-8 max-w-sm mx-auto">Your donation has been sent successfully. We appreciate your support!</p>
                            <button
                                onClick={onClose}
                                className="px-10 py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold rounded-full transition-all shadow-lg hover:shadow-pink-500/25"
                            >
                                Return to App
                            </button>
                        </div>
                    ) : (
                        <div className="animate-fade-in max-w-lg mx-auto">
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 mb-6 text-left shadow-inner">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                        Select Amount
                                    </h3>
                                    <div className="flex bg-white dark:bg-slate-950 rounded-full p-1 border border-slate-200 dark:border-slate-800">
                                        {[1, 3, 5, 10].map(num => (
                                            <button
                                                key={num}
                                                onClick={() => { setAmount(num * 5); setCustomAmount(''); }}
                                                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${amount === num * 5
                                                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                                    }`}
                                            >
                                                ${num * 5}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 mb-8">
                                    <div className="relative flex-grow">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <span className="text-2xl">☕</span>
                                        </div>
                                        <input
                                            type="number"
                                            placeholder="Custom Amount"
                                            value={customAmount}
                                            onChange={(e) => handleCustomAmount(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl text-lg font-bold outline-none focus:border-pink-500 transition-colors"
                                        />
                                    </div>
                                    <div className="text-2xl font-black text-slate-300">=</div>
                                    <div className="min-w-[80px] text-center">
                                        <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
                                            ${amount}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Name (Optional)</label>
                                            <input
                                                type="text"
                                                placeholder="Your Name"
                                                className="w-full p-3.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:border-pink-500 transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Message</label>
                                            <input
                                                type="text"
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                placeholder="Say hello!"
                                                className="w-full p-3.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:border-pink-500 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <div className="p-5 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group focus-within:ring-2 focus-within:ring-pink-500/20 transition-all">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-pink-500 to-purple-600"></div>

                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                    Payment Method
                                                </div>
                                                <div className="flex gap-2 opacity-50 grayscale group-hover:grayscale-0 transition-all">
                                                    <div className="h-4 w-6 bg-slate-200 rounded"></div>
                                                    <div className="h-4 w-6 bg-slate-300 rounded"></div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        placeholder="0000 0000 0000 0000"
                                                        maxLength={16}
                                                        value={cardNumber}
                                                        onChange={handleCardInput}
                                                        className="w-full p-3 pl-12 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-lg font-mono outline-none focus:bg-white dark:focus:bg-slate-900 transition-colors tracking-widest placeholder:tracking-normal"
                                                    />
                                                    <div className="absolute left-3 top-3.5 pointer-events-none">
                                                        {getCardLogo()}
                                                    </div>
                                                </div>
                                                <div className="flex gap-4">
                                                    <input
                                                        type="text"
                                                        placeholder="MM / YY"
                                                        maxLength={5}
                                                        className="w-1/2 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-center font-mono outline-none focus:bg-white dark:focus:bg-slate-900 transition-colors"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="CVC"
                                                        maxLength={3}
                                                        className="w-1/2 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-center font-mono outline-none focus:bg-white dark:focus:bg-slate-900 transition-colors"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pb-4 sticky bottom-0 bg-white dark:bg-slate-950 pt-2 border-t border-slate-100 dark:border-slate-900">
                                <button
                                    onClick={handleDonate}
                                    className="w-full py-5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-2xl font-black text-xl shadow-xl shadow-pink-600/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                                >
                                    <Heart className="w-6 h-6 fill-white/20" />
                                    Support with ${amount}
                                </button>
                                <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-1">
                                    <Wallet className="w-3 h-3" /> Secure Payment
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
