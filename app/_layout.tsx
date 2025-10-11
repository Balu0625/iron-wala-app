
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';

function RootLayoutNav() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        if (loading || segments.length === 0) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (user && inAuthGroup) {
            router.replace('/(tabs)');
        } else if (!user && !inAuthGroup) {
            router.replace('/(auth)/login');
        }
    }, [user, loading, segments, router]);

    return (
        <>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <Image 
                        source={require('../assets/images/loading.gif')} 
                        style={styles.loadingImage}
                    />
                </View>
            ) : (
                <Stack>
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                </Stack>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    loadingImage: {
        width: 200,
        height: 200,
        resizeMode: 'contain',
    },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <RootLayoutNav />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
