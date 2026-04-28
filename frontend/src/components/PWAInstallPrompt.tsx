import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const PWAInstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [installed, setInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed (standalone mode)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setInstalled(true);
            return;
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Show prompt after a delay (don't interrupt first visit)
            setTimeout(() => setShowPrompt(true), 15000);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Handle successful install
        const installedHandler = () => {
            setInstalled(true);
            setShowPrompt(false);
        };
        window.addEventListener('appinstalled', installedHandler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('appinstalled', installedHandler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
            setInstalled(true);
        }
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        // Don't show again for 7 days
        localStorage.setItem('pwa-dismissed', String(Date.now()));
    };

    // Check if dismissed recently
    const dismissedTime = localStorage.getItem('pwa-dismissed');
    if (dismissedTime) {
        const daysSinceDismiss = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
        if (daysSinceDismiss < 7) return null;
    }

    if (installed || !showPrompt) return null;

    return (
        <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-green-200 dark:border-green-700 p-5 transition-all">
                <div className="flex items-start gap-4">
                    <div className="text-4xl">📱</div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Install PocketAccountant</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                            Install on your device for offline access and a faster experience.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={handleInstall}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
                            >
                                Install App
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm transition"
                            >
                                Not now
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg"
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PWAInstallPrompt;
