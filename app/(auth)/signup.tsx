
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase'; // Adjust path if needed

const PALETTE = {
    primary: "#1193d4",
    backgroundLight: "#f6f7f8",
    textPrimary: "#1f2937",
    textSecondary: "#4b5563",
    border: '#e5e7eb',
    white: '#ffffff',
    danger: '#ef4444',
};

const SignUpScreen = () => {
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState('');

    const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
        setter(value);
        if (formError) {
            setFormError('');
        }
    };

    const handleSignUp = async () => {
        if (loading) return;
        setFormError('');

        if (!fullName || !email || !password || !confirmPassword) {
            setFormError("Please fill out all fields.");
            return;
        }
        if (password !== confirmPassword) {
            setFormError("Passwords don't match.");
            return;
        }
        if (password.length < 6) {
            setFormError("Password must be at least 6 characters long.");
            return;
        }
        if (!termsAccepted) {
            setFormError("You must accept the terms and conditions.");
            return;
        }

        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                fullName: fullName,
                email: email,
                createdAt: new Date(),
            });

            console.log("User signed up and data stored in Firestore!");
            router.replace('/(tabs)/');

        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                setFormError('This email address is already registered.');
            } else if (error.code === 'auth/invalid-email') {
                setFormError('Please enter a valid email address.');
            } else {
                setFormError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={PALETTE.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="person-add-outline" size={40} color="white" />
                    </View>

                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Let's get you started!</Text>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Full Name"
                            value={fullName}
                            onChangeText={(val) => handleInputChange(setFullName, val)}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            value={email}
                            onChangeText={(val) => handleInputChange(setEmail, val)}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            value={password}
                            onChangeText={(val) => handleInputChange(setPassword, val)}
                            secureTextEntry
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChangeText={(val) => handleInputChange(setConfirmPassword, val)}
                            secureTextEntry
                        />
                        
                        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

                        <View style={styles.termsContainer}>
                            <Switch
                                value={termsAccepted}
                                onValueChange={setTermsAccepted}
                                trackColor={{ false: PALETTE.border, true: PALETTE.primary }}
                                thumbColor={PALETTE.white}
                            />
                            <Text style={styles.termsText}>
                                I agree to the <Text style={styles.linkText}>Terms & Conditions</Text>
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.signupButton} onPress={handleSignUp} disabled={loading}>
                            <Text style={styles.signupButtonText}>{loading ? 'Creating Account...' : 'Sign Up'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                         <Text style={styles.linkText}>Log In</Text>
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
    },
    header: {
        padding: 16,
        alignSelf: 'flex-start',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    iconContainer: {
        width: 64,
        height: 64,
        backgroundColor: PALETTE.primary,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: PALETTE.textPrimary,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: PALETTE.textSecondary,
        marginBottom: 32,
        textAlign: 'center',
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
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
    },
    termsText: {
        flex: 1,
        fontSize: 14,
        color: PALETTE.textSecondary,
    },
    linkText: {
        color: PALETTE.primary,
        fontWeight: '500',
    },
    errorText: {
        color: PALETTE.danger,
        textAlign: 'center',
        fontSize: 14,
        marginBottom: 10,
    },
    signupButton: {
        backgroundColor: PALETTE.primary,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    signupButtonText: {
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
});

export default SignUpScreen;
