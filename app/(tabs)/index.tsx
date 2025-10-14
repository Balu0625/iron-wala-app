
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const PALETTE = {
    primary: "#1193d4",
    background: "#f6f7f8",
    content: "#101c22",
    subtle: "#e4e5e6",
    card: "white",
};

interface Item {
    name: string;
    price: number;
    quantity: number;
    image: string;
    info: string;
}

const INITIAL_ITEMS: Item[] = [
    {
        name: 'Shirts',
        price: 20,
        quantity: 0,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDoe1uPr70OT191sdQiYqyumBqArpHAfUAClPhutjGLNqSDpFHxWNLBAFWOzX-snWTTekPMe-gh81gd8F-TQ8zoByLVHfPeJzVCWA_BAzKhGpOl29soSp_Y7L6NUzWRxhcqzel6Pz3Trot0XZWLVJgbI9srh5Xpj3MTJANdUvLkYlVb4D6iw1S16FZoPUbnEFso1971p6i5ZgdhVas1UHm2GX-xqgSvII9Vaaf1ktooflKL9sEKnzihm7NLY-Aj-_Jd2UOFq8NkotI',
        info: 'Iron cotton shirts on high heat, preferably while damp.'
    },
    {
        name: 'Pants',
        price: 10,
        quantity: 0,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWE1KkM8LTwEiAHK-dWin4oil7cc0mJ02AxRlopRrj1Tp7HBmofLW5jaMJlgG16o6X75iCu-Qv95A0sNy9MvswzQZRod5aEFIKRno9pspc4UKU78Gd02e4cikxlvgPWaMYDhbgzHlTz55uuOAHSgFHr3LbpU3GvzviV45ZAq-ECylHo_c3d3TxZOUSDKQ6SimkoWkBcrPq-WSCUYb01nyPTQKKu4bfNGw336m1n4IK-6kh9K92-CDr0H9asbMsSUKcTr790kdeYvg',
        info: "Iron pants inside out to protect the fabric's sheen." 
    },
    {
        name: 'Sarees',
        price: 50,
        quantity: 0,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGjV9Ag2yZAuAE8ZTXoy40R2pZT_wHYLNwKb3WO4hq6uxewvSx7HpGLkqICUGbfIKIoxlbVC9BmwCYVyGknChxoMfRDlFFzQ9xbnNK5X3C1rJt1o_NB702V09zx53lMV07gYm5oYXwYV4i4hIPOPz1TblZ7R3vvmaXYVpNZIhr_th2n7nJs0cIanscZoTQm_d09vn-lmzAleVq3Na6rlcirzqfbEiZk-6MmuHShHANlS9JcTRfe3YEscALzlg65nBZQfHwpNd_vPM',
        info: 'Use low to medium heat for delicate fabrics like silk.'
    },
];

const BANNERS = [
    {
        icon: 'sparkles-outline',
        title: 'Benefits of Ironing',
        description: 'Ironing kills germs and gives your clothes a fresh, crisp look.',
    },
    {
        icon: 'pricetag-outline',
        title: 'Special Offer!',
        description: 'Get 20% off your first order. Use code: FIRST20',
    },
    {
        icon: 'shirt-outline',
        title: 'Garment Care Tip',
        description: 'Always check the care label before ironing to avoid damage.',
    },
];

const HomeScreen = () => {
    const [items, setItems] = useState<Item[]>(INITIAL_ITEMS);
    const [serviceFee, setServiceFee] = useState(0);
    const [discount, setDiscount] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

    useEffect(() => {
        const fetchConfig = async () => {
            const docRef = doc(db, "products", "config");
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setServiceFee(data.serviceFee || 0);
                setDiscount(data.discount || 0);
            } else {
                // Create the document with default values if it doesn't exist
                await setDoc(docRef, { serviceFee: 15, discount: 10 });
                setServiceFee(15);
                setDiscount(10);
            }
        };

        fetchConfig();
    }, []);


    const handleQuantityChange = (index: number, delta: number) => {
        const newItems = [...items];
        const newQuantity = newItems[index].quantity + delta;
        if (newQuantity >= 0) {
            newItems[index].quantity = newQuantity;
            setItems(newItems);
        }
    };

    const { subtotal, total, cartCount, fee, disc } = useMemo(() => {
        const sub = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const fee = sub > 0 ? serviceFee : 0;
        const disc = sub > 0 ? discount : 0;
        const total = sub + fee - disc;
        const count = items.reduce((acc, item) => acc + item.quantity, 0);
        return { subtotal: sub, total, cartCount: count, fee, disc };
    }, [items, serviceFee, discount]);

    const orderDetails = useMemo(() => {
        const activeItems = items.filter(item => item.quantity > 0);
        return { items: activeItems, total };
    }, [items, total]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentBannerIndex(prevIndex => {
                const nextIndex = (prevIndex + 1) % BANNERS.length;
                scrollViewRef.current?.scrollTo({
                    x: nextIndex * 336, 
                    animated: true,
                });
                return nextIndex;
            });
        }, 3000); 

        return () => clearInterval(interval);
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: PALETTE.background }}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <View style={styles.container}>
                    <View style={styles.flexGrow}>
                        <View style={styles.header}>
                            <View style={{ width: 40 }} />
                            <Text style={styles.headerTitle}>Iron Wala</Text>
                            <TouchableOpacity style={styles.cartButton}>
                                <Ionicons name="cart" size={24} color={PALETTE.content} />
                                {cartCount > 0 && (
                                    <View style={styles.cartBadge}>
                                        <Text style={styles.cartBadgeText}>{cartCount}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.mainContent}>
                            <ScrollView
                                ref={scrollViewRef}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.carousel}
                                contentContainerStyle={{ paddingHorizontal: 16 }}
                                scrollEventThrottle={16} 
                                onMomentumScrollEnd={event => {
                                    if (Platform.OS !== 'web') {
                                        const newIndex = Math.round(
                                            event.nativeEvent.contentOffset.x / 336
                                        );
                                        setCurrentBannerIndex(newIndex);
                                    }
                                }}
                            >
                                {BANNERS.map((banner, index) => (
                                    <View key={index} style={styles.carouselItem}>
                                        <Ionicons name={banner.icon as any} size={40} color={PALETTE.primary} />
                                        <Text style={styles.carouselTitle}>{banner.title}</Text>
                                        <Text style={styles.carouselText}>{banner.description}</Text>
                                    </View>
                                ))}
                            </ScrollView>

                            <View style={styles.itemsSection}>
                                <Text style={styles.selectItemsTitle}>Select Items</Text>
                                <View style={styles.itemsContainer}>
                                    {items.map((item, index) => (
                                        <View key={index} style={styles.item}>
                                            <View style={styles.itemDetails}>
                                                <Image source={{ uri: item.image }} style={styles.itemImage} />
                                                <View>
                                                    <View style={styles.itemNameContainer}>
                                                        <Text style={styles.itemName}>{item.name}</Text>
                                                        <Ionicons name="information-circle-outline" size={16} color={`${PALETTE.content}80`} />
                                                    </View>
                                                    <Text style={styles.itemPrice}>{`₹${item.price.toFixed(2)} / item`}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.quantitySelector}>
                                                <TouchableOpacity style={styles.quantityButton} onPress={() => handleQuantityChange(index, -1)}>
                                                    <Text style={styles.quantityButtonText}>-</Text>
                                                </TouchableOpacity>
                                                <View style={styles.quantityContainer}>
                                                    <Text style={styles.quantityText}>{item.quantity}</Text>
                                                    <Text style={styles.quantityPrice}>{`₹${(item.price * item.quantity).toFixed(2)}`}</Text>
                                                </View>
                                                <TouchableOpacity style={styles.quantityButton} onPress={() => handleQuantityChange(index, 1)}>
                                                    <Text style={styles.quantityButtonText}>+</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </ScrollView>
                    </View>

                    <View style={styles.footer}>
                        <View style={styles.summaryContainer}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryText}>Subtotal</Text>
                                <Text style={styles.summaryText}>{`₹${subtotal.toFixed(2)}`}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryText}>Service Fee</Text>
                                <Text style={styles.summaryText}>{`₹${fee.toFixed(2)}`}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryText}>Discount</Text>
                                <Text style={[styles.summaryText, { color: PALETTE.primary }]}>{`-₹${disc.toFixed(2)}`}</Text>
                            </View>
                            <View style={[styles.summaryRow, { marginTop: 8 }]}>
                                <Text style={styles.totalText}>Total</Text>
                                <Text style={styles.totalText}>{`₹${total.toFixed(2)}`}</Text>
                            </View>
                            <Link href={{ pathname: "/order-confirmation", params: { order: JSON.stringify(orderDetails) } }} style={[styles.proceedButton, cartCount === 0 && styles.disabledButton]} disabled={cartCount === 0} asChild>
                                <TouchableOpacity>
                                    <Text style={styles.proceedButtonText}>Proceed to Order</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between',
    },
    flexGrow: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: PALETTE.background,
        borderBottomWidth: 1,
        borderBottomColor: PALETTE.subtle,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: PALETTE.content,
    },
    cartButton: {
        position: 'relative',
        padding: 8,
    },
    cartBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: PALETTE.primary,
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    mainContent: {
        paddingVertical: 24,
        gap: 24,
    },
    carousel: {
        flexGrow: 0,
    },
    carouselItem: {
        width: 320,
        backgroundColor: `${PALETTE.primary}1A`,
        borderRadius: 12,
        padding: 16,
        marginRight: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    carouselTitle: {
        fontWeight: 'bold',
        color: PALETTE.content,
        marginTop: 8,
    },
    carouselText: {
        fontSize: 14,
        color: `${PALETTE.content}CC`,
        textAlign: 'center',
        marginTop: 4,
    },
    itemsSection: {
        paddingHorizontal: 16,
    },
    selectItemsTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: PALETTE.content,
        marginBottom: 16,
    },
    itemsContainer: {
        gap: 16,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: PALETTE.card,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    itemDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    itemImage: {
        width: 48,
        height: 48,
        borderRadius: 8,
    },
    itemNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    itemName: {
        fontWeight: 'bold',
        color: PALETTE.content,
    },
    itemPrice: {
        fontSize: 14,
        color: `${PALETTE.content}B3`,
    },
    quantitySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    quantityButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: PALETTE.subtle,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityButtonText: {
        color: PALETTE.content,
        fontWeight: 'bold',
        fontSize: 18,
    },
    quantityContainer: {
        alignItems: 'center',
        minWidth: 40,
    },
    quantityText: {
        fontWeight: 'bold',
        color: PALETTE.content,
        fontSize: 16,
    },
    quantityPrice: {
        fontSize: 12,
        fontWeight: 'bold',
        color: PALETTE.primary,
        marginTop: 2,
    },
    footer: {
        padding: 16,
        paddingTop: 8,
        borderBottomWidth: 1,
        borderBottomColor: PALETTE.subtle,
        backgroundColor: PALETTE.background,
    },
    summaryContainer: {
        gap: 4,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    summaryText: {
        fontSize: 16,
        color: PALETTE.content,
        fontWeight: '500',
    },
    totalText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: PALETTE.content,
    },
    proceedButton: {
        backgroundColor: PALETTE.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
        shadowColor: PALETTE.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    disabledButton: {
        backgroundColor: '#9ca3af',
        shadowColor: 'transparent',
    },
    proceedButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default HomeScreen;
