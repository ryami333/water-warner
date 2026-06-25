import { nativeImage } from "electron/common";
import seedling from "../../seedling.png?inline";

export const seedlingIcon = nativeImage.createFromDataURL(seedling).resize({
  height: 16,
  width: 16,
});
