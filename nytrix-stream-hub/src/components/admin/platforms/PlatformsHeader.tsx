
import { HeaderTitle } from "./header/HeaderTitle";
import { CreatePlatformButton } from "./header/CreatePlatformButton";

interface PlatformsHeaderProps {
  onPlatformCreated: () => void;
  userId?: number | null;
}

export const PlatformsHeader = ({ onPlatformCreated, userId }: PlatformsHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <HeaderTitle />
      <CreatePlatformButton onPlatformCreated={onPlatformCreated} userId={userId} />
    </div>
  );
};
