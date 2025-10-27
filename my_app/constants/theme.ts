/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#E50914'; // Rojo Netflix para light mode
const tintColorDark = '#E50914';  // Rojo Netflix para dark mode

export const Colors = {
  light: {
    text: '#FFFFFF',
    background: '#141414',
    tint: tintColorLight,
    icon: '#B3B3B3',
    tabIconDefault: '#B3B3B3',
    tabIconSelected: tintColorLight,
    tabBarBackground: '#141414',
    tabBarBorder: '#333333',
  },
  dark: {
    text: '#FFFFFF',
    background: '#141414',
    tint: tintColorDark,
    icon: '#B3B3B3',
    tabIconDefault: '#B3B3B3',
    tabIconSelected: tintColorDark,
    tabBarBackground: '#141414',
    tabBarBorder: '#333333',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});