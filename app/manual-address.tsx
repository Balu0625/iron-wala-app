
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PALETTE = {
    primary: "#1193d4",
    background: "#f6f7f8",
    card: "white",
    textPrimary: "#1f2937",
    textSecondary: "#4b5563",
};

const ManualAddressScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const addressType = params.addressType || 'pickup';

    const [street, setStreet] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [zip, setZip] = useState('');

    const handleSaveAddress = () => {
        if (!street || !city || !state || !zip) {
            Alert.alert('Incomplete Address', 'Please fill out all fields.');
            return;
        }
        const fullAddress = `${street}, ${city}, ${state} ${zip}`;
        router.push({
            pathname: '/order-confirmation',
            params: {
                ...params,
                manualAddress: fullAddress,
                addressType,
            },
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={PALETTE.textSecondary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Address Manually</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.form}>
                <TextInput
                    style={styles.input}
                    placeholder="Street Address"
                    value={street}
                    onChangeText={setStreet}
                />
                <TextInput
                    style={styles.input}
                    placeholder="City"
                    value={city}
                    onChangeText={setCity}
                />
                <TextInput
                    style={styles.input}
                    placeholder="State"
                    value={state}
                    onChangeText={setState}
                />
                <TextInput
                    style={styles.input}
                    placeholder="ZIP Code"
                    value={zip}
                    onChangeText={setZip}
                    keyboardType="numeric"
                />
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.primaryButton} onPress={handleSaveAddress}>
                    <Text style={styles.primaryButtonText}>Save Address</Text>
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
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: PALETTE.textPrimary,
    },
    form: {
        padding: 16,
        gap: 16,
    },
    input: {
        backgroundColor: PALETTE.card,
        padding: 16,
        borderRadius: 8,
        fontSize: 16,
        color: PALETTE.textPrimary,
    },
    footer: {
        padding: 16,
        marginTop: 'auto',
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

export default ManualAddressScreen;
