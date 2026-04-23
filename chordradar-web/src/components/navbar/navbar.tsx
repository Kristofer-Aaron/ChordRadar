
import { useEffect, useState } from "react";
import type { MouseEventHandler, ReactNode } from "react";
import "./navbar.css";

const THEME_STORAGE_KEY = "chordradar.theme";

type ThemeName = "default-light" | "default-dark";

function isThemeName(value: string): value is ThemeName {
    return value === "default-light" || value === "default-dark";
}

function normalizeThemeName(value: string): ThemeName {
    // Backward compatibility for previous persisted values
    if (isThemeName(value)) {
        return value;
    }

    // Default to system preference or default-light
    if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "default-dark";
    }

    return "default-light";
}

type NavbarProps = {
  isAuthenticated: boolean;
  onLogout: () => void;
    onOpenSignIn: () => void;
    onOpenSignUp: () => void;
};

type NavItemProps = {
    href: string;
    label: string;
    icon: ReactNode;
    onClick?: MouseEventHandler<HTMLAnchorElement>;
};

function NavItem({ href, label, icon, onClick }: NavItemProps) {
    return (
        <a href={href} onClick={onClick} aria-label={label} title={label}>
            <span className="nav-label">{label}</span>
            <span className="nav-icon" aria-hidden="true">
                {icon}
            </span>
        </a>
    );
}

function resolveInitialTheme(): ThemeName {
    try {
        const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
        if (stored) {
            const normalizedTheme = normalizeThemeName(stored);
            if (normalizedTheme) {
                return normalizedTheme;
            }
        }
    } catch {
        // Ignore storage access errors.
    }

    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "default-dark";
    }

    return "default-light";
}

export default function Navbar({ isAuthenticated, onLogout, onOpenSignIn, onOpenSignUp }: NavbarProps) {
    const [theme, setTheme] = useState<ThemeName>(() => resolveInitialTheme());
    const isDarkMode = theme === "default-dark";

    useEffect(() => {
        const html = document.documentElement;
        html.setAttribute("data-theme", theme);
        html.setAttribute("data-bs-theme", isDarkMode ? "dark" : "light");

        try {
            window.localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch {
            // Ignore storage write errors.
        }
    }, [theme, isDarkMode]);

    const nextModeLabel = isDarkMode ? "Light mode" : "Dark mode";

    const [collapsed, setCollapsed] = useState(false);

    return (
        <>
        <nav className = {"navbar " + (collapsed ? "navbar-collapsed" : "")}>
            <div className="navbar-container glass">
                <div className="navbar-left">
                    <a className="logo" href="#/">ChordRadar</a>
                </div>

                <div className="navbar-center">

                </div>

                <div className="navbar-right">

                </div>


                <ul className="nav-item-list">
                    <li>
                        <NavItem
                            href="#/analyze"
                            label="Analyze"
                            icon={                                                    
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="nav-svg">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                            </svg>
                            }/>
                    </li>
                                        <li>
                                            <NavItem
                                                href="#/explore"
                                                label="Explore"
                                                icon={
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="nav-svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m1.6-5.15a6.75 6.75 0 1 1-13.5 0 6.75 6.75 0 0 1 13.5 0Z" />
                                                    </svg>
                                                }
                                            />
                                        </li>
                </ul>

                <ul className = "nav-item-list">

                                        <li>
                                            <button
                                                type="button"
                                                className="nav-auth-btn theme-toggle"
                                                aria-label={nextModeLabel}
                                                title={nextModeLabel}
                                                onClick={() => setTheme(isDarkMode ? "default-light" : "default-dark")}
                                            >
                                                <span className="nav-label">{nextModeLabel}</span>
                                                <span className="nav-icon" aria-hidden="true">
                                                    {isDarkMode ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="nav-svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1.5m0 15V21m8.25-9H21M3 12h1.5m13.864 6.364-1.06-1.06M6.697 6.697l-1.06-1.06m12.727 0-1.06 1.06M6.697 17.303l-1.06 1.06M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="nav-svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0 1 18 15.75 9.75 9.75 0 0 1 8.25 6a9.718 9.718 0 0 1 .748-3.752 9.75 9.75 0 1 0 12.754 12.754Z" />
                                                        </svg>
                                                    )}
                                                </span>
                                            </button>
                                        </li>
                                        <li>
                                            <NavItem
                                                href="#/"
                                                label="Settings"
                                                icon={
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="nav-svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0 0 14.99.392M4.5 12a7.5 7.5 0 0 1 14.99-.392M4.5 12H3m1.5 0h15m-15 0a7.5 7.5 0 0 1 .293-2.082M19.5 12a7.5 7.5 0 0 0-.293-2.082M6.23 6.23l1.06 1.06m9.42 9.42 1.06 1.06M6.23 17.77l1.06-1.06m9.42-9.42 1.06-1.06" />
                                                    </svg>
                                                }
                                            />
                                        </li>
                    {isAuthenticated ? (<></>) : (
                    <>
                                                <li>
                                                    <button type="button" className="nav-auth-btn" onClick={onOpenSignIn} aria-label="Sign in" title="Sign in">
                                                        <span className="nav-label">Sign in</span>
                                                        <span className="nav-icon" aria-hidden="true">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="nav-svg">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-7.5a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 6 21h7.5a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                                                            </svg>
                                                        </span>
                                                    </button>
                                                </li>
                                                <li>
                                                    <button type="button" className="nav-auth-btn" onClick={onOpenSignUp} aria-label="Sign up" title="Sign up">
                                                        <span className="nav-label">Sign up</span>
                                                        <span className="nav-icon" aria-hidden="true">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="nav-svg">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3M9 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.25 7.5a5.25 5.25 0 0 1 10.5 0v.75H3.75v-.75Z" />
                                                            </svg>
                                                        </span>
                                                    </button>
                                                </li>
                    </>
                    )}
                                        {isAuthenticated ? (
                                            <li>
                                                <NavItem
                                                    href="#/"
                                                    label="Sign out"
                                                    onClick={onLogout}
                                                    icon={
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="nav-svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-7.5a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 6 21h7.5a2.25 2.25 0 0 0 2.25-2.25V15m-3 0-3 3m0 0 3 3m-3-3h12" />
                                                        </svg>
                                                    }
                                                />
                                            </li>
                                        ) : null}
                </ul>
            </div>
            
        </nav>
        <button className="button glass navbar-collapse-button"
                onClick={() => setCollapsed((c) => !c)}
                aria-label="Toggle navigation"
                title={collapsed ? "Expand navbar" : "Collapse navbar"}>
                <span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                    </svg>
                </span>
        </button>
        </>
    );
}