import { TEAM_LOGO_URL, HOME_TEAM_MATCHUP_NAME } from "@/lib/team";
import { flagEmoji } from "@/lib/flags";
import { cn } from "@/lib/utils";

export function TeamSide({
  showHomeTeam,
  opponent,
  opponentCountryCode,
  className,
}: {
  showHomeTeam: boolean;
  opponent: string;
  opponentCountryCode: string | null;
  className?: string;
}) {
  if (showHomeTeam) {
    return (
      <span className={cn("flex items-center gap-2", className)}>
        <img src={TEAM_LOGO_URL} alt="" className="h-6 w-6 rounded-full object-cover" />
        {HOME_TEAM_MATCHUP_NAME}
      </span>
    );
  }
  return (
    <span className={cn("flex items-center gap-2", className)}>
      {flagEmoji(opponentCountryCode)} {opponent}
    </span>
  );
}
