
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserProps extends React.HTMLAttributes<HTMLDivElement> {
  user: {
    name?: string;
    email?: string;
    imageUrl?: string;
  };
  description?: string;
  showEmail?: boolean;
}

export function User({ user, description, showEmail = true, className, ...props }: UserProps) {
  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div
      className={cn("flex items-center gap-2 overflow-hidden", className)}
      {...props}
    >
      <Avatar className="h-10 w-10 border border-nytrix-purple/20">
        <AvatarImage src={user.imageUrl} />
        <AvatarFallback className="bg-nytrix-purple/10 text-nytrix-purple">
          {getInitials(user.name || "Usuario")}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col overflow-hidden">
        <span className="truncate font-medium">{user.name || "Usuario"}</span>
        {showEmail && (user.email || description) && (
          <span className="truncate text-sm text-muted-foreground">
            {description || user.email}
          </span>
        )}
      </div>
    </div>
  );
}
