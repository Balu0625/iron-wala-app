
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PALETTE = {
    primary: "#1193d4",
    background: "#f6f7f8",
    card: "#f1f5f9",
    textPrimary: "#0f172a",
    textSecondary: "#64748b",
    textTertiary: "#94a3b8",
    border: "#e2e8f0",
    danger: "#ef4444",
};

const user = {
    name: 'Arjun Kapoor',
    joined: 'Member since 2022',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCA9uhYoyCKv7reYaUWReGpjEyTvmatk_mWQLCmhCbcIleVb46brqsGsDFGLXhOBxI6QD5vzjigGHmy92GB0LpXbv2Ilx0xtbISvhP-e_moNVS2CsOxkvy4sOscF2t3khzRcs8-hG5bCkmJx_gRTX1KFbsUlwyyJ142HiOoNg4pyQ435PftZdvoGOrPRnSGQk3JgeNCe_OVogaM9z4seVQ82mmqBt-SdY4SCaatdMgzdsxvKGKyUElMx-T7XZdFkSlEg6s9EccxkrA',
    contact: '+91 9876543210',
    address: '23, Sector 15, Chandigarh',
};

const AccountInfo = ({ onNavigate }) => (
    <View style={styles.menuGroup}>
        <Text style={styles.sectionTitle}>Account Info</Text>
        <View style={styles.card}>
            <TouchableOpacity style={[styles.menuItem, styles.borderBottom]} onPress={() => onNavigate('contact-details')}>
                <View style={styles.iconContainer}>
                    <Ionicons name="call-outline" size={24} color={PALETTE.primary} />
                </View>
                <View style={styles.menuTextContainer}>
                    <Text style={styles.menuLabel}>Contact Details</Text>
                    <Text style={styles.menuValue}>{user.contact}</Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={20} color={PALETTE.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => onNavigate('saved-addresses')}>
                <View style={styles.iconContainer}>
                    <Ionicons name="home-outline" size={24} color={PALETTE.primary} />
                </View>
                <View style={styles.menuTextContainer}>
                    <Text style={styles.menuLabel}>Saved Addresses</Text>
                    <Text style={styles.menuValue}>{user.address}</Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={20} color={PALETTE.textTertiary} />
            </TouchableOpacity>
        </View>
    </View>
);

const Manage = ({ onNavigate }) => (
    <View style={styles.menuGroup}>
        <Text style={styles.sectionTitle}>Manage</Text>
        <View style={styles.card}>
            <TouchableOpacity style={[styles.menuItem, styles.borderBottom]} onPress={() => Alert.alert('Coming Soon', 'This feature is not yet available.')}>
                <View style={styles.iconContainer}>
                    <Ionicons name="time-outline" size={24} color={PALETTE.primary} />
                </View>
                <Text style={styles.menuLabelFull}>Past Orders</Text>
                <Ionicons name="chevron-forward-outline" size={20} color={PALETTE.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, styles.borderBottom]} onPress={() => Alert.alert('Coming Soon', 'This feature is not yet available.')}>
                <View style={styles.iconContainer}>
                    <Ionicons name="card-outline" size={24} color={PALETTE.primary} />
                </View>
                <Text style={styles.menuLabelFull}>Payment Methods</Text>
                <Ionicons name="chevron-forward-outline" size={20} color={PALETTE.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Coming Soon', 'This feature is not yet available.')}>
                <View style={styles.iconContainer}>
                    <Ionicons name="settings-outline" size={24} color={PALETTE.primary} />
                </View>
                <Text style={styles.menuLabelFull}>Settings</Text>
                <Ionicons name="chevron-forward-outline" size={20} color={PALETTE.textTertiary} />
            </TouchableOpacity>
        </View>
    </View>
);

const ProfileScreen = () => {
    const router = useRouter();

    const handleNavigate = (screen) => {
        router.push(`/${screen}`);
    };

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Logout", onPress: () => router.push('/(auth)/login'), style: "destructive" },
            ]
        );
    };

    const handleEditProfile = () => {
        Alert.alert("Edit Profile", "This will open a screen to edit your profile.");
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={PALETTE.textSecondary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={styles.headerButton} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.profileSection}>
                    <View>
                        <Image
                            source={{ uri: user.avatar }}
                            style={styles.avatar}
                        />
                        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                            <Ionicons name="pencil" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{user.name}</Text>
                        <Text style={styles.profileJoined}>{user.joined}</Text>
                    </View>
                </View>

                <View style={styles.menuContainer}>
                    <AccountInfo onNavigate={handleNavigate} />
                    <Manage onNavigate={handleNavigate} />
                    <View style={{ paddingTop: 16 }}>
                        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                            <Ionicons name="log-out-outline" size={24} color={PALETTE.danger} />
                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
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
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: PALETTE.border,
        backgroundColor: PALETTE.background,
    },
    headerButton: {
        width: 40, // For spacing
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        color: PALETTE.textPrimary,
    },
    scrollContent: {
        paddingBottom: 48,
    },
    profileSection: {
        alignItems: 'center',
        padding: 24, // p-6
        gap: 24, // space-y-6
    },
    avatar: {
        width: 128, // h-32 w-32
        height: 128,
        borderRadius: 64, // rounded-full
    },
    editButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: PALETTE.primary,
        borderRadius: 20,
        padding: 8,
        borderWidth: 4,
        borderColor: PALETTE.background,
    },
    profileInfo: {
        alignItems: 'center',
        gap: 4,
    },
    profileName: {
        fontSize: 24, // text-2xl
        fontWeight: 'bold',
        color: PALETTE.textPrimary,
    },
    profileJoined: {
        fontSize: 16,
        color: PALETTE.textSecondary,
    },
    menuContainer: {
        paddingHorizontal: 16, // px-4
        gap: 24, // space-y-4 (between groups)
    },
    menuGroup: {
        gap: 8, // space-y-2
    },
    sectionTitle: {
        fontSize: 12, // text-sm
        fontWeight: '600',
        color: PALETTE.textSecondary,
        textTransform: 'uppercase',
        paddingHorizontal: 8, // px-2
    },
    card: {
        backgroundColor: PALETTE.card,
        borderRadius: 8, // rounded-lg
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16, // p-4
        gap: 16, // gap-4
    },
    borderBottom: {
        borderBottomWidth: 1,
        borderBottomColor: PALETTE.border,
    },
    iconContainer: {
        backgroundColor: `${PALETTE.primary}33`, // bg-primary/20
        padding: 12,
        borderRadius: 8,
    },
    menuTextContainer: {
        flex: 1,
        gap: 2,
    },
    menuLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: PALETTE.textPrimary,
    },
    menuLabelFull: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: PALETTE.textPrimary,
    },
    menuValue: {
        fontSize: 14,
        color: PALETTE.textSecondary,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PALETTE.card,
        borderRadius: 8,
        padding: 16,
        gap: 16,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '500',
        color: PALETTE.danger,
    },
});

export default ProfileScreen;
