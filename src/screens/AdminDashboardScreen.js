import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { notifyHostApproved, notifyHostRejected } from '../services/notifications';
import Colors from '../constants/Colors';
import Sizes from '../constants/Sizes';

export default function AdminDashboardScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requests');
  const [hostRequests, setHostRequests] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    publishedEvents: 0,
    pendingEvents: 0,
    totalUsers: 0,
    pendingRequests: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const requestsQuery = query(
        collection(db, 'hostRequests'),
        where('status', '==', 'pending')
      );
      const requestsSnapshot = await getDocs(requestsQuery);
      const requests = [];
      requestsSnapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() });
      });
      setHostRequests(requests);

      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const events = [];
      let published = 0;
      let pending = 0;

      eventsSnapshot.forEach((doc) => {
        const eventData = { id: doc.id, ...doc.data() };
        events.push(eventData);
        if (eventData.status === 'published') published++;
        if (eventData.status === 'pending') pending++;
      });
      setAllEvents(events);

      setStats({
        totalEvents: events.length,
        publishedEvents: published,
        pendingEvents: pending,
        totalUsers: 0,
        pendingRequests: requests.length,
      });

      console.log('✅ Dashboard data loaded');
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId, userId) => {
    try {
      await updateDoc(doc(db, 'hostRequests', requestId), {
        status: 'approved',
        reviewedAt: new Date().toISOString(),
        reviewedBy: auth.currentUser.uid,
      });

      await updateDoc(doc(db, 'users', userId), {
        role: 'verified_host',
        hostProfile: {
          verified: true,
          eventsHosted: 0,
          rating: 5,
          verifiedAt: new Date().toISOString(),
          bio: '',
        },
      });

      // Send notification
      await notifyHostApproved(userId);

      console.log('✅ Host request approved');
      loadDashboardData();
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleRejectRequest = async (requestId, userId) => {
    try {
      await updateDoc(doc(db, 'hostRequests', requestId), {
        status: 'rejected',
        reviewedAt: new Date().toISOString(),
        reviewedBy: auth.currentUser.uid,
      });

      // Send notification
      await notifyHostRejected(userId);

      console.log('❌ Host request rejected');
      loadDashboardData();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const handleApproveEvent = async (eventId) => {
    try {
      await updateDoc(doc(db, 'events', eventId), {
        status: 'published',
        publishedAt: new Date().toISOString(),
        approvedBy: auth.currentUser.uid,
      });

      console.log('✅ Event approved and published');
      loadDashboardData();
    } catch (error) {
      console.error('Error approving event:', error);
    }
  };

  const handleEventPress = (event) => {
    navigation.navigate('EventDetail', { event });
  };

  const renderHostRequest = ({ item }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View>
          <Text style={styles.requestName}>{item.userName}</Text>
          <Text style={styles.requestEmail}>{item.email}</Text>
        </View>
        <Text style={styles.requestDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.requestContent}>
        <Text style={styles.requestLabel}>Why they want to be a host:</Text>
        <Text style={styles.requestText}>{item.message}</Text>

        {item.experience && (
          <>
            <Text style={styles.requestLabel}>Experience:</Text>
            <Text style={styles.requestText}>{item.experience}</Text>
          </>
        )}
      </View>

      <View style={styles.requestActions}>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => handleRejectRequest(item.id, item.userId)}
        >
          <Text style={styles.rejectButtonText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.approveButton}
          onPress={() => handleApproveRequest(item.id, item.userId)}
        >
          <Text style={styles.approveButtonText}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEvent = ({ item }) => (
    <TouchableOpacity 
      style={styles.eventCard}
      onPress={() => handleEventPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.eventHeader}>
        <View style={styles.eventBadges}>
          <View style={[
            styles.statusBadge,
            item.status === 'published' ? styles.publishedBadge : styles.pendingBadge
          ]}>
            <Text style={styles.statusBadgeText}>
              {item.status.toUpperCase()}
            </Text>
          </View>
          {item.hostType === 'official' && (
            <View style={styles.officialBadge}>
              <Text style={styles.officialBadgeText}>OFFICIAL</Text>
            </View>
          )}
        </View>
        <Text style={styles.eventDate}>
          {new Date(item.date).toLocaleDateString()}
        </Text>
      </View>

      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventHost}>Hosted by {item.hostName}</Text>
      <Text style={styles.eventAttendees}>
        {item.currentAttendees}/{item.maxAttendees} attendees
      </Text>

      <View style={styles.eventActions}>
        <View style={styles.viewDetailsHint}>
          <Text style={styles.viewDetailsText}>👁️ Tap to view details</Text>
        </View>
        {item.status === 'pending' && (
          <TouchableOpacity
            style={styles.publishButton}
            onPress={(e) => {
              e.stopPropagation();
              handleApproveEvent(item.id);
            }}
          >
            <Text style={styles.publishButtonText}>Publish</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Manage BondVibe</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalEvents}</Text>
          <Text style={styles.statLabel}>Total Events</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.publishedEvents}</Text>
          <Text style={styles.statLabel}>Published</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.pendingEvents}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.pendingRequests}</Text>
          <Text style={styles.statLabel}>Requests</Text>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Host Requests ({hostRequests.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'events' && styles.activeTab]}
          onPress={() => setActiveTab('events')}
        >
          <Text style={[styles.tabText, activeTab === 'events' && styles.activeTabText]}>
            All Events ({allEvents.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'requests' && (
          <FlatList
            data={hostRequests}
            keyExtractor={(item) => item.id}
            renderItem={renderHostRequest}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>✅</Text>
                <Text style={styles.emptyText}>No pending requests</Text>
              </View>
            }
          />
        )}

        {activeTab === 'events' && (
          <FlatList
            data={allEvents}
            keyExtractor={(item) => item.id}
            renderItem={renderEvent}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>📅</Text>
                <Text style={styles.emptyText}>No events yet</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: Sizes.fontSize.medium,
    color: Colors.textLight,
  },
  header: {
    backgroundColor: Colors.background,
    padding: Sizes.padding * 2,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 12,
  },
  title: {
    fontSize: Sizes.fontSize.xlarge,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: Sizes.fontSize.small,
    color: Colors.textLight,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    padding: Sizes.padding,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Sizes.padding,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: Sizes.fontSize.small,
    color: Colors.textLight,
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    padding: Sizes.padding,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.textLight,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: Sizes.padding * 2,
  },
  requestCard: {
    backgroundColor: Colors.background,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.padding * 2,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  requestName: {
    fontSize: Sizes.fontSize.large,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  requestEmail: {
    fontSize: Sizes.fontSize.small,
    color: Colors.textLight,
  },
  requestDate: {
    fontSize: Sizes.fontSize.small,
    color: Colors.textLight,
  },
  requestContent: {
    marginBottom: 16,
  },
  requestLabel: {
    fontSize: Sizes.fontSize.small,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
    marginTop: 8,
  },
  requestText: {
    fontSize: Sizes.fontSize.medium,
    color: Colors.text,
    lineHeight: 20,
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: Colors.error,
    padding: Sizes.padding,
    borderRadius: Sizes.borderRadius,
    marginRight: 8,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
  },
  approveButton: {
    flex: 1,
    backgroundColor: Colors.success,
    padding: Sizes.padding,
    borderRadius: Sizes.borderRadius,
    marginLeft: 8,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
  },
  eventCard: {
    backgroundColor: Colors.background,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.padding * 2,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eventBadges: {
    flexDirection: 'row',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  publishedBadge: {
    backgroundColor: '#E8F5E9',
  },
  pendingBadge: {
    backgroundColor: '#FFF9E6',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  officialBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  officialBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  eventDate: {
    fontSize: Sizes.fontSize.small,
    color: Colors.textLight,
  },
  eventTitle: {
    fontSize: Sizes.fontSize.large,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  eventHost: {
    fontSize: Sizes.fontSize.small,
    color: Colors.textLight,
    marginBottom: 4,
  },
  eventAttendees: {
    fontSize: Sizes.fontSize.small,
    color: Colors.text,
    marginBottom: 12,
  },
  eventActions: {
    gap: 8,
  },
  viewDetailsHint: {
    backgroundColor: '#F0F0F0',
    padding: 8,
    borderRadius: Sizes.borderRadius,
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: Sizes.fontSize.small,
    color: Colors.textLight,
  },
  publishButton: {
    backgroundColor: Colors.primary,
    padding: Sizes.padding,
    borderRadius: Sizes.borderRadius,
    alignItems: 'center',
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: Sizes.fontSize.medium,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: Sizes.fontSize.large,
    fontWeight: '600',
    color: Colors.text,
  },
});
