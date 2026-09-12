import mascotLogo from "@/assets/images/mascot-logo.png";
import mascotWelcome from "@/assets/images/mascot-welcome.png";
import mascotAuth from "@/assets/images/mascot-auth.png";
import leavesLogo from "@/assets/images/leaves-logo.png";
import streakFire from "@/assets/images/streak-fire.png";
import earth from "@/assets/images/earth.png";
import palace from "@/assets/images/palace.png";
import treasure from "@/assets/images/treasure.png";
import icon from "@/assets/images/icon.png";
import splashIcon from "@/assets/images/splash-icon.png";
import favicon from "@/assets/images/favicon.png";
import tshirt from "@/assets/images/tshirt.png";

export const images = {
  mascotLogo,
  mascotWelcome,
  mascotAuth,
  leavesLogo,
  streakFire,
  earth,
  palace,
  treasure,
  icon,
  splashIcon,
  favicon,
  tshirt,
} as const;

export type ImageAssetKey = keyof typeof images;

export default images;
