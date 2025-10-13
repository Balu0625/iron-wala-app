
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform, Alert, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const PALETTE = {
    primary: "#1193d4",
    background: "#f6f7f8",
    card: "white",
    textPrimary: "#1f2937",
    textSecondary: "#4b5563",
    iconContainer: '#e0f2fe',
    buttonSecondary: '#e5e7eb',
    buttonSecondaryText: '#1f2937',
    disabled: '#d1d5db',
};

const Section = ({ title, children }) => (
    <View style={styles.card}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionContent}>
            {children}
        </View>
    </View>
);

const InfoRow = ({ icon, title, subtitle, onPress, disabled }) => (
    <TouchableOpacity onPress={onPress} disabled={!onPress || disabled} style={styles.infoRowContainer}>
        <View style={styles.infoRow}>
            <View style={[styles.iconContainer, disabled && styles.disabledIcon]}>
                <Ionicons name={icon} size={24} color={disabled ? PALETTE.textSecondary : PALETTE.primary} />
            </View>
            <View style={styles.infoTextContainer}>
                <Text style={[styles.infoTitle, disabled && styles.disabledText]}>{title}</Text>
                <Text style={[styles.infoSubtitle, disabled && styles.disabledText]} numberOfLines={2}>{subtitle}</Text>
            </View>
            {onPress && <Ionicons name="chevron-forward" size={20} color={disabled ? PALETTE.disabled : PALETTE.textSecondary} />}
        </View>
    </TouchableOpacity>
);

const ActionButton = ({ title, icon, onPress, isLoading, disabled }) => (
    <TouchableOpacity 
        style={[styles.actionButton, (isLoading || disabled) && styles.actionButtonDisabled]}
        onPress={onPress} 
        disabled={isLoading || disabled}
    >
        {isLoading ? (
            <ActivityIndicator color={PALETTE.primary} />
        ) : (
            <>
                <Ionicons name={icon} size={20} color={(isLoading || disabled) ? PALETTE.textSecondary : PALETTE.primary} />
                <Text style={[styles.actionButtonText, (isLoading || disabled) && styles.actionButtonTextDisabled]}>{title}</Text>
            </>
        )}
    </TouchableOpacity>
);

const OrderConfirmationScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const orderDetails = useMemo(() => {
        if (params.order) {
            return JSON.parse(params.order as string);
        }
        return { items: [], total: 0 };
    }, [params.order]);

    const { manualAddress, addressType: paramAddressType } = params;

    const [pickupAddress, setPickupAddress] = useState('123 Elm Street, Apt 4B, Springfield, IL 62704');
    const [deliveryAddress, setDeliveryAddress] = useState('456 Oak Avenue, Unit 2C, Springfield, IL 62704');
    const [sameAsPickup, setSameAsPickup] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
        if (manualAddress) {
            if (paramAddressType === 'pickup') {
                setPickupAddress(manualAddress as string);
            } else {
                setDeliveryAddress(manualAddress as string);
            }
        }
    }, [manualAddress, paramAddressType]);

    useEffect(() => {
        if (sameAsPickup) {
            setDeliveryAddress(pickupAddress);
        }
    }, [sameAsPickup, pickupAddress]);

    const itemSummary = useMemo(() => {
        return orderDetails.items.map(item => `${item.quantity} ${item.name.toLowerCase()}`).join(', ');
    }, [orderDetails.items]);

    const [pickupDate, setPickupDate] = useState(null);
    const [deliveryDate, setDeliveryDate] = useState(null);
    
    const [addressType, setAddressType] = useState('pickup');

    const [showPicker, setShowPicker] = useState(false);
    const [pickerConfig, setPickerConfig] = useState({ mode: 'date', type: 'pickup', tempDate: new Date() });

    const [isMapVisible, setMapVisible] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

    const onDateChange = (event, selectedDate) => {
        const isIOS = Platform.OS === 'ios';
        setShowPicker(isIOS);
        if (event.type === 'dismissed' || !selectedDate) {
            if (!isIOS) setShowPicker(false);
            return;
        }
    
        if (isIOS) {
            if (pickerConfig.type === 'pickup') {
                setPickupDate(selectedDate);
                setDeliveryDate(null); // Reset delivery date
            } else {
                setDeliveryDate(selectedDate);
            }
        } else {
            // Android-specific logic to handle date and time separately
            if (pickerConfig.mode === 'date') {
                const newTempDate = new Date(selectedDate);
                setPickerConfig({ ...pickerConfig, mode: 'time', tempDate: newTempDate });
                setShowPicker(true); // Show time picker next
            } else { // mode === 'time'
                const { tempDate } = pickerConfig;
                const finalDate = new Date(tempDate);
                finalDate.setHours(selectedDate.getHours());
                finalDate.setMinutes(selectedDate.getMinutes());
    
                if (pickerConfig.type === 'pickup') {
                    setPickupDate(finalDate);
                    setDeliveryDate(null); // Reset delivery date
                } else {
                    setDeliveryDate(finalDate);
                }
                setShowPicker(false); // Hide picker after time is set
            }
        }
    };
    

    const showDatepicker = (type) => {
        const isIOS = Platform.OS === 'ios';
        const mode = isIOS ? 'datetime' : 'date';
        let initialDate = new Date();
        if (type === 'pickup' && pickupDate) initialDate = pickupDate;
        if (type === 'delivery' && deliveryDate) initialDate = deliveryDate;

        setPickerConfig({ mode, type, tempDate: initialDate });
        setShowPicker(true);
    };

    const formatDateTime = (date) => {
        if (!date) return 'Not selected';
        const dateString = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const timeString = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        return `${dateString}, ${timeString}`;
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
    
                const name = addr.name || '';
                const streetNumber = addr.streetNumber || '';
                const street = addr.street || '';
                const city = addr.city || '';
                const region = addr.region || '';
                const postalCode = addr.postalCode || '';
    
                let addressString = '';
    
                if (name && isNaN(parseInt(name))) {
                     addressString = [name, street, city, region, postalCode].filter(Boolean).join(', ');
                } else {
                    addressString = [`${streetNumber} ${street}`.trim(), city, region, postalCode].filter(Boolean).join(', ');
                }
    
                if (addressType === 'pickup') {
                    setPickupAddress(addressString);
                } else {
                    setDeliveryAddress(addressString);
                }
            } else {
                Alert.alert('Error', 'Could not determine address from this location.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Could not determine address. Please try again.');
        }
        setMapVisible(false);
    };

    const handleConfirmOrder = async () => {
        const userId = auth.currentUser?.uid;
        if (!userId) {
            Alert.alert("Authentication Error", "You must be logged in to place an order.");
            return;
        }

        if (orderDetails.items.length === 0) {
            Alert.alert("Empty Order", "You cannot place an order with no items.");
            return;
        }

        if (!pickupDate || !deliveryDate) {
            Alert.alert("Incomplete Schedule", "Please select both pickup and delivery times.");
            return;
        }

        setIsLoading(true);

        try {
            const ordersRef = collection(db, "orders");
            const orderData = {
                userId: userId,
                status: "Placed",
                orderItems: orderDetails.items,
                totalAmount: orderDetails.total,
                pickupAddress: pickupAddress,
                deliveryAddress: deliveryAddress,
                pickupDate: pickupDate,
                deliveryDate: deliveryDate,
                createdAt: serverTimestamp(),
            };

            await addDoc(ordersRef, orderData);

            Alert.alert("Order Placed!", "Your order has been successfully placed.");
            router.replace('/(tabs)/'); // Navigate to home screen

        } catch (error) {
            console.error("Error placing order: ", error);
            Alert.alert("Order Failed", "There was an issue placing your order. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={PALETTE.textSecondary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Confirm Order</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Section title="Order Summary">
                    <InfoRow icon="shirt-outline" title="Clothing Items" subtitle={itemSummary || 'No items selected'} />
                    <InfoRow icon="cash-outline" title="Total Cost" subtitle={`₹${orderDetails.total.toFixed(2)}`} />
                </Section>

                <Section title="Schedule">
                    <InfoRow icon="calendar-outline" title="Pickup" subtitle={formatDateTime(pickupDate)} onPress={() => showDatepicker('pickup')} />
                    <InfoRow icon="calendar-outline" title="Delivery" subtitle={formatDateTime(deliveryDate)} onPress={() => showDatepicker('delivery')} disabled={!pickupDate} />
                </Section>

                <Section title="Addresses">
                    <View style={styles.addressTypeContainer}>
                        <TouchableOpacity 
                            style={[styles.addressTypeButton, addressType === 'pickup' && styles.addressTypeButtonActive]}
                            onPress={() => setAddressType('pickup')}>
                            <Text style={[styles.addressTypeButtonText, addressType === 'pickup' && styles.addressTypeButtonTextActive]}>Pickup</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.addressTypeButton, addressType === 'delivery' && styles.addressTypeButtonActive]}
                            onPress={() => setAddressType('delivery')}>
                            <Text style={[styles.addressTypeButtonText, addressType === 'delivery' && styles.addressTypeButtonTextActive]}>Delivery</Text>
                        </TouchableOpacity>
                    </View>
                    
                    {addressType === 'delivery' && (
                        <TouchableOpacity
                            style={styles.sameAsPickupContainer}
                            onPress={() => setSameAsPickup(!sameAsPickup)}
                        >
                            <Ionicons name={sameAsPickup ? 'checkbox' : 'square-outline'} size={24} color={PALETTE.primary} />
                            <Text style={styles.sameAsPickupText}>Same as pickup address</Text>
                        </TouchableOpacity>
                    )}

                    <InfoRow 
                        icon="location-outline" 
                        title={`${addressType === 'pickup' ? 'Pickup' : 'Delivery'} Address`} 
                        subtitle={addressType === 'pickup' ? pickupAddress : deliveryAddress}
                    />
                    
                    <View style={styles.actionButtonsContainer}>
                        <ActionButton 
                            title="Add Manually" 
                            icon="create-outline" 
                            onPress={() => {
                                router.push({
                                    pathname: '/manual-address',
                                    params: { addressType: addressType, order: params.order },
                                });
                            }} 
                            disabled={addressType === 'delivery' && sameAsPickup}
                        />
                        <ActionButton 
                            title="Select from Map" 
                            icon="map-outline" 
                            onPress={handleSelectOnMap} 
                            isLoading={isLoadingLocation} 
                            disabled={addressType === 'delivery' && sameAsPickup}
                        />
                    </View>
                </Section>

                {showPicker && (
                    <DateTimePicker
                        value={
                            pickerConfig.type === 'pickup'
                                ? pickupDate || new Date()
                                : deliveryDate || (pickupDate ? new Date(pickupDate.getTime() + 60 * 60 * 1000) : new Date())
                        }
                        mode={pickerConfig.mode as any}
                        is24Hour={false}
                        display="default"
                        onChange={onDateChange}
                        minimumDate={
                            pickerConfig.type === 'delivery' && pickupDate
                                ? new Date(pickupDate.getTime() + 60 * 60 * 1000) // 1 hour after pickup
                                : new Date() // Today for pickup
                        }
                    />
                )}
            </ScrollView>

            <View style={styles.footer}>
                 <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()} disabled={isLoading}>
                    <Text style={styles.secondaryButtonText}>Edit Order</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryButton, isLoading && styles.actionButtonDisabled]} onPress={handleConfirmOrder} disabled={isLoading}>
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.primaryButtonText}>Confirm Order</Text>
                    )}
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
                            >
                                <Marker
                                    coordinate={selectedLocation}
                                    draggable
                                    onDragEnd={(e) => setSelectedLocation(e.nativeEvent.coordinate)}
                                />
                            </MapView>
                            <View style={styles.mapCenterMarker}>
                                <Ionicons name="location" size={40} color={PALETTE.primary} />
                            </View>
                        </>
                    ) : <ActivityIndicator style={styles.map} size="large" color={PALETTE.primary}/>}
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
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: PALETTE.textPrimary,
    },
    scrollContent: {
        padding: 16,
        gap: 24,
    },
    card: {
        backgroundColor: PALETTE.card,
        borderRadius: 8,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: PALETTE.textPrimary,
        marginBottom: 16,
    },
    sectionContent: {
        gap: 16,
    },
    infoRowContainer: {},
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconContainer: {
        backgroundColor: PALETTE.iconContainer,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoTextContainer: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: PALETTE.textPrimary,
    },
    infoSubtitle: {
        fontSize: 14,
        color: PALETTE.textSecondary,
        marginTop: 2,
    },
    disabledIcon: {
        backgroundColor: PALETTE.disabled,
    },
    disabledText: {
        color: PALETTE.textSecondary,
    },
    addressTypeContainer: {
        flexDirection: 'row',
        backgroundColor: PALETTE.background,
        borderRadius: 8,
        padding: 4,
    },
    addressTypeButton: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 6,
        alignItems: 'center',
    },
    addressTypeButtonActive: {
        backgroundColor: PALETTE.card,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 2,
    },
    addressTypeButtonText: {
        fontWeight: '600',
        color: PALETTE.textSecondary,
    },
    addressTypeButtonTextActive: {
        color: PALETTE.primary,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: PALETTE.iconContainer,
        gap: 8,
        minHeight: 48, // Ensure consistent height
    },
    actionButtonText: {
        color: PALETTE.primary,
        fontWeight: '600',
        fontSize: 16,
    },
    actionButtonDisabled: {
        backgroundColor: PALETTE.disabled,
    },
    actionButtonTextDisabled: {
        color: PALETTE.textSecondary,
    },
    sameAsPickupContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
    },
    sameAsPickupText: {
        color: PALETTE.textPrimary,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        padding: 16,
        gap: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        backgroundColor: PALETTE.background
    },
    primaryButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: PALETTE.primary,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    secondaryButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: PALETTE.buttonSecondary,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: PALETTE.buttonSecondaryText,
        fontWeight: 'bold',
        fontSize: 16,
    },
    mapContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        shadowColor: PALETTE.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 16,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 4,
    },
    mapCenterMarker: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -20,
        marginTop: -40,
    }
});

export default OrderConfirmationScreen;
