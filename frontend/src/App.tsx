import { useState } from "react";
import { useRoutes } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { demoUsers } from "@/data/users";
import { appRoutes } from "@/routes";
import type { AppUser } from "@/types/user";

function App() {
    // Placeholder auth state. Replace with Supabase / MyDigitalID session later.
    const [user, setUser] = useState<AppUser | null>(null);
    const page = useRoutes(appRoutes);

    return (
        <div className="flex min-h-svh flex-col">
            <Navbar user={user} onSignIn={() => setUser(demoUsers.resident)} onSignOut={() => setUser(null)} />
            <main className="flex flex-1 flex-col bg-white">{page}</main>
        </div>
    );
}

export default App;