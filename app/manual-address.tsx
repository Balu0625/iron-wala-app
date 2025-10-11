
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

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
    const { id, name: initialName, street: initialStreet, city: initialCity, state: initialState, zip: initialZip } = params;

    const [name, setName] = useState('');
    const [street, setStreet] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [zip, setZip] = useState('');
    const [loading, setLoading] = useState(false);

    const isEditing = !!id;

    useEffect(() => {
        if (isEditing) {
            setName(initialName as string || ' ');
            setStreet(initialStreet as string || '');
            setCity(initialCity as string || '');
            setState(initialState as string || '');
            setZip(initialZip as string || '');
        }
    }, [params]);

    const handleSaveAddress = async () => {
        const userId = auth.currentUser?.uid;
        if (!userId) {
            Alert.alert('Error', 'You must be logged in to save an address.');
            return;
        }

        if (!name || !street || !city || !state || !zip) {
            Alert.alert('Incomplete Address', 'Please fill out all fields.');
            return;
        }

        setLoading(true);

        try {
            const userDocRef = doc(db, 'users', userId);

            // Ensure the user document exists before trying to add a subcollection
            await setDoc(userDocRef, { email: auth.currentUser?.email }, { merge: true });

            if (isEditing) {
                const addressRef = doc(userDocRef, 'addresses', id as string);
                await setDoc(addressRef, { name, street, city, state, zip }, { merge: true });
            } else {
                const addressesRef = collection(userDocRef, 'addresses');
                await addDoc(addressesRef, { name, street, city, state, zip, createdAt: serverTimestamp() });
            }
            router.back();
        } catch (error) {
            console.error("Error saving address: ", error);
            Alert.alert('Error', 'Could not save the address. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={PALETTE.textSecondary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEditing ? 'Edit Address' : 'Add Address Manually'}</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.form}>
                <TextInput
                    style={styles.input}
                    placeholder="Address Name (e.g., Home, Work)"
                    value={name}
                    onChangeText={setName}
                />
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
                <TouchableOpacity style={styles.primaryButton} onPress={handleSaveAddress} disabled={loading}>
                    {loading ? 
                        <ActivityIndicator color="#fff" /> : 
                        <Text style={styles.primaryButtonText}>Save Address</Text>
                    }
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
