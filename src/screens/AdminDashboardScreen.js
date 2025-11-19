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
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useTheme } from '../contexts/ThemeContext';

export default function AdminDashboardScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [hostRequests, setHostRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingRequests: 0,
    totalEvents: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const requestsQuery = query(
        collection(db, 'hostRequests'),
        where('status', '==', 'pending')
      );
      const requestsSnapshot = await getDocs(requestsQuery);
      const requests = requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHostRequests(requests);

      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const usersSnapshot = await getDocs(collection(db, 'users'));
      
      setStats({
        pendingRequests: requests.length,
        totalEvents: eventsSnapshot.size,
        totalUsers: usersSnapshot.size,
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId, userId) => {
    try {
      await updateDoc(doc(db, 'hostRequests', requestId), {
        status: 'approved',
        approvedAt: new Date().toISOString(),
      });

      await updateDoc(doc(db, 'users', userId), {
        role: 'verified_host',
      });

      Alert.alert('Success', 'Host request approved!');
      loadData();
    } catch (error) {
      console.error('Error approving request:', error);
      Alert.alert('Error', 'Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'hostRequests', requestId), {
                status: 'rejected',
                rejectedAt: new Date().toISOString(),
              });
              Alert.alert('Success', 'Request rejected');
              loadData();
            } catch (error) {
              console.error('Error rejecting request:', error);
              Alert.alert('Error', 'Failed to reject request');
            }
          }
        }
      ]
    );
  };

  const styles = createStyles(colors);

  const RequestCard = ({ request }) => (
    <View style={styles.requestCard}>
      <View style={[styles.requestGlass, {
        backgroundColor: colors.surfaceGlass,
        borderColor: colors.border
      }]}>
        <View style={styles.requestHeader}>
          <View style={styles.requestAvatar}>
            <Text style={styles.requestEmoji}>👤</Text>
          </View>
          <View style={styles.requestInfo}>
            <Text style={[styles.requestName, { color: colors.text }]}>User Request</Text>
            <Text style={[styles.requestDate, { color: colors.textSecondary }]}>
              {new Date(request.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.requestContent}>
          <View style={styles.requestSection}>
            <Text style={[styles.requestLabel, { color: colors.textSecondary }]}>
              WHY HOST?
            </Text>
            <Text style={[styles.requestText, { color: colors.text }]}>
              {request.reason}
            </Text>
          </View>

          <View style={styles.requestSection}>
            <Text style={[styles.requestLabel, { color: colors.textSecondary }]}>
              EXPERIENCE
            </Text>
            <Text style={[styles.requestText, { color: colors.text }]}>
              {request.experience}
            </Text>
          </View>

          {request.eventIdeas && (
            <View style={styles.requestSection}>
              <Text style={[styles.requestLabel, { color: colors.textSecondary }]}>
                EVENT IDEAS
              </Text>
              <Text style={[styles.requestText, { color: colors.text }]}>
                {request.eventIdeas}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.requestActions}>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => handleRejectRequest(request.id)}
          >
            <View style={styles.rejectGlass}>
              <Text style={styles.rejectButtonText}>Reject</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.approveButton}
            onPress={() => handleApproveRequest(request.id, request.userId)}
          >
            <View style={styles.approveGlass}>
              <Text style={styles.approveButtonText}>✓ Approve</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats */}
          <View style={styles.statsSection}>
            <View style={styles.statCard}>
              <View style={[styles.statGlass, {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.border
              }]}>
                <Text style={styles.statIcon}>⏳</Text>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {stats.pendingRequests}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Pending
                </Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statGlass, {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.border
              }]}>
                <Text style={styles.statIcon}>🎉</Text>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {stats.totalEvents}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Events
                </Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statGlass, {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.border
              }]}>
                <Text style={styles.statIcon}>👥</Text>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {stats.totalUsers}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Users
                </Text>
              </View>
            </View>
          </View>

          {/* Pending Requests */}
          <View style={styles.requestsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Pending Host Requests
            </Text>
            
            {hostRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={[styles.emptyGlass, {
                  backgroundColor: colors.surfaceGlass,
                  borderColor: colors.border
                }]}>
                  <Text style={styles.emptyEmoji}>✅</Text>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    All caught up!
                  </Text>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No pending host requests at the moment
                  </Text>
                </View>
              </View>
            ) : (
              hostRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 20,
    },
    backButton: {
      fontSize: 28,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 24,
      paddingBottom: 40,
    },
    statsSection: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 28,
    },
    statCard: {
      flex: 1,
      borderRadius: 16,
      overflow: 'hidden',
    },
    statGlass: {
      borderWidth: 1,
      paddingVertical: 18,
      alignItems: 'center',
    },
    statIcon: {
      fontSize: 28,
      marginBottom: 8,
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 4,
      letterSpacing: -0.5,
    },
    statLabel: {
      fontSize: 12,
    },
    requestsSection: {
      gap: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 4,
      letterSpacing: -0.3,
    },
    requestCard: {
      borderRadius: 20,
      overflow: 'hidden',
      marginBottom: 16,
    },
    requestGlass: {
      borderWidth: 1,
      padding: 20,
    },
    requestHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    requestAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(255, 215, 0, 0.15)',
      borderWidth: 2,
      borderColor: 'rgba(255, 215, 0, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    requestEmoji: {
      fontSize: 24,
    },
    requestInfo: {
      flex: 1,
    },
    requestName: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 2,
      letterSpacing: -0.2,
    },
    requestDate: {
      fontSize: 12,
    },
    requestContent: {
      gap: 14,
      marginBottom: 18,
    },
    requestSection: {
      gap: 6,
    },
    requestLabel: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    requestText: {
      fontSize: 14,
      lineHeight: 20,
    },
    requestActions: {
      flexDirection: 'row',
      gap: 10,
    },
    rejectButton: {
      flex: 1,
      borderRadius: 12,
      overflow: 'hidden',
    },
    rejectGlass: {
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.3)',
      paddingVertical: 12,
      alignItems: 'center',
    },
    rejectButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#EF4444',
    },
    approveButton: {
      flex: 1,
      borderRadius: 12,
      overflow: 'hidden',
    },
    approveGlass: {
      backgroundColor: 'rgba(166, 255, 150, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(166, 255, 150, 0.3)',
      paddingVertical: 12,
      alignItems: 'center',
    },
    approveButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#A6FF96',
    },
    emptyState: {
      borderRadius: 16,
      overflow: 'hidden',
    },
    emptyGlass: {
      borderWidth: 1,
      padding: 40,
      alignItems: 'center',
    },
    emptyEmoji: {
      fontSize: 56,
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 8,
      letterSpacing: -0.3,
    },
    emptyText: {
      fontSize: 14,
      textAlign: 'center',
    },
  });
}
