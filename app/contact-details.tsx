
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PALETTE = {
    primary: "#1193d4",
    background: "#f6f7f8",
    card: "white",
    textPrimary: "#1f2937",
    textSecondary: "#4b5563",
    border: '#e5e7eb',
};

const ContactDetailsScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { contact: initialContact } = params;
    const [contactNumber, setContactNumber] = useState(initialContact as string || '+91 9876543210');

    const handleSave = () => {
        Alert.alert('Contact Details Saved', `Your new contact number is: ${contactNumber}`);
        router.push({ pathname: '/(tabs)/profile', params: { updatedContact: contactNumber } });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={PALETTE.textSecondary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Contact Details</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                    style={styles.input}
                    value={contactNumber}
                    onChangeText={setContactNumber}
                    keyboardType="phone-pad"
                    placeholder="Enter your phone number"
                />
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
                    <Text style={styles.primaryButtonText}>Save</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: PALETTE.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: PALETTE.border,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: PALETTE.textPrimary,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: PALETTE.textPrimary,
        marginBottom: 8,
    },
    input: {
        backgroundColor: PALETTE.card,
        padding: 16,
        borderRadius: 8,
        fontSize: 16,
        color: PALETTE.textPrimary,
        borderWidth: 1,
        borderColor: PALETTE.border,
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: PALETTE.border,
    },
    primaryButton: {
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: PALETTE.primary,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default ContactDetailsScreen;
