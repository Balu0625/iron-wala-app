
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const PALETTE = {
    primary: "#1193d4",
    background: "#f6f7f8",
    card: "white",
    textPrimary: "#1f2937",
    textSecondary: "#4b5563",
    danger: '#ef4444',
};

const SavedAddressesScreen = () => {
    const router = useRouter();
    const [addresses, setAddresses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userId = auth.currentUser?.uid;
        if (!userId) {
            // This case should not happen if the auth guard in _layout is working
            setLoading(false);
            return;
        }

        const addressesRef = collection(db, 'users', userId, 'addresses');
        const q = query(addressesRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const addressesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAddresses(addressesData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching addresses: ", error);
            // The user will see this alert.
            Alert.alert("Error", "Could not fetch addresses. Please check your connection and try again.");
            setLoading(false);
        });

        // Unsubscribe from the listener when the component unmounts
        return () => unsubscribe();
    }, []);

    const handleAddNewAddress = () => {
        router.push('/manual-address');
    };

    const handleEditAddress = (address: any) => {
        router.push({ pathname: '/manual-address', params: address });
    };

    const handleDeleteAddress = (id: string) => {
        Alert.alert(
            'Delete Address',
            'Are you sure you want to delete this address?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', 
                    onPress: async () => {
                        const userId = auth.currentUser?.uid;
                        if (userId) {
                            try {
                                await deleteDoc(doc(db, 'users', userId, 'addresses', id));
                            } catch (error) {
                                console.error("Error deleting address: ", error);
                                Alert.alert('Error', 'Could not delete address. Please try again.');
                            }
                        }
                    }, 
                    style: 'destructive' 
                },
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => {
        const addressDetails = `${item.street}, ${item.city}, ${item.state} ${item.zip}`;
        return (
            <View style={styles.addressItem}>
                <View style={styles.addressInfo}>
                    <Text style={styles.addressName}>{item.name}</Text>
                    <Text style={styles.addressDetails}>{addressDetails}</Text>
                </View>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity onPress={() => handleEditAddress(item)}>
                        <Ionicons name="create-outline" size={24} color={PALETTE.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteAddress(item.id)}>
                        <Ionicons name="trash-outline" size={24} color={PALETTE.danger} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={PALETTE.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={PALETTE.textSecondary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Saved Addresses</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={addresses}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No saved addresses yet.</Text>
                        <Text style={styles.emptySubText}>Tap "Add New Address" to get started.</Text>
                    </View>
                )}
            />

            <View style={styles.footer}>
                <TouchableOpacity style={styles.primaryButton} onPress={handleAddNewAddress}>
                    <Text style={styles.primaryButtonText}>Add New Address</Text>
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
        borderBottomColor: '#e5e7eb',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: PALETTE.textPrimary,
    },
    listContainer: {
        padding: 16,
        flexGrow: 1,
    },
    addressItem: {
        backgroundColor: PALETTE.card,
        padding: 16,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    addressInfo: {
        flex: 1,
        marginRight: 16,
    },
    addressName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: PALETTE.textPrimary,
    },
    addressDetails: {
        fontSize: 14,
        color: PALETTE.textSecondary,
        marginTop: 4,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
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
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50, 
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: PALETTE.textPrimary,
    },
    emptySubText: {
        fontSize: 14,
        color: PALETTE.textSecondary,
        marginTop: 8,
    }
});

export default SavedAddressesScreen;
