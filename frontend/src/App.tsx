import { useLocation, useRoutes } from "react-router-dom";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/lib/auth/auth";
import { appRoutes, PATHS } from "@/routes";

function App() {
    const { user, signOut } = useAuth();
    const page = useRoutes(appRoutes);
    // The Road & Access map fills the screen like an app, so it has no footer.
    const fullScreen = useLocation().pathname === PATHS.roadAccess;

    return (
        <div className="flex min-h-svh flex-col">
            <Navbar user={user} onSignOut={signOut} />
            <main className="flex flex-1 flex-col bg-background">{page}</main>
            {!fullScreen && <Footer user={user} />}
        </div>
    );
}

export default App;
