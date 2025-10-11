
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { auth, db } from '../../firebase';

const PALETTE = {
    primary: "#1193d4",
    backgroundLight: "#f6f7f8",
    contentLight: "#101c22",
    subtleLight: "#e4e5e6",
};

const statusStyles = {
    'Placed': { bg: '#FEF3C7', text: '#92400E' },
    'In Progress': { bg: '#DBEAFE', text: '#1E40AF' },
    'Delivered': { bg: '#D1FAE5', text: '#065F46' },
    'Cancelled': { bg: '#FEE2E2', text: '#991B1B' },
};

const OrderCard = ({ order }) => {
    const statusStyle = statusStyles[order.status] || { bg: PALETTE.subtleLight, text: PALETTE.contentLight };
    const orderDate = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date not available';
    const itemSummary = order.orderItems.map(item => `${item.quantity} ${item.name}`).join(', ');

    return (
        <TouchableOpacity style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.orderId}>{`#${order.id.substring(0, 6).toUpperCase()}`}</Text>
                    <Text style={styles.orderDate}>{orderDate}</Text>
                </View>
                <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>{order.status}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={`${PALETTE.contentLight}99`} />
                </View>
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.orderItems}>{itemSummary}</Text>
            </View>
        </TouchableOpacity>
    );
};

const EmptyState = ({ message }) => (
    <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>🌬️</Text>
        <Text style={styles.emptyText}>{message}</Text>
    </View>
);

const OrdersScreen = () => {
    const [currentOrders, setCurrentOrders] = useState([]);
    const [pastOrders, setPastOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = auth.currentUser;

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where("userId", "==", user.uid), orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const allOrders = [];
            querySnapshot.forEach((doc) => {
                allOrders.push({ id: doc.id, ...doc.data() });
            });

            const current = allOrders.filter(order => ['Placed', 'In Progress'].includes(order.status));
            const past = allOrders.filter(order => ['Delivered', 'Cancelled'].includes(order.status));

            setCurrentOrders(current);
            setPastOrders(past);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching orders: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Orders</Text>
            </View>

            {loading ? (
                <ActivityIndicator style={{ flex: 1, justifyContent: 'center' }} size="large" color={PALETTE.primary} />
            ) : (
                <ScrollView contentContainerStyle={styles.mainContent}>
                    <View>
                        <Text style={styles.sectionTitle}>Current Orders</Text>
                        {currentOrders.length > 0 ? (
                            <View style={styles.ordersList}>
                                {currentOrders.map(order => <OrderCard key={order.id} order={order} />)}
                            </View>
                        ) : (
                            <EmptyState message="No current orders. Time to schedule a pickup!" />
                        )}
                    </View>
                    <View>
                        <Text style={styles.sectionTitle}>Past Orders</Text>
                        {pastOrders.length > 0 ? (
                            <View style={styles.ordersList}>
                                {pastOrders.map(order => <OrderCard key={order.id} order={order} />)}
                            </View>
                        ) : (
                            <EmptyState message="No past orders... yet!" />
                        )}
                    </View>
                </ScrollView>
            )}
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
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: PALETTE.subtleLight,
        backgroundColor: PALETTE.backgroundLight,
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
        color: `${PALETTE.contentLight}CC`,
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
        borderTopColor: `${PALETTE.subtleLight}80`,
    },
    orderItems: {
        fontSize: 14,
        color: PALETTE.contentLight,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        backgroundColor: 'white',
        borderRadius: 8,
        gap: 8,
    },
    emptyText: {
        fontSize: 16,
        color: PALETTE.contentLight,
        textAlign: 'center',
    },
});

export default OrdersScreen;
