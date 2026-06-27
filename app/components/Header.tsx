import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
    return (
      <header className="bg-surface/90 border-b border-border shadow-sm backdrop-blur">
        <nav className="max-w-screen-xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="font-bold text-foreground">My Portfolio</h1>
  
          <div className="flex items-center gap-6 text-sm font-medium text-gray-700 dark:text-gray-200">
            <Link className="hover:text-blue-600 dark:hover:text-blue-400" href="/">Home</Link>
            <Link className="hover:text-blue-600 dark:hover:text-blue-400" href="/aboutme">About</Link>
            <Link className="hover:text-blue-600 dark:hover:text-blue-400" href="/project">Project</Link>
            <Link className="hover:text-blue-600 dark:hover:text-blue-400" href="/chat">Chat</Link>
            <ThemeToggle />
          </div>
        </nav>
      </header>
    );
  }
