import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";

export const InstallBanner = () => {
  const [prompt, setPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed (running as standalone PWA)
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Don't show if dismissed in this session
    if (sessionStorage.getItem("pwa-banner-dismissed")) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    const isSafari = ios && /safari/i.test(navigator.userAgent) && !/crios|fxios|opios|mercury/i.test(navigator.userAgent);
    setIsIOS(ios && isSafari); // only show iOS instructions if on Safari

    if (ios && !isSafari) {
      // On iOS but not Safari — prompt to open in Safari
      setShow(true);
      setIsIOS(false); // use a different message
      return;
    }

    if (ios && isSafari) {
      setShow(true);
      return;
    }

    // Android/Chrome: wait for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setShow(false);
    setPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    sessionStorage.setItem("pwa-banner-dismissed", "1");
  };

  if (!show || dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-orange-200 shadow-lg px-4 py-3 flex items-center gap-3">
      <img src="/logo.png" alt="MyHomePlate" className="h-10 w-10 rounded-xl shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">Install MyHomePlate</p>
        {isIOS ? (
          <p className="text-xs text-gray-500">
            Tap the <strong>Share ⎋</strong> button below → <strong>Add to Home Screen</strong>
          </p>
        ) : prompt ? (
          <p className="text-xs text-gray-500">Add to your home screen — works like an app</p>
        ) : (
          // iOS but not Safari
          <p className="text-xs text-orange-600 font-medium">
            Open this page in <strong>Safari</strong> to install the app
          </p>
        )}
      </div>
      {!isIOS && prompt && (
        <Button
          size="sm"
          className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white"
          onClick={handleInstall}
        >
          <Download className="h-3.5 w-3.5 mr-1" />
          Install
        </Button>
      )}
      <button
        onClick={handleDismiss}
        className="shrink-0 text-gray-400 hover:text-gray-600 p-1"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
