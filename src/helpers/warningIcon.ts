import { nativeImage } from "electron/common";
import notification from "../../seedling--notification.png?inline";

export const warningIcon = nativeImage.createFromDataURL(notification).resize({
  height: 16,
  width: 16,
});
