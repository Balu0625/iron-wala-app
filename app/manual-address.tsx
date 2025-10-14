
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const PALETTE = {
    primary: "#1193d4",
    background: "#f6f7f8",
    card: "white",
    textPrimary: "#1f2937",
    textSecondary: "#4b5563",
    border: "#e5e7eb",
    disabled: "#d1d5db",
};

const indianStates = {
    "Andhra Pradesh": ["Vijayawada", "Guntur", "Nellore", "Kurnool"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
    "Karnataka": ["Bengaluru", "Mysuru", "Hubballi"],
};

const LocationModal = ({ visible, onClose, onSelect, type, selectedState }) => {
    const data = type === 'state' ? Object.keys(indianStates) : indianStates[selectedState] || [];

    const handleSelect = (item) => {
        if ((type === 'state' && item !== 'Andhra Pradesh') || (type === 'city' && item !== 'Vijayawada')) {
            Alert.alert(
                "Service not available",
                "We are currently only available in Vijayawada, Andhra Pradesh. We will be expanding to other locations soon!",
                [{ text: "OK" }]
            );
        } else {
            onSelect(item);
            onClose();
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select {type}</Text>
                    <FlatList
                        data={data}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => handleSelect(item)}>
                                <Text style={styles.modalItem}>{item}</Text>
                            </TouchableOpacity>
                        )}
                    />
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
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
    const [isStateModalVisible, setIsStateModalVisible] = useState(false);
    const [isCityModalVisible, setIsCityModalVisible] = useState(false);

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

        if (state !== 'Andhra Pradesh' || city !== 'Vijayawada') {
            Alert.alert(
                "Service not available",
                "We apologize, but our service is currently limited to Vijayawada, Andhra Pradesh. We are working on expanding to more locations soon!",
                [{ text: "OK" }]
            );
            return;
        }

        setLoading(true);

        try {
            const userDocRef = doc(db, 'users', userId);
            await setDoc(userDocRef, { email: auth.currentUser?.email }, { merge: true });

            const addressData = { name, street, city, state, zip };
            if (isEditing) {
                const addressRef = doc(userDocRef, 'addresses', id as string);
                await setDoc(addressRef, addressData, { merge: true });
            } else {
                const addressesRef = collection(userDocRef, 'addresses');
                await addDoc(addressesRef, { ...addressData, createdAt: serverTimestamp() });
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
                <TextInput style={styles.input} placeholder="Address Name (e.g., Home, Work)" value={name} onChangeText={setName} />
                <TextInput style={styles.input} placeholder="Street Address" value={street} onChangeText={setStreet} />
                
                <TouchableOpacity onPress={() => setIsStateModalVisible(true)}>
                    <TextInput
                        style={[styles.input, { color: state ? PALETTE.textPrimary : PALETTE.disabled } ]}
                        placeholder="State"
                        value={state}
                        editable={false}
                    />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => {
                    if (!state) {
                        Alert.alert("Please select a state first.");
                        return;
                    }
                     setIsCityModalVisible(true)
                }}>
                    <TextInput
                        style={[styles.input, { color: city ? PALETTE.textPrimary : PALETTE.disabled } ]}
                        placeholder="City"
                        value={city}
                        editable={false}
                    />
                </TouchableOpacity>

                <TextInput style={styles.input} placeholder="PIN Code" value={zip} onChangeText={setZip} keyboardType="numeric" />
            </View>

            <LocationModal
                visible={isStateModalVisible}
                onClose={() => setIsStateModalVisible(false)}
                onSelect={(selected) => setState(selected)}
                type="state"
            />
            <LocationModal
                visible={isCityModalVisible}
                onClose={() => setIsCityModalVisible(false)}
                onSelect={(selected) => setCity(selected)}
                type="city"
                selectedState={state}
            />

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
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: PALETTE.card,
        borderRadius: 12,
        padding: 24,
        width: '80%',
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: PALETTE.textPrimary,
    },
    modalItem: {
        paddingVertical: 16,
        fontSize: 18,
        borderBottomWidth: 1,
        borderBottomColor: PALETTE.border,
        color: PALETTE.textPrimary,
    },
    closeButton: {
        marginTop: 20,
        backgroundColor: PALETTE.primary,
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    closeButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default ManualAddressScreen;
