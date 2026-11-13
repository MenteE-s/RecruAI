import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "../ui/Avatar";
import SignOutButton from "../ui/SignOutButton";
import { getCurrentUser, getUploadUrl } from "../../utils/auth";
import { cn } from "../../lib/cn";

function profileLinkForUser(user) {
  if (!user) return "/in/profile";
  if (user.role === "organization") {
    return user.organization_slug ? `/org/${user.organization_slug}` : "/org/jobs";
  }
  return "/in/profile";
}

export default function SignedInAccountBar({ className, compact = false, onSignedOut }) {
  const [user, setUser] = useState(null);
  const [isAuth, setIsAuth] = useState(
    typeof window !== "undefined" && localStorage.getItem("isAuthenticated") === "true"
  );

  useEffect(() => {
    let mounted = true;
    if (!isAuth) return undefined;
    (async () => {
      try {
        const u = await getCurrentUser();
        if (!mounted) return;
        if (u) {
          setUser(u);
          setIsAuth(true);
        } else {
          setIsAuth(false);
        }
      } catch {
        if (!mounted) return;
        setIsAuth(localStorage.getItem("isAuthenticated") === "true");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isAuth]);

  if (!isAuth) return null;

  const name = user?.name || user?.email || "Account";
  const to = profileLinkForUser(user);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Link
        to={to}
        className="flex min-w-0 items-center gap-2 rounded-xl border border-line bg-surface/80 px-2 py-1 text-xs text-ink shadow-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        title={`View profile: ${name}`}
        aria-label={`Account: ${name}`}
      >
        {user?.profile_picture ? (
          <img
            src={getUploadUrl(user.profile_picture)}
            alt={name}
            width={24}
            height={24}
            className="h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-line"
          />
        ) : (
          <Avatar name={name} size="sm" />
        )}
        <span className={cn("truncate font-medium text-ink", compact ? "hidden max-w-[96px] sm:inline" : "max-w-[180px]")}>{name}</span>
      </Link>
      <SignOutButton
        variant="solid"
        className="rounded-xl !px-2.5 !py-1 text-xs"
        onSignedOut={() => {
          setIsAuth(false);
          setUser(null);
          if (onSignedOut) onSignedOut();
        }}
      />
    </div>
  );
}
