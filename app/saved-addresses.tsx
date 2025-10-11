
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

const PALETTE = {
    primary: "#1193d4",
    background: "#f6f7f8",
    card: "white",
    textPrimary: "#1f2937",
    textSecondary: "#4b5563",
};

const initialAddresses = [
    { id: '1', name: 'Home', details: '123 Elm Street, Apt 4B, Springfield, IL 62704' },
    { id: '2', name: 'Work', details: '456 Oak Avenue, Unit 2C, Springfield, IL 62704' },
];

const SavedAddressesScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { manualAddress } = params;

    const [addresses, setAddresses] = useState(initialAddresses);
    const [isMapVisible, setMapVisible] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

    useEffect(() => {
        if (manualAddress) {
            const newAddress = { 
                id: Math.random().toString(), 
                name: 'New Address', 
                details: manualAddress as string 
            };
            setAddresses(prev => [...prev, newAddress]);
            // router.setParams({ manualAddress: null }); // Clear param
        }
    }, [manualAddress]);

    const handleAddNewAddress = () => {
        Alert.alert(
            'Add New Address',
            'How would you like to add a new address?',
            [
                { text: 'Add Manually', onPress: () => router.push('/manual-address') },
                { text: 'Select from Map', onPress: handleSelectOnMap },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const handleSelectOnMap = async () => {
        setIsLoadingLocation(true);
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission denied', 'Permission to access location was denied');
            setIsLoadingLocation(false);
            return;
        }

        try {
            let location = await Location.getCurrentPositionAsync({});
            const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
            setCurrentLocation(coords);
            setSelectedLocation(coords);
            setMapVisible(true);
        } catch (error) {
            Alert.alert('Error', 'Could not fetch location. Please try again.');
        }
        setIsLoadingLocation(false);
    };

    const handleConfirmLocation = async () => {
        if (!selectedLocation) return;
        try {
            const reverseGeocode = await Location.reverseGeocodeAsync(selectedLocation);
            if (reverseGeocode.length > 0) {
                const addr = reverseGeocode[0];
                const addressString = [`${addr.streetNumber} ${addr.street}`.trim(), addr.city, addr.region, addr.postalCode].filter(Boolean).join(', ');
                
                const newAddress = { id: Math.random().toString(), name: 'New Map Address', details: addressString };
                setAddresses(prev => [...prev, newAddress]);
            } else {
                Alert.alert('Error', 'Could not determine address from this location.');
            }
        } catch (error) {
            Alert.alert('Error', 'Could not determine address. Please try again.');
        }
        setMapVisible(false);
    };

    const renderItem = ({ item }) => (
        <View style={styles.addressItem}>
            <View style={styles.addressInfo}>
                <Text style={styles.addressName}>{item.name}</Text>
                <Text style={styles.addressDetails}>{item.details}</Text>
            </View>
            <TouchableOpacity>
                <Ionicons name="create-outline" size={24} color={PALETTE.textSecondary} />
            </TouchableOpacity>
        </View>
    );

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
            />

            <View style={styles.footer}>
                <TouchableOpacity style={styles.primaryButton} onPress={handleAddNewAddress}>
                    <Text style={styles.primaryButtonText}>Add New Address</Text>
                </TouchableOpacity>
            </View>
            
            <Modal
                animationType="slide"
                transparent={false}
                visible={isMapVisible}
                onRequestClose={() => setMapVisible(false)}
            >
                <View style={styles.mapContainer}>
                    {currentLocation ? (
                        <>
                            <MapView
                                style={styles.map}
                                initialRegion={{
                                    ...currentLocation,
                                    latitudeDelta: 0.01,
                                    longitudeDelta: 0.01,
                                }}
                                onRegionChangeComplete={(region) => setSelectedLocation(region)}
                            />
                             <View style={styles.mapCenterMarker}>
                                <Ionicons name="location" size={40} color={PALETTE.primary} />
                            </View>
                        </>
                    ) : <ActivityIndicator style={styles.map} size="large"/>}
                    <View style={styles.mapControls}>
                        <TouchableOpacity style={styles.confirmLocationButton} onPress={handleConfirmLocation}>
                            <Text style={styles.primaryButtonText}>Confirm Location</Text>
                        </TouchableOpacity>
                    </View>
                     <TouchableOpacity style={styles.closeButton} onPress={() => setMapVisible(false)}>
                        <Ionicons name="close-circle" size={32} color={PALETTE.textPrimary} />
                    </TouchableOpacity>
                </View>
            </Modal>
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
    mapContainer: {
        flex: 1,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    mapControls: {
        position: 'absolute',
        bottom: 30,
        left: 16,
        right: 16,
    },
    confirmLocationButton: {
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: PALETTE.primary,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 16,
    },
    mapCenterMarker: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -20,
        marginTop: -40,
    }
});

export default SavedAddressesScreen;
