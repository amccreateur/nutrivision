import { TurboModuleRegistry } from 'react-native';

// Polyfill sécurisé pour l'environnement Expo Go (où les TurboModules personnalisés sont absents)
try {
  const registry = TurboModuleRegistry as any;
  if (registry && typeof registry.getEnforcing === 'function') {
    const originalGetEnforcing = registry.getEnforcing.bind(registry);
    registry.getEnforcing = (name: string) => {
      const mod = registry.get(name);
      if (mod) return mod;
      if (
        name === 'RNGoogleMobileAdsModule' ||
        name === 'RNGoogleMobileAds' ||
        name === 'RNPurchases'
      ) {
        return new Proxy(
          {},
          {
            get: (_target, prop) => {
              if (prop === 'addListener' || prop === 'removeListeners') {
                return () => {};
              }
              return () => Promise.resolve({});
            },
          }
        );
      }
      return originalGetEnforcing(name);
    };
  }
} catch {
  // Ignore
}

import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
