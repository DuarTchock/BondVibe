import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useTheme } from '../contexts/ThemeContext';
import { createNotification } from '../utils/notificationService';

export default function AdminDashboardScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [stats, setStats] = useState({ pending: 0, events: 0, users: 0 });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Cargar requests pendientes
      const requestsQuery = query(
        collection(db, 'hostRequests'),
        where('status', '==', 'pending')
      );
      const requestsSnapshot = await getDocs(requestsQuery);
      const requests = await Promise.all(
        requestsSnapshot.docs.map(async (docSnap) => {
          const requestData = docSnap.data();
          const userDoc = await getDoc(doc(db, 'users', requestData.userId));
          return {
            id: docSnap.id,
            ...requestData,
            userName: userDoc.data()?.fullName || 'Unknown User',
          };
        })
      );
      setPendingRequests(requests);

      // Cargar estadísticas
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const usersSnapshot = await getDocs(collection(db, 'users'));
      
      setStats({
        pending: requests.length,
        events: eventsSnapshot.size,
        users: usersSnapshot.size,
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, userId, userName) => {
    Alert.alert(
      'Approve Host Request',
      `Are you sure you want to approve ${userName} as a host?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            setProcessing(requestId);
            try {
              // Actualizar status del request
              await updateDoc(doc(db, 'hostRequests', requestId), {
                status: 'approved',
                reviewedAt: new Date().toISOString(),
              });

              // Actualizar rol del usuario a 'host'
              await updateDoc(doc(db, 'users', userId), {
                role: 'host',
              });

              // Crear notificación para el usuario
              await createNotification(userId, {
                type: 'host_approved',
                title: 'Congratulations! 🎉',
                message: 'Your host request has been approved. You can now create unlimited events!',
                icon: '🎪',
              });

              Alert.alert('Success', `${userName} is now a host!`);
              await loadData();
            } catch (error) {
              console.error('Error approving request:', error);
              Alert.alert('Error', 'Could not approve request');
            } finally {
              setProcessing(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = async (requestId, userId, userName) => {
    Alert.alert(
      'Reject Host Request',
      `Are you sure you want to reject ${userName}'s request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setProcessing(requestId);
            try {
              // Actualizar status del request
              await updateDoc(doc(db, 'hostRequests', requestId), {
                status: 'rejected',
                reviewedAt: new Date().toISOString(),
              });

              // Crear notificación para el usuario
              await createNotification(userId, {
                type: 'host_rejected',
                title: 'Host Request Update',
                message: 'Your host request has been reviewed. Please feel free to reapply in the future.',
                icon: '📋',
              });

              Alert.alert('Rejected', `${userName}'s request has been rejected`);
              await loadData();
            } catch (error) {
              console.error('Error rejecting request:', error);
              Alert.alert('Error', 'Could not reject request');
            } finally {
              setProcessing(null);
            }
          },
        },
      ]
    );
  };

  const styles = createStyles(colors);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Admin Dashboard</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, {
            backgroundColor: colors.surfaceGlass,
            borderColor: colors.border
          }]}>
            <Text style={styles.statIcon}>⏳</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.pending}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
          </View>

          <View style={[styles.statCard, {
            backgroundColor: colors.surfaceGlass,
            borderColor: colors.border
          }]}>
            <Text style={styles.statIcon}>🎉</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.events}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Events</Text>
          </View>

          <View style={[styles.statCard, {
            backgroundColor: colors.surfaceGlass,
            borderColor: colors.border
          }]}>
            <Text style={styles.statIcon}>👥</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.users}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Users</Text>
          </View>
        </View>

        {/* Pending Requests */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Pending Host Requests</Text>
          
          {pendingRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>✅</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No pending requests
              </Text>
            </View>
          ) : (
            pendingRequests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={[styles.requestGlass, {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border
                }]}>
                  <View style={styles.requestHeader}>
                    <View style={[styles.userAvatar, {
                      backgroundColor: `${colors.primary}26`,
                      borderColor: `${colors.primary}4D`
                    }]}>
                      <Text style={styles.avatarText}>👤</Text>
                    </View>
                    <View style={styles.requestInfo}>
                      <Text style={[styles.requestName, { color: colors.text }]}>
                        {request.userName}
                      </Text>
                      <Text style={[styles.requestDate, { color: colors.textTertiary }]}>
                        {new Date(request.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.requestDetails}>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                        WHY HOST?
                      </Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>
                        {request.whyHost}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                        EXPERIENCE
                      </Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>
                        {request.experience}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                        EVENT IDEAS
                      </Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>
                        {request.eventIdeas}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleReject(request.id, request.userId, request.userName)}
                      disabled={processing === request.id}
                    >
                      <View style={[styles.rejectGlass, {
                        backgroundColor: 'rgba(255, 69, 58, 0.1)',
                        borderColor: 'rgba(255, 69, 58, 0.3)'
                      }]}>
                        <Text style={styles.rejectText}>
                          {processing === request.id ? 'Processing...' : 'Reject'}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={() => handleApprove(request.id, request.userId, request.userName)}
                      disabled={processing === request.id}
                    >
                      <View style={[styles.approveGlass, {
                        backgroundColor: 'rgba(52, 199, 89, 0.1)',
                        borderColor: 'rgba(52, 199, 89, 0.3)'
                      }]}>
                        <Text style={styles.approveText}>
                          {processing === request.id ? 'Processing...' : '✓ Approve'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
    backButton: { fontSize: 28 },
    headerTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
    statCard: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 16, alignItems: 'center' },
    statIcon: { fontSize: 32, marginBottom: 8 },
    statValue: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
    statLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    section: { marginBottom: 28 },
    sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16, letterSpacing: -0.3 },
    requestCard: { marginBottom: 16, borderRadius: 16, overflow: 'hidden' },
    requestGlass: { borderWidth: 1, padding: 16 },
    requestHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    userAvatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { fontSize: 24 },
    requestInfo: { flex: 1 },
    requestName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    requestDate: { fontSize: 12 },
    requestDetails: { marginBottom: 16 },
    detailRow: { marginBottom: 12 },
    detailLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    detailValue: { fontSize: 14, lineHeight: 20 },
    actionsRow: { flexDirection: 'row', gap: 12 },
    rejectButton: { flex: 1, borderRadius: 12, overflow: 'hidden' },
    rejectGlass: { borderWidth: 1, paddingVertical: 12, alignItems: 'center' },
    rejectText: { fontSize: 15, fontWeight: '600', color: '#FF453A' },
    approveButton: { flex: 1, borderRadius: 12, overflow: 'hidden' },
    approveGlass: { borderWidth: 1, paddingVertical: 12, alignItems: 'center' },
    approveText: { fontSize: 15, fontWeight: '600', color: '#34C759' },
    emptyState: { alignItems: 'center', paddingVertical: 40 },
    emptyEmoji: { fontSize: 64, marginBottom: 12 },
    emptyText: { fontSize: 14 },
  });
}
