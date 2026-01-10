# Tribal Mingle - Global Reusable Components & Design System

**Version:** 1.0  
**Last Updated:** January 3, 2026  
**Audience:** Mobile UI/UX Developers  
**Platform:** React Native (iOS & Android)

---

## 📋 Overview

This document defines the **global, reusable UI components** and **universal design standards** that MUST be used consistently across ALL screens in the Tribal Mingle mobile app - both current and future implementations.

### Key Principles

1. **Consistency First**: Every screen uses the same header, background, and navigation
2. **Royal Heritage Branding**: Purple gradient theme with gold accents throughout
3. **Component Reusability**: Build once, use everywhere
4. **Future-Proof**: All new screens inherit these standards automatically

---

## 🔐 Payment System Configuration

### Stripe Integration (Global Payments)

**Status**: ✅ **Configured and Active**

Your payment system now supports global transactions with:
- ✅ **Test keys configured** for development
- ✅ **Multi-currency support** (135+ currencies)
- ✅ **Regional payment methods** automatically enabled
- ✅ **Apple Pay & Google Pay** configured (test mode)

**Documentation**:
- 📖 [Complete Setup Guide](STRIPE_SETUP_GUIDE.md)
- ⚡ [Quick Reference](STRIPE_QUICK_REFERENCE.md)
- 📋 [Configuration Summary](STRIPE_CONFIGURATION_SUMMARY.md)

**Supported Regions**:
- Americas: USA, Canada, Mexico, Brazil
- Europe: All EU countries, UK, Switzerland
- Africa: South Africa, Kenya, Ghana (international cards)
- Nigeria: Use Paystack (Stripe not available)
- Asia-Pacific: Australia, Singapore, Japan, India

**Payment Methods**:
- Credit/Debit cards (Visa, Mastercard, Amex)
- Apple Pay (domain verification needed for production)
- Google Pay (merchant ID needed for production)
- Regional methods (SEPA, iDEAL, ACH, etc.)

---

## 🎨 Brand Color System

### Color Palette

#### Primary Brand Colors

**Purple (Royal Heritage)**
```typescript
const COLORS = {
  purple: {
    main: '#5B2E91',      // Primary brand color - buttons, accents
    light: '#7B4FB8',     // Hover states, lighter elements
    dark: '#3D1E61',      // Active states, pressed buttons
  },
  gold: {
    main: '#D4AF37',      // CTAs, highlights, premium features
    light: '#E6C968',     // Hover states
    dark: '#B8951E',      // Active states, pressed buttons
  },
}
```

#### Background Colors (Dark Theme)

```typescript
const BACKGROUNDS = {
  primary: '#0A0A0A',     // Main app background (deep black)
  secondary: '#1A1A1A',   // Cards, sections, elevated containers
  tertiary: '#2A2A2A',    // Highly elevated elements, modals
}
```

#### Text Colors

```typescript
const TEXT_COLORS = {
  primary: '#F5F5DC',     // Warm white - headings, important text
  secondary: '#B0B0B0',   // Light gray - body text, descriptions
  tertiary: '#8B7355',    // Brown/tan - muted text, timestamps
}
```

#### Effect Colors

```typescript
const EFFECTS = {
  glowGold: 'rgba(212, 175, 55, 0.4)',
  glowGoldStrong: 'rgba(212, 175, 55, 0.6)',
  borderGold: 'rgba(212, 175, 55, 0.2)',
  borderGoldHover: 'rgba(212, 175, 55, 0.4)',
}
```

#### Gradients

```typescript
const GRADIENTS = {
  hero: {
    colors: ['#0A0A0A', '#1a0a2e'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  purple: {
    colors: ['#5B2E91', '#3D1E61'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  gold: {
    colors: ['#D4AF37', '#B8951E'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  royal: {
    colors: ['#0A0A0A', '#5B2E91', '#D4AF37'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    locations: [0, 0.5, 1],
  },
}
```

### Usage in React Native

```typescript
// colors/theme.ts
export const theme = {
  colors: {
    purple: {
      main: '#5B2E91',
      light: '#7B4FB8',
      dark: '#3D1E61',
    },
    gold: {
      main: '#D4AF37',
      light: '#E6C968',
      dark: '#B8951E',
    },
    background: {
      primary: '#0A0A0A',
      secondary: '#1A1A1A',
      tertiary: '#2A2A2A',
    },
    text: {
      primary: '#F5F5DC',
      secondary: '#B0B0B0',
      tertiary: '#8B7355',
    },
  },
}
```

---

## 🔝 Universal Header Component

### Requirements

The **Universal Header** MUST be used on **ALL screens** (except splash/onboarding).

### Design Specifications

```typescript
// components/UniversalHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface UniversalHeaderProps {
  title?: string;
  showBackButton?: boolean;
  showNotificationBadge?: boolean;
  notificationCount?: number;
  onBackPress?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  rightAction?: React.ReactNode; // Custom right-side action
}

export const UniversalHeader: React.FC<UniversalHeaderProps> = ({
  title = 'Tribal Mingle',
  showBackButton = false,
  showNotificationBadge = true,
  notificationCount = 0,
  onBackPress,
  onNotificationPress,
  onProfilePress,
  rightAction,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <LinearGradient
        colors={['#0A0A0A', '#1a0a2e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        {/* Left Side - Back Button or Logo */}
        <View style={styles.leftSection}>
          {showBackButton ? (
            <TouchableOpacity 
              onPress={onBackPress}
              style={styles.iconButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="arrow-left" size={24} color="#F5F5DC" />
            </TouchableOpacity>
          ) : (
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>TM</Text>
            </View>
          )}
        </View>

        {/* Center - Title */}
        <View style={styles.centerSection}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {/* Right Side - Actions */}
        <View style={styles.rightSection}>
          {rightAction ? (
            rightAction
          ) : (
            <>
              {/* Search Icon */}
              <TouchableOpacity 
                onPress={() => {/* Navigate to search */}}
                style={styles.iconButton}
              >
                <Icon name="search" size={22} color="#F5F5DC" />
              </TouchableOpacity>

              {/* Notification Icon with Badge */}
              {showNotificationBadge && (
                <TouchableOpacity 
                  onPress={onNotificationPress}
                  style={styles.iconButton}
                >
                  <Icon name="bell" size={22} color="#F5F5DC" />
                  {notificationCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}

              {/* Profile Icon */}
              <TouchableOpacity 
                onPress={onProfilePress}
                style={styles.profileButton}
              >
                <View style={styles.profileIconPlaceholder}>
                  <Icon name="user" size={18} color="#5B2E91" />
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5B2E91',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  logo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D4AF37',
    letterSpacing: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F5F5DC',
    letterSpacing: 0.5,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  profileButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIconPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#0A0A0A',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
```

### Usage Examples

```typescript
// On most screens
<UniversalHeader 
  title="Discover"
  notificationCount={3}
  onNotificationPress={() => navigation.navigate('Notifications')}
  onProfilePress={() => navigation.navigate('Profile')}
/>

// On detail screens with back button
<UniversalHeader 
  title="Profile Details"
  showBackButton
  onBackPress={() => navigation.goBack()}
  notificationCount={3}
/>

// With custom right action
<UniversalHeader 
  title="Settings"
  showBackButton
  onBackPress={() => navigation.goBack()}
  rightAction={
    <TouchableOpacity onPress={handleSave}>
      <Text style={{ color: '#D4AF37' }}>Save</Text>
    </TouchableOpacity>
  }
/>
```

---

## 🎨 Universal Background Component

### Requirements

The **Universal Background** MUST be applied to **ALL screens** as the base layer.

### Implementation

```typescript
// components/UniversalBackground.tsx
import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface UniversalBackgroundProps {
  children: React.ReactNode;
  scrollable?: boolean;
  useGradient?: boolean; // Use gradient or solid color
}

export const UniversalBackground: React.FC<UniversalBackgroundProps> = ({
  children,
  scrollable = false,
  useGradient = true,
}) => {
  const Container = scrollable ? ScrollView : View;

  if (useGradient) {
    return (
      <LinearGradient
        colors={['#0A0A0A', '#1a0a2e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <Container 
            style={styles.container}
            contentContainerStyle={scrollable ? styles.scrollContent : undefined}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </Container>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.solidBackground}>
      <SafeAreaView style={styles.safeArea}>
        <Container 
          style={styles.container}
          contentContainerStyle={scrollable ? styles.scrollContent : undefined}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </Container>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  solidBackground: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20, // Add padding for bottom nav
  },
});
```

### Usage Examples

```typescript
// Standard screen
<UniversalBackground>
  <UniversalHeader title="Home" />
  <View style={{ padding: 16 }}>
    {/* Screen content */}
  </View>
</UniversalBackground>

// Scrollable content
<UniversalBackground scrollable>
  <UniversalHeader title="Profile" showBackButton />
  <View style={{ padding: 16 }}>
    {/* Long content that scrolls */}
  </View>
</UniversalBackground>

// Solid background (no gradient)
<UniversalBackground useGradient={false}>
  <UniversalHeader title="Chat" />
  {/* Chat messages */}
</UniversalBackground>
```

---

## 🔽 Universal Bottom Navigation

### Requirements

The **Bottom Navigation** MUST be present on **ALL main screens** (Home, Discover, Matches, Likes, Chat).

### Design Specifications

```typescript
// components/UniversalBottomNav.tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  activeIcon?: string;
  badge?: number;
}

interface UniversalBottomNavProps {
  activeRoute: string;
  onNavigate: (routeId: string) => void;
  totalUnreadCount?: number; // For global badge
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: 'home', activeIcon: 'home' },
  { id: 'discover', label: 'Discover', icon: 'compass', activeIcon: 'compass' },
  { id: 'matches', label: 'Matches', icon: 'heart', activeIcon: 'heart' },
  { id: 'likes', label: 'Likes', icon: 'star', activeIcon: 'star' },
  { id: 'chat', label: 'Chat', icon: 'message-circle', activeIcon: 'message-circle' },
];

export const UniversalBottomNav: React.FC<UniversalBottomNavProps> = ({
  activeRoute,
  onNavigate,
  totalUnreadCount = 0,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={['#1A1A1A', '#0A0A0A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[
        styles.container,
        {
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          borderTopColor: 'rgba(212, 175, 55, 0.2)',
        },
      ]}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = activeRoute === item.id;
        const showBadge = item.id === 'chat' && totalUnreadCount > 0;

        return (
          <TouchableOpacity
            key={item.id}
            style={styles.navItem}
            onPress={() => onNavigate(item.id)}
            activeOpacity={0.7}
          >
            {/* Icon Container */}
            <View style={styles.iconContainer}>
              {isActive && (
                <View style={styles.activeIndicator} />
              )}
              <Icon
                name={isActive ? item.activeIcon || item.icon : item.icon}
                size={24}
                color={isActive ? '#D4AF37' : '#B0B0B0'}
                style={styles.icon}
              />
              
              {/* Badge */}
              {showBadge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </Text>
                </View>
              )}
            </View>

            {/* Label */}
            <Text
              style={[
                styles.label,
                isActive && styles.labelActive,
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  iconContainer: {
    position: 'relative',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    // Icon styles
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 32,
    height: 3,
    backgroundColor: '#D4AF37',
    borderRadius: 2,
  },
  label: {
    fontSize: 11,
    color: '#B0B0B0',
    marginTop: 4,
    fontWeight: '500',
  },
  labelActive: {
    color: '#D4AF37',
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#0A0A0A',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
```

### Integration with Navigation

```typescript
// navigation/MainNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { UniversalBottomNav } from '../components/UniversalBottomNav';
import { usePollingManager } from '../hooks/usePollingManager';

const Tab = createBottomTabNavigator();

export const MainNavigator = () => {
  const { totalUnreadCount } = usePollingManager();

  return (
    <Tab.Navigator
      tabBar={(props) => (
        <UniversalBottomNav
          activeRoute={props.state.routes[props.state.index].name}
          onNavigate={(routeId) => {
            const route = props.state.routes.find(r => r.name === routeId);
            if (route) {
              props.navigation.navigate(route.name);
            }
          }}
          totalUnreadCount={totalUnreadCount}
        />
      )}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="home" component={HomeScreen} />
      <Tab.Screen name="discover" component={DiscoverScreen} />
      <Tab.Screen name="matches" component={MatchesScreen} />
      <Tab.Screen name="likes" component={LikesScreen} />
      <Tab.Screen name="chat" component={ChatScreen} />
    </Tab.Navigator>
  );
};
```

---

## 📐 Screen Layout Template

### Standard Screen Structure

**EVERY screen MUST follow this structure:**

```typescript
// screens/ExampleScreen.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { UniversalBackground } from '../components/UniversalBackground';
import { UniversalHeader } from '../components/UniversalHeader';

export const ExampleScreen = ({ navigation }) => {
  return (
    <UniversalBackground scrollable>
      <UniversalHeader
        title="Example Screen"
        showBackButton
        onBackPress={() => navigation.goBack()}
        notificationCount={5}
        onNotificationPress={() => navigation.navigate('Notifications')}
      />
      
      <View style={styles.content}>
        {/* Screen-specific content goes here */}
      </View>
    </UniversalBackground>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 16,
  },
});
```

### Main Tab Screen Structure

```typescript
// screens/HomeScreen.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { UniversalBackground } from '../components/UniversalBackground';
import { UniversalHeader } from '../components/UniversalHeader';
// Bottom nav is automatically rendered by MainNavigator

export const HomeScreen = ({ navigation }) => {
  return (
    <UniversalBackground scrollable>
      <UniversalHeader
        title="Home"
        notificationCount={3}
        onNotificationPress={() => navigation.navigate('Notifications')}
        onProfilePress={() => navigation.navigate('Profile')}
      />
      
      <View style={styles.content}>
        {/* Home content */}
      </View>
      
      {/* Bottom nav space - add padding to avoid overlap */}
      <View style={styles.bottomPadding} />
    </UniversalBackground>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 16,
  },
  bottomPadding: {
    height: 80, // Account for bottom nav height
  },
});
```

---

## 🧩 Additional Reusable Components

### Card Component (Purple Gradient)

```typescript
// components/PurpleCard.tsx
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface PurpleCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
}

export const PurpleCard: React.FC<PurpleCardProps> = ({
  children,
  style,
  elevated = true,
}) => {
  return (
    <LinearGradient
      colors={['#5B2E91', '#3D1E61']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.card,
        elevated && styles.elevated,
        style,
      ]}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  elevated: {
    shadowColor: '#5B2E91',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
```

### Gold Button Component

```typescript
// components/GoldButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GoldButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  variant?: 'primary' | 'secondary';
}

export const GoldButton: React.FC<GoldButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
  variant = 'primary',
}) => {
  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[styles.button, styles.secondaryButton, disabled && styles.disabled, style]}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#D4AF37" />
        ) : (
          <Text style={styles.secondaryButtonText}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.button, disabled && styles.disabled, style]}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#D4AF37', '#B8951E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color="#0A0A0A" />
        ) : (
          <Text style={styles.buttonText}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 48,
  },
  gradient: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A0A0A',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#D4AF37',
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4AF37',
    letterSpacing: 0.5,
  },
  disabled: {
    opacity: 0.5,
  },
});
```

---

## 📱 Implementation Checklist

### For Every New Screen:

- [ ] Wrap entire screen in `<UniversalBackground>`
- [ ] Add `<UniversalHeader>` at the top
- [ ] Use brand colors from theme constants
- [ ] Account for bottom navigation spacing (80px padding)
- [ ] Test on both iOS and Android
- [ ] Test with notched devices (iPhone X+)
- [ ] Verify safe area insets work correctly

### For Existing Screens:

- [ ] Audit all screens for consistency
- [ ] Replace custom headers with `<UniversalHeader>`
- [ ] Replace custom backgrounds with `<UniversalBackground>`
- [ ] Ensure bottom nav doesn't overlap content
- [ ] Update color variables to use theme constants

---

## 🎯 Key Rules

### DO ✅

1. **Always use `<UniversalBackground>` as the outermost wrapper**
2. **Always include `<UniversalHeader>` on every screen (except onboarding)**
3. **Use the exact hex color values provided** - no variations
4. **Test on real devices** - simulators can hide issues
5. **Use LinearGradient for purple elements** - it's a core brand element
6. **Maintain 16px padding** as the standard content spacing
7. **Use theme.colors constants** - never hardcode colors

### DON'T ❌

1. **Don't create custom headers** - use UniversalHeader with props
2. **Don't use different background colors** - only #0A0A0A or gradient
3. **Don't modify the color values** - they're precisely calibrated
4. **Don't hide the bottom navigation** on main screens
5. **Don't use white backgrounds** - the app is dark-themed
6. **Don't forget safe area insets** - notches exist
7. **Don't use random gradient angles** - stick to 135deg

---

## 🚀 Quick Start Implementation

### Step 1: Create Theme File

```typescript
// constants/theme.ts
export const theme = {
  colors: {
    purple: {
      main: '#5B2E91',
      light: '#7B4FB8',
      dark: '#3D1E61',
    },
    gold: {
      main: '#D4AF37',
      light: '#E6C968',
      dark: '#B8951E',
    },
    background: {
      primary: '#0A0A0A',
      secondary: '#1A1A1A',
      tertiary: '#2A2A2A',
    },
    text: {
      primary: '#F5F5DC',
      secondary: '#B0B0B0',
      tertiary: '#8B7355',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
};
```

### Step 2: Install Dependencies

```bash
npm install expo-linear-gradient react-native-safe-area-context react-native-vector-icons
```

### Step 3: Create Components

Create the three universal components:
1. `components/UniversalBackground.tsx`
2. `components/UniversalHeader.tsx`
3. `components/UniversalBottomNav.tsx`

### Step 4: Update All Screens

Replace existing layouts with the universal template.

---

## 📞 Support

For questions or clarifications about the design system:
- **Email:** profmendel@gmail.com
- **Subject Line:** `[Mobile UI] Design System Question`

---

**Remember:** Consistency is key to a professional, polished app. Every screen should feel like part of the same family using these universal components and colors.

🎨 **Royal Purple. Warm Gold. Premium Experience.**
