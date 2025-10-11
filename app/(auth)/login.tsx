
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';

const PALETTE = {
    primary: "#1193d4",
    backgroundLight: "#f6f7f8",
    textPrimary: "#1f2937",
    textSecondary: "#4b5563",
    border: '#e5e7eb',
    white: '#ffffff',
    danger: '#ef4444',
};

const LoginScreen = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Login Failed", "Please enter both email and password.");
            return;
        }

        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // The useAuth hook will handle the redirect automatically
            // No need for router.replace()
        } catch (error: any) {
            let errorMessage = "An unexpected error occurred.";
            // See: https://firebase.google.com/docs/auth/admin/errors
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = 'Please enter a valid email address.';
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    errorMessage = 'Invalid email or password. Please try again.';
                    break;
                default:
                    errorMessage = `Login failed. Please try again. (${error.code})`;
            }
            Alert.alert("Login Failed", errorMessage);
            console.error("Firebase login error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    {/* No back button on the main login screen */}
                </View>

                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="logo-ionic" size={64} color="white" />
                    </View>

                    <Text style={styles.title}>Welcome Back!</Text>
                    <Text style={styles.subtitle}>Login to your account to continue.</Text>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                        <TouchableOpacity style={styles.forgotPasswordContainer}>
                            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
                            {loading ? (
                                <ActivityIndicator color={PALETTE.white} />
                            ) : (
                                <Text style={styles.loginButtonText}>Login</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
                
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Don't have an account? </Text>
                    <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                         <Text style={styles.signupText}>Sign Up</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: PALETTE.backgroundLight,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'space-between',
    },
    header: {
        padding: 16,
        alignSelf: 'flex-start',
        height: 50, // Added to prevent content from jumping
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    iconContainer: {
        width: 96,
        height: 96,
        backgroundColor: PALETTE.primary,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: PALETTE.textPrimary,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: PALETTE.textSecondary,
        marginBottom: 32,
        textAlign: 'center',
        maxWidth: 300,
    },
    inputContainer: {
        width: '100%',
        maxWidth: 384,
        gap: 16,
    },
    input: {
        backgroundColor: PALETTE.white,
        borderWidth: 1,
        borderColor: PALETTE.border,
        color: PALETTE.textPrimary,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        fontSize: 16,
    },
    forgotPasswordContainer: {
        alignSelf: 'flex-end',
    },
    forgotPasswordText: {
        fontSize: 14,
        color: PALETTE.primary,
    },
    loginButton: {
        backgroundColor: PALETTE.primary,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginTop: 8, 
    },
    loginButtonText: {
        color: PALETTE.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    footerText: {
        color: PALETTE.textSecondary,
        fontSize: 14,
    },
    signupText: {
        color: PALETTE.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default LoginScreen;
