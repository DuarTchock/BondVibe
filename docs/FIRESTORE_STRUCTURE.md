# Firestore Data Structure

## Collections

### users/
```
{
  uid: string,
  email: string,
  fullName: string,
  age: number,
  location: string,
  bio: string,
  avatar: string,
  role: "user" | "verified_host" | "admin",
  createdAt: timestamp,
  profileCompleted: boolean,
  legalAccepted: boolean,
  
  // Host info (if verified_host or admin)
  hostProfile: {
    verified: boolean,
    eventsHosted: number,
    rating: number,
    verifiedAt: timestamp,
    bio: string,
  },
  
  // Events joined
  eventsJoined: [eventId],
  eventsHosting: [eventId],
}
```

### events/
```
{
  id: string,
  title: string,
  description: string,
  category: string,
  date: timestamp,
  duration: string,
  location: string,
  locationDetails: {
    address: string,
    coordinates: { lat, lng },
  },
  price: number,
  maxAttendees: number,
  currentAttendees: number,
  
  // Host info
  hostId: string,
  hostName: string,
  hostAvatar: string,
  hostType: "official" | "community",
  
  // Event status
  status: "pending" | "approved" | "published" | "cancelled" | "completed",
  
  // Content
  whatsIncluded: [string],
  language: [string],
  
  // Metadata
  createdAt: timestamp,
  updatedAt: timestamp,
  publishedAt: timestamp,
  
  // Attendees
  attendees: [
    {
      userId: string,
      joinedAt: timestamp,
      status: "confirmed" | "cancelled",
    }
  ],
  
  // Admin
  approvedBy?: string,
  approvedAt?: timestamp,
}
```

### eventRequests/ (Para usuarios que solicitan ser hosts)
```
{
  id: string,
  userId: string,
  userName: string,
  email: string,
  requestType: "become_host" | "suggest_event",
  message: string,
  status: "pending" | "approved" | "rejected",
  createdAt: timestamp,
  reviewedBy?: string,
  reviewedAt?: timestamp,
}
```
