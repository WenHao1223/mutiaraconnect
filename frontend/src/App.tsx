import { useRoutes } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/lib/auth/auth";
import { appRoutes } from "@/routes";

function App() {
    const { user, signOut } = useAuth();
    const page = useRoutes(appRoutes);

    return (
        <div className="flex min-h-svh flex-col">
            <Navbar user={user} onSignOut={signOut} />
            <main className="flex flex-1 flex-col bg-background">{page}</main>
        </div>
    );
}

export default App;