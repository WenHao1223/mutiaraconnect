import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth/auth.tsx";
import { SettingsProvider } from "@/lib/settings";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <SettingsProvider>
                    <App />
                    <Toaster />
                </SettingsProvider>
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>,
);