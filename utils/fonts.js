import { useFonts } from "expo-font";

export const useCustomFonts = () => {
  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("@/assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Medium": require("@/assets/fonts/Poppins-Medium.ttf"),
    "Poppins-Bold": require("@/assets/fonts/Poppins-Bold.ttf"),
    "Poppins-Light": require("@/assets/fonts/Poppins-Light.ttf"),
    "Poppins-Thin": require("@/assets/fonts/Poppins-Thin.ttf"),
  });
  return fontsLoaded;
};
