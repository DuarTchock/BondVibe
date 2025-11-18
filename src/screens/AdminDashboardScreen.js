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

export default function AdminDashboardScreen({ navigation }) {
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
      // Load host requests
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

      // Load stats
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

  const RequestCard = ({ request }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestGlass}>
        <View style={styles.requestHeader}>
          <View style={styles.requestAvatar}>
            <Text style={styles.requestEmoji}>👤</Text>
          </View>
          <View style={styles.requestInfo}>
            <Text style={styles.requestName}>User Request</Text>
            <Text style={styles.requestDate}>
              {new Date(request.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.requestContent}>
          <View style={styles.requestSection}>
            <Text style={styles.requestLabel}>Why host?</Text>
            <Text style={styles.requestText}>{request.reason}</Text>
          </View>

          <View style={styles.requestSection}>
            <Text style={styles.requestLabel}>Experience</Text>
            <Text style={styles.requestText}>{request.experience}</Text>
          </View>

          {request.eventIdeas && (
            <View style={styles.requestSection}>
              <Text style={styles.requestLabel}>Event Ideas</Text>
              <Text style={styles.requestText}>{request.eventIdeas}</Text>
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
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF3EA5" />
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
              <View style={styles.statGlass}>
                <Text style={styles.statIcon}>⏳</Text>
                <Text style={styles.statValue}>{stats.pendingRequests}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statGlass}>
                <Text style={styles.statIcon}>🎉</Text>
                <Text style={styles.statValue}>{stats.totalEvents}</Text>
                <Text style={styles.statLabel}>Events</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statGlass}>
                <Text style={styles.statIcon}>👥</Text>
                <Text style={styles.statValue}>{stats.totalUsers}</Text>
                <Text style={styles.statLabel}>Users</Text>
              </View>
            </View>
          </View>

          {/* Pending Requests */}
          <View style={styles.requestsSection}>
            <Text style={styles.sectionTitle}>Pending Host Requests</Text>
            
            {hostRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyGlass}>
                  <Text style={styles.emptyEmoji}>✅</Text>
                  <Text style={styles.emptyTitle}>All caught up!</Text>
                  <Text style={styles.emptyText}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F1A',
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
    color: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F1F5F9',
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
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    color: '#FF3EA5',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  requestsSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  requestCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  requestGlass: {
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    color: '#F1F5F9',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  requestDate: {
    fontSize: 12,
    color: '#94A3B8',
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
    color: '#94A3B8',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  requestText: {
    fontSize: 14,
    color: '#F1F5F9',
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
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    color: '#F1F5F9',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
