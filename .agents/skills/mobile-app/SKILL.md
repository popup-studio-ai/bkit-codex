---
name: mobile-app
description: |
  Mobile application development guide for React Native, Expo, and Flutter.
  Covers iOS and Android cross-platform development patterns.
  Triggers: mobile app, React Native, Flutter, Expo, iOS, Android, cross-platform,
  모바일 앱, 리액트 네이티브, 앱 개발, モバイルアプリ, アプリ開発,
  移动应用, 手机应用, aplicacion movil, application mobile, mobile App, app mobile
  Do NOT use for: desktop apps (use $desktop-app), web apps (use $dynamic or $starter).
---

# Mobile App Skill

> Cross-platform mobile development with React Native or Flutter.

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `init` | Initialize mobile project | `$mobile-app init my-app` |
| `guide` | Mobile dev guide | `$mobile-app guide` |
| `help` | Platform-specific help | `$mobile-app help ios` |

## Framework Comparison

| Feature | React Native (Expo) | Flutter |
|---------|-------------------|---------|
| Language | TypeScript/JavaScript | Dart |
| UI | Native components | Custom rendering |
| Hot Reload | Yes | Yes |
| Web Support | Expo Web | Flutter Web |
| Package Manager | npm/yarn | pub |
| Best For | JS/TS teams, rapid MVP | Custom UI, high performance |

## Recommended: Expo (React Native)

For bkit-codex users, Expo is recommended because:
- Shares skills with web development (TypeScript, React)
- Integrates with bkend.ai BaaS
- Faster development cycle
- No native build setup needed initially

## Project Structure (Expo)

```
mobile-app/
├── app/                       # Expo Router (file-based routing)
│   ├── (tabs)/               # Tab navigation
│   │   ├── index.tsx         # Home tab
│   │   ├── explore.tsx       # Explore tab
│   │   └── profile.tsx       # Profile tab
│   ├── (auth)/               # Auth screens
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── _layout.tsx           # Root layout
│   └── +not-found.tsx        # 404 screen
├── components/                # Reusable components
│   ├── ui/                   # Basic UI components
│   └── features/             # Feature components
├── hooks/                     # Custom hooks
│   ├── useAuth.ts
│   └── useColorScheme.ts
├── lib/                       # Utilities
│   ├── api-client.ts         # API client
│   └── storage.ts            # AsyncStorage wrapper
├── stores/                    # State management
│   └── auth-store.ts
├── constants/                 # App constants
│   ├── Colors.ts
│   └── Layout.ts
├── assets/                    # Images, fonts
├── app.json                   # Expo config
├── package.json
└── tsconfig.json
```

## Core Patterns

### Navigation (Expo Router)

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
  );
}

// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Home, Search, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({color}) => <Home color={color} /> }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: ({color}) => <Search color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({color}) => <User color={color} /> }} />
    </Tabs>
  );
}
```

### Secure Storage

```typescript
// lib/storage.ts
import * as SecureStore from 'expo-secure-store';

export const storage = {
  async getToken(): Promise<string | null> {
    return SecureStore.getItemAsync('access_token');
  },
  async setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync('access_token', token);
  },
  async removeToken(): Promise<void> {
    await SecureStore.deleteItemAsync('access_token');
  },
};
```

### Platform-Specific Code

```typescript
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 4 },
    }),
  },
});
```

## Pipeline Integration

Mobile apps follow the same 9-phase pipeline with mobile-specific considerations:
- Phase 3: Include mobile wireframes (320px, 375px, 414px widths)
- Phase 5: Use React Native component patterns
- Phase 6: Handle offline state and connectivity
- Phase 9: App Store / Play Store submission

## Build & Distribution

```bash
# Development
npx expo start

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

## Common Mistakes

| Mistake | Solution |
|---------|----------|
| Ignoring platform differences | Test on both iOS and Android |
| Large bundle size | Use lazy loading and code splitting |
| No offline handling | Implement offline-first data layer |
| Hardcoded dimensions | Use responsive sizing (Dimensions API) |
| Missing permissions | Request permissions gracefully |
