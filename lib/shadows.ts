import { Platform, ViewStyle } from 'react-native';

type ShadowStyle = Pick<ViewStyle, 'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'> & {
  boxShadow?: string;
};

export function createShadow(
  color: string,
  offsetX: number,
  offsetY: number,
  opacity: number,
  radius: number,
  elevation: number = 2
): ShadowStyle {
  if (Platform.OS === 'web') {
    const r = parseInt(color.slice(1, 3) || '0', 16) || 0;
    const g = parseInt(color.slice(3, 5) || '0', 16) || 0;
    const b = parseInt(color.slice(5, 7) || '0', 16) || 0;
    return {
      boxShadow: `${offsetX}px ${offsetY}px ${radius}px rgba(${r}, ${g}, ${b}, ${opacity})`,
    };
  }

  return {
    shadowColor: color,
    shadowOffset: { width: offsetX, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation,
  };
}

export const cardShadow = createShadow('#000000', 0, 2, 0.08, 6, 2);
export const elevatedShadow = createShadow('#000000', 0, 4, 0.15, 12, 8);
export const subtleShadow = createShadow('#000000', 0, 1, 0.05, 4, 1);
