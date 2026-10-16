import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth/auth";
import { SettingsProvider } from "@/lib/settings/settings";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <BrowserRouter>
            <TooltipProvider>
                <AuthProvider>
                    <SettingsProvider>
                        <App />
                        <Toaster />
                    </SettingsProvider>
                </AuthProvider>
            </TooltipProvider>
        </BrowserRouter>
    </StrictMode>,
);