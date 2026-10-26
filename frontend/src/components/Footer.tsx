import { Link } from "react-router-dom";
import { PATHS } from "@/routes";
import type { AppUser } from "@/types/user";

const linkStyle =
    "rounded-sm text-xs text-white/70 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * Site footer: the logo on the left and a few key links to its right, level with its bottom, plus
 * account links that depend on whether someone is signed in.
 */
export default function Footer({ user = null }: { user?: AppUser | null }) {
    const account = user
        ? [
              { path: PATHS.profile, label: "My Dashboard" },
              { path: PATHS.profileTickets, label: "My Tickets" },
          ]
        : [
              { path: PATHS.login, label: "Sign in" },
              { path: PATHS.register, label: "Register" },
          ];
    const groups = [
        // The main pages only; the navbar has the rest.
        {
            title: "Construction",
            links: [
                { path: PATHS.constructionInfo, label: "Stations & Alignment" },
                { path: PATHS.constructionUpdates, label: "Construction Updates" },
            ],
        },
        {
            title: "Community",
            links: [
                { path: PATHS.roadAccess, label: "Road & Access" },
                { path: PATHS.ticket, label: "Support" },
            ],
        },
        { title: "Account", links: account },
    ];

    return (
        <footer className="bg-logo-backdrop text-white">
            <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row md:items-end md:justify-between">
                <div>
                    <Link
                        to={PATHS.home}
                        className="inline-flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <img
                            src="/favicon.png"
                            alt=""
                            aria-hidden="true"
                            className="size-14 object-contain"
                        />
                        <span className="text-xl font-bold tracking-tight">MutiaraConnect</span>
                    </Link>
                    <p className="mt-1 text-xs text-white/60">
                        © {new Date().getFullYear()} MutiaraConnect · CMT322 project
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:mr-16 md:gap-12">
                    {groups.map((group) => (
                        <nav key={group.title} aria-label={group.title}>
                            <h2 className="text-xs font-semibold">{group.title}</h2>
                            <ul className="mt-2 space-y-1">
                                {group.links.map((link) => (
                                    <li key={link.path}>
                                        <Link to={link.path} className={linkStyle}>
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    ))}
                </div>
            </div>
        </footer>
    );
}
