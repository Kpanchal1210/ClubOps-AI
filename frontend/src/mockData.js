// ============================================================
// MOCK DATA — used when VITE_DEV_MODE=true
// Shapes match the ClubOps spec exactly (v1.0 — 19 Sep 2026).
// Replace with real API responses once the backend is live.
// ============================================================

export const mockUser = {
  _id: "user-1",
  name: "Rahul Patel",
  email: "rahul@example.com",
  role: "organizer",        // admin | organizer | member
  clubId: "club-1",
  skills: ["Sponsorship", "Communication"],
  availability: "available", // available | busy | unavailable
};

export const mockEvent = {
  _id: "mock-event-1",
  clubId: "club-1",
  name: "Annual Tech Fest 2026",
  description: "Flagship technology festival with workshops, talks, and competitions.",
  venue: "Main Auditorium, Block A",
  startDate: "2026-10-01T09:00:00.000Z",
  endDate: "2026-10-03T18:00:00.000Z",
  status: "planning",        // planning | ongoing | completed | cancelled
  expectedParticipants: 500,
  expectedVolunteers: 40,
  createdBy: "user-1",
};

export const mockEvents = [
  mockEvent,
  {
    _id: "mock-event-2",
    clubId: "club-1",
    name: "AI & Robotics Summit 2026",
    description: "Hands-on generative AI workshops, autonomous robotics demonstrations, and keynote speakers.",
    venue: "Innovation Hub, Hall 3",
    startDate: "2026-10-15T10:00:00.000Z",
    endDate: "2026-10-16T17:00:00.000Z",
    status: "ongoing",
    expectedParticipants: 350,
    expectedVolunteers: 25,
    createdBy: "user-1",
  },
  {
    _id: "mock-event-3",
    clubId: "club-1",
    name: "Spring Open Source Hackathon",
    description: "48-hour continuous hackathon building community-driven open source tools.",
    venue: "Computing Labs, Block C",
    startDate: "2026-08-20T08:00:00.000Z",
    endDate: "2026-08-22T20:00:00.000Z",
    status: "completed",
    expectedParticipants: 420,
    expectedVolunteers: 35,
    createdBy: "user-1",
  },
  {
    _id: "mock-event-4",
    clubId: "club-1",
    name: "Outdoor Alumni Mixer",
    description: "Networking session for past and present club leaders.",
    venue: "Central Lawns",
    startDate: "2026-09-05T18:00:00.000Z",
    endDate: "2026-09-05T21:00:00.000Z",
    status: "cancelled",
    expectedParticipants: 120,
    expectedVolunteers: 10,
    createdBy: "user-1",
  },
];

export const mockTasks = [
  {
    _id: "t1",
    eventId: "mock-event-1",
    title: "Book venue equipment",
    description: "Arrange projectors, microphones, and PA system.",
    assignedTo: { _id: "user-1", name: "Alice Johnson" },
    createdBy: "user-1",
    priority: "high",          // low | medium | high | critical
    status: "pending",         // pending | in_progress | completed | overdue | cancelled
    deadline: "2026-09-20T00:00:00.000Z",
    source: "manual",          // manual | ai_meeting | ai_agent
    aiGenerated: false,
    dependencies: [],
  },
  {
    _id: "t2",
    eventId: "mock-event-1",
    title: "Design event poster",
    description: "Create promotional material for social media and print.",
    assignedTo: { _id: "user-2", name: "Bob Smith" },
    createdBy: "user-1",
    priority: "medium",
    status: "completed",
    deadline: "2026-09-10T00:00:00.000Z",
    source: "manual",
    aiGenerated: false,
    dependencies: [],
  },
  {
    _id: "t3",
    eventId: "mock-event-1",
    title: "Confirm guest speakers",
    description: "Send confirmation emails and travel arrangements.",
    assignedTo: { _id: "user-3", name: "Carol White" },
    createdBy: "user-1",
    priority: "high",
    status: "in_progress",
    deadline: "2026-09-25T00:00:00.000Z",
    source: "ai_meeting",      // extracted by AI from meeting transcript
    aiGenerated: true,
    dependencies: [],
  },
  {
    _id: "t4",
    eventId: "mock-event-1",
    title: "Set up registration portal",
    description: "Deploy the online registration form with payment gateway.",
    assignedTo: { _id: "user-4", name: "David Lee" },
    createdBy: "user-1",
    priority: "high",
    status: "overdue",
    deadline: "2026-09-15T00:00:00.000Z",
    source: "manual",
    aiGenerated: false,
    dependencies: [],
  },
  {
    _id: "t5",
    eventId: "mock-event-1",
    title: "Arrange catering",
    description: "Confirm menu and headcount with the catering vendor.",
    assignedTo: { _id: "user-5", name: "Eva Martinez" },
    createdBy: "user-1",
    priority: "medium",
    status: "pending",
    deadline: "2026-09-28T00:00:00.000Z",
    source: "ai_agent",        // created by AI agent
    aiGenerated: true,
    dependencies: [],
  },
  {
    _id: "t6",
    eventId: "mock-event-1",
    title: "Volunteer orientation",
    description: "Conduct briefing session for all registered volunteers.",
    assignedTo: { _id: "user-6", name: "Frank Chen" },
    createdBy: "user-1",
    priority: "low",
    status: "pending",
    deadline: "2026-09-30T00:00:00.000Z",
    source: "manual",
    aiGenerated: false,
    dependencies: [],
  },
];

export const mockRisks = [
  {
    _id: "r1",
    eventId: "mock-event-1",
    title: "Low ticket sales",
    description: "Registration numbers are below the projected target.",
    severity: "high",          // low | medium | high | critical
    probability: "medium",     // low | medium | high
    status: "open",            // open | investigating | resolved | ignored
    detectedBy: "ai",          // manual | ai
    recommendedAction: "Launch targeted social media campaign immediately.",
    assignedTo: { _id: "user-1", name: "Rahul Patel" },
  },
  {
    _id: "r2",
    eventId: "mock-event-1",
    title: "Speaker cancellation",
    description: "A keynote speaker may withdraw due to scheduling conflict.",
    severity: "medium",
    probability: "low",
    status: "investigating",
    detectedBy: "manual",
    recommendedAction: "Identify backup speakers and keep them on standby.",
    assignedTo: null,
  },
  {
    _id: "r3",
    eventId: "mock-event-1",
    title: "Equipment failure",
    description: "AV equipment may malfunction during the event.",
    severity: "high",
    probability: "low",
    status: "open",
    detectedBy: "ai",
    recommendedAction: "Rent backup equipment and test all gear 48 hours before.",
    assignedTo: { _id: "user-4", name: "David Lee" },
  },
  {
    _id: "r4",
    eventId: "mock-event-1",
    title: "Insufficient volunteers",
    description: "Not enough volunteers signed up for logistics roles.",
    severity: "medium",
    probability: "medium",
    status: "open",
    detectedBy: "manual",
    recommendedAction: "Open a second volunteer recruitment drive.",
    assignedTo: null,
  },
];

export const mockVolunteers = [
  {
    _id: "v1",
    eventId: "mock-event-1",
    userId: { _id: "user-1", name: "Alice Johnson" },
    team: "Logistics",
    skills: ["Coordination", "Driving"],
    availability: "available",
    assignedTasks: ["t1"],
  },
  {
    _id: "v2",
    eventId: "mock-event-1",
    userId: { _id: "user-2", name: "Bob Smith" },
    team: "Media",
    skills: ["Photography", "Video Editing"],
    availability: "available",
    assignedTasks: ["t2"],
  },
  {
    _id: "v3",
    eventId: "mock-event-1",
    userId: { _id: "user-3", name: "Carol White" },
    team: "Registration",
    skills: ["MS Excel", "Communication"],
    availability: "busy",
    assignedTasks: ["t3"],
  },
  {
    _id: "v4",
    eventId: "mock-event-1",
    userId: { _id: "user-4", name: "David Lee" },
    team: "Technical",
    skills: ["AV Setup", "Networking"],
    availability: "available",
    assignedTasks: ["t4"],
  },
  {
    _id: "v5",
    eventId: "mock-event-1",
    userId: { _id: "user-5", name: "Eva Martinez" },
    team: "Hospitality",
    skills: ["Event Management", "Catering"],
    availability: "unavailable",
    assignedTasks: [],
  },
];

export const mockNotifications = [
  {
    _id: "n1",
    userId: "user-1",
    eventId: "mock-event-1",
    type: "task_deadline",      // task_assigned | task_deadline | risk_detected | announcement | event_update
    title: "Task Overdue",
    message: "Set up registration portal was due on Sep 15.",
    priority: "high",
    read: false,
    createdAt: "2026-09-16T08:00:00.000Z",
  },
  {
    _id: "n2",
    userId: "user-1",
    eventId: "mock-event-1",
    type: "task_assigned",
    title: "New Volunteer Registered",
    message: "Eva Martinez has signed up as a Hospitality volunteer.",
    priority: "medium",
    read: false,
    createdAt: "2026-09-14T11:30:00.000Z",
  },
  {
    _id: "n3",
    userId: "user-1",
    eventId: "mock-event-1",
    type: "risk_detected",
    title: "Risk Alert",
    message: "Low ticket sales risk has been escalated to HIGH severity.",
    priority: "high",
    read: false,
    createdAt: "2026-09-13T09:15:00.000Z",
  },
  {
    _id: "n4",
    userId: "user-1",
    eventId: "mock-event-1",
    type: "task_deadline",
    title: "Task Completed",
    message: "Design event poster has been marked as completed by Bob Smith.",
    priority: "low",
    read: true,
    createdAt: "2026-09-10T14:00:00.000Z",
  },
  {
    _id: "n5",
    userId: "user-1",
    eventId: "mock-event-1",
    type: "announcement",
    title: "Meeting Scheduled",
    message: "Planning meeting set for Sep 18 at 3:00 PM.",
    priority: "medium",
    read: true,
    createdAt: "2026-09-09T10:00:00.000Z",
  },
];

export const mockAgentActions = [
  {
    _id: "a1",
    userId: "user-1",
    eventId: "mock-event-1",
    command: "Create a high priority task for David to test AV equipment tomorrow",
    intent: "CREATE_TASK",
    tool: "createTask",
    parameters: {
      title: "Test AV equipment",
      assignedTo: "user-4",
      deadline: "2026-09-20T18:00:00.000Z",
      priority: "high",
    },
    status: "completed",       // pending | running | completed | failed
    result: { taskId: "t1" },
    createdAt: "2026-09-19T14:00:00.000Z",
  },
  {
    _id: "a2",
    userId: "user-1",
    eventId: "mock-event-1",
    command: "Flag a high severity risk — venue booking still not confirmed",
    intent: "CREATE_RISK",
    tool: "createRisk",
    parameters: {
      title: "Venue booking unconfirmed",
      severity: "high",
      probability: "medium",
    },
    status: "completed",
    result: { riskId: "r3" },
    createdAt: "2026-09-19T14:05:00.000Z",
  },
  {
    _id: "a3",
    userId: "user-1",
    eventId: "mock-event-1",
    command: "Send notification to all volunteers about orientation on Sep 30",
    intent: "SEND_NOTIFICATION",
    tool: "sendNotification",
    parameters: {
      message: "Volunteer orientation is scheduled for Sep 30, 10 AM.",
    },
    status: "running",
    result: null,
    createdAt: "2026-09-19T14:10:00.000Z",
  },
];

// AIAnalysis shape — stored after POST /api/meetings/:id/process
export const mockAIResult = {
  _id: "ai-1",
  meetingId: "meeting-1",
  eventId: "mock-event-1",
  analysis: {
    summary:
      "The planning meeting covered venue logistics, speaker confirmations, and volunteer assignments. Key decisions were made regarding the AV setup timeline and catering vendor selection.",
    tasks: [
      {
        title: "Confirm AV vendor",
        description: "Reach out to AV vendor and sign contract.",
        priority: "high",
        deadline: "2026-09-22",
        ownerId: "user-4",
      },
      {
        title: "Send speaker confirmation emails",
        description: "Email all confirmed speakers with schedule and travel details.",
        priority: "medium",
        deadline: "2026-09-20",
        ownerId: "user-3",
      },
    ],
    risks: [
      {
        title: "Catering delay",
        description: "Vendor may not deliver on time if order is placed late.",
        severity: "medium",
        probability: "medium",
        recommendedAction: "Place order at least 2 weeks before the event.",
      },
    ],
    decisions: [
      "Go with Vendor A for catering.",
      "All sessions will be recorded for YouTube upload.",
      "Volunteer briefing moved to Sep 30 morning slot.",
    ],
    actionItems: [
      "Alice to book AV equipment by Sep 22.",
      "Bob to upload final poster to all social platforms.",
      "Carol to finalize registration headcount by Sep 25.",
    ],
  },
};

export const mockMeetings = [
  {
    _id: "meeting-1",
    eventId: "mock-event-1",
    title: "Hackathon Planning & Logistics Sync",
    date: "2026-09-18T15:00:00.000Z",
    participants: ["Rahul Patel", "Alice Johnson", "Carol White", "David Lee"],
    status: "processed",        // processed | processing | pending
    summary: "Finalized venue equipment checklist, confirmed keynote speaker timings, and approved budget allocation for catering.",
    transcript: "Rahul: Welcome everyone. Let's review the venue AV setup. Alice, have we verified microphones and projectors with Block A? Alice: Yes, quote received. Carol: Speakers are confirmed pending travel booking. David: Registration portal needs payment integration testing before launch.",
  },
  {
    _id: "meeting-2",
    eventId: "mock-event-1",
    title: "Sponsorship & Tech Partner Review",
    date: "2026-09-15T11:00:00.000Z",
    participants: ["Rahul Patel", "Bob Smith", "Eva Martinez"],
    status: "processed",
    summary: "Reviewed 6 tier-1 corporate sponsor proposals and confirmed two title sponsors with signed MoUs.",
    transcript: "Rahul: Great news from CloudTech — they approved the gold tier sponsorship. Bob: Pitch deck revisions completed. Eva: We need contract signatures by end of week.",
  },
  {
    _id: "meeting-3",
    eventId: "mock-event-1",
    title: "Volunteer Roles & Safety Orientation",
    date: "2026-09-12T14:30:00.000Z",
    participants: ["Alice Johnson", "Frank Chen", "David Lee", "Eva Martinez"],
    status: "processed",
    summary: "Allocated 40 expected volunteer slots across Registration, Stage Management, and Hospitality.",
    transcript: "Alice: Volunteer drive is live. We have 5 confirmed leads. Frank will lead floor coordination. David handles AV gear security.",
  },
];

export const mockDocuments = [
  {
    _id: "doc-1",
    name: "Auditorium_Safety_Guidelines_2026.pdf",
    type: "PDF",
    event: "Annual Tech Fest 2026",
    eventId: "mock-event-1",
    uploadedBy: "Rahul Patel",
    status: "processed",        // uploaded | processing | processed | failed
    date: "2026-09-14T10:00:00.000Z",
    size: "2.4 MB",
  },
  {
    _id: "doc-2",
    name: "Sponsor_Package_Agreement_Draft.doc",
    type: "DOC",
    event: "Annual Tech Fest 2026",
    eventId: "mock-event-1",
    uploadedBy: "Rahul Patel",
    status: "processed",
    date: "2026-09-16T16:20:00.000Z",
    size: "840 KB",
  },
  {
    _id: "doc-3",
    name: "Guest_Speaker_Hospitality_Checklist.txt",
    type: "TXT",
    event: "Annual Tech Fest 2026",
    eventId: "mock-event-1",
    uploadedBy: "Carol White",
    status: "processed",
    date: "2026-09-17T09:15:00.000Z",
    size: "45 KB",
  },
  {
    _id: "doc-4",
    name: "Catering_Vendor_Price_Proposal.pdf",
    type: "PDF",
    event: "Annual Tech Fest 2026",
    eventId: "mock-event-1",
    uploadedBy: "Eva Martinez",
    status: "processing",
    date: "2026-09-19T08:00:00.000Z",
    size: "1.2 MB",
  },
];

// Convenience re-exports used by Dashboard
export const mockDashboard = {
  event: mockEvent,
  events: mockEvents,
  statistics: {
    totalEvents: mockEvents.length,
    activeEvents: mockEvents.filter((e) => e.status === "planning" || e.status === "ongoing").length,
    totalTasks: mockTasks.length,
    completedTasks: mockTasks.filter((t) => t.status === "completed").length,
    pendingTasks: mockTasks.filter((t) => t.status === "pending").length,
    overdueTasks: mockTasks.filter((t) => t.status === "overdue").length,
    openRisks: mockRisks.filter((r) => r.status === "open").length,
    volunteers: mockVolunteers.length,
  },
  tasks: mockTasks,
  risks: mockRisks,
  volunteers: mockVolunteers,
  recentMeetings: mockMeetings,
  documents: mockDocuments,
  notifications: mockNotifications.filter((n) => !n.read),
};

