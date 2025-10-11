
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PALETTE = {
    primary: "#1193d4",
    backgroundLight: "#f6f7f8",
    contentLight: "#101c22",
    subtleLight: "#e4e5e6",
};

const statusStyles = {
    'Pending Pickup': { bg: '#FEF3C7', text: '#92400E' },
    'In Progress': { bg: '#DBEAFE', text: '#1E40AF' },
    'Delivered': { bg: '#D1FAE5', text: '#065F46' },
    'Cancelled': { bg: '#FEE2E2', text: '#991B1B' },
};

const currentOrders = [
    { id: '#IW1051', date: 'Oct 26, 2023', status: 'Pending Pickup', items: '2 Shirts, 1 Pant, 1 Saree' },
    { id: '#IW1048', date: 'Oct 24, 2023', status: 'In Progress', items: '3 Kurtas, 2 Trousers' },
];

const pastOrders = [
    { id: '#IW1045', date: 'Oct 20, 2023', status: 'Delivered', items: '5 Shirts' },
    { id: '#IW1042', date: 'Oct 15, 2023', status: 'Delivered', items: '2 Sarees, 1 Dress' },
    { id: '#IW1039', date: 'Oct 10, 2023', status: 'Cancelled', items: '1 Bed Sheet, 2 Pillow Covers' },
];

const OrderCard = ({ order }) => {
    const statusStyle = statusStyles[order.status];
    return (
        <TouchableOpacity style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.orderId}>{order.id}</Text>
                    <Text style={styles.orderDate}>{order.date}</Text>
                </View>
                <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>{order.status}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={`${PALETTE.contentLight}99`} />
                </View>
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.orderItems}>{order.items}</Text>
            </View>
        </TouchableOpacity>
    );
};

const OrdersScreen = () => {
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={PALETTE.contentLight} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Orders</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.mainContent}>
                <View>
                    <Text style={styles.sectionTitle}>Current Orders</Text>
                    <View style={styles.ordersList}>
                        {currentOrders.map(order => <OrderCard key={order.id} order={order} />)}
                    </View>
                </View>
                <View>
                    <Text style={styles.sectionTitle}>Past Orders</Text>
                    <View style={styles.ordersList}>
                        {pastOrders.map(order => <OrderCard key={order.id} order={order} />)}
                    </View>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: PALETTE.subtleLight,
        backgroundColor: PALETTE.backgroundLight,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: PALETTE.contentLight,
    },
    mainContent: {
        padding: 16,
        gap: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: PALETTE.contentLight,
        marginBottom: 16,
    },
    ordersList: {
        gap: 16,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    orderId: {
        fontWeight: 'bold',
        color: PALETTE.contentLight,
    },
    orderDate: {
        fontSize: 14,
        color: `${PALETTE.contentLight}CC`, // 80% opacity
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 99,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    cardBody: {
        paddingTop: 8,
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: `${PALETTE.subtleLight}80`, // 50% opacity
    },
    orderItems: {
        fontSize: 14,
        color: PALETTE.contentLight,
    },
});

export default OrdersScreen;
