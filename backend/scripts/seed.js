require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Club = require("../models/Club");
const User = require("../models/User");
const Event = require("../models/Event");
const Task = require("../models/Task");
const Risk = require("../models/Risk");
const Volunteer = require("../models/Volunteer");
const Meeting = require("../models/Meeting");
const Notification = require("../models/Notification");
const AgentAction = require("../models/AgentAction");
const Document = require("../models/Document");
const DocumentChunk = require("../models/DocumentChunk");
const AIAnalysis = require("../models/AIAnalysis");

const { chunkText } = require("../rag/chunking/chunker");
const { generateEmbedding } = require("../rag/embeddings/embedder");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/clubops";

async function seed() {
  try {
    console.log("Connecting to MongoDB:", MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log("Connected to database. Resetting collections...");

    // Clean up existing collections
    await Promise.all([
      Club.deleteMany({}),
      User.deleteMany({}),
      Event.deleteMany({}),
      Task.deleteMany({}),
      Risk.deleteMany({}),
      Volunteer.deleteMany({}),
      Meeting.deleteMany({}),
      Notification.deleteMany({}),
      AgentAction.deleteMany({}),
      Document.deleteMany({}),
      DocumentChunk.deleteMany({}),
      AIAnalysis.deleteMany({}),
    ]);

    console.log("Cleared existing collections.");

    const passwordHash = await bcrypt.hash("password123", 10);

    // =========================================================================
    // 1. Users
    // =========================================================================
    const adminUser = await User.create({
      name: "Sarah Chen",
      email: "admin@clubops.org",
      passwordHash,
      role: "admin",
      skills: ["Leadership", "Budgeting", "Operations", "Sponsorship"],
      availability: "available",
    });

    const organizerUser = await User.create({
      name: "Krish Patel",
      email: "organizer@clubops.org",
      passwordHash,
      role: "organizer",
      skills: ["Event Planning", "Logistics", "Marketing", "Technical AV"],
      availability: "available",
    });

    const rahulUser = await User.create({
      name: "Rahul Patel",
      email: "rahul@clubops.org",
      passwordHash,
      role: "organizer",
      skills: ["Operations Lead", "Hackathon Logistics", "Volunteer Coordination"],
      availability: "available",
    });

    const volunteer1 = await User.create({
      name: "Maya Lin",
      email: "maya@clubops.org",
      passwordHash,
      role: "member",
      skills: ["Audio/Visual", "Stage Setup", "Photography", "Live Streaming"],
      availability: "available",
    });

    const volunteer2 = await User.create({
      name: "Alex Rivera",
      email: "alex@clubops.org",
      passwordHash,
      role: "member",
      skills: ["Sponsorship", "Social Media", "Graphic Design", "Merchandise"],
      availability: "busy",
    });

    const volunteer3 = await User.create({
      name: "Samira Khan",
      email: "samira@clubops.org",
      passwordHash,
      role: "member",
      skills: ["Registration", "Guest Management", "First Aid", "Catering"],
      availability: "available",
    });

    const volunteer4 = await User.create({
      name: "David Kim",
      email: "david@clubops.org",
      passwordHash,
      role: "member",
      skills: ["Networking", "Hardware Troubleshooting", "Lab Safety"],
      availability: "available",
    });

    console.log("Created 7 users (Admin, 2 Organizers, 4 Members).");

    // =========================================================================
    // 2. Club
    // =========================================================================
    const club = await Club.create({
      name: "Tech & Innovation Society",
      description: "Premier university club driving hands-on technology workshops, hackathons, and symposiums.",
      adminId: adminUser._id,
      organizers: [organizerUser._id, rahulUser._id],
      members: [
        adminUser._id,
        organizerUser._id,
        rahulUser._id,
        volunteer1._id,
        volunteer2._id,
        volunteer3._id,
        volunteer4._id,
      ],
    });

    // Update users with clubId
    await User.updateMany({}, { clubId: club._id });
    console.log("Created club: Tech & Innovation Society.");

    // =========================================================================
    // 3. Events
    // =========================================================================
    const now = new Date();
    const futureDate1 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const futureDate2 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const pastDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

    const event1 = await Event.create({
      clubId: club._id,
      name: "AI Hackathon 2026",
      description: "48-hour university-wide hackathon focusing on autonomous agents, generative AI, and sustainable tech.",
      venue: "Grand Campus Hall, Building B",
      startDate: futureDate1,
      endDate: new Date(futureDate1.getTime() + 2 * 24 * 60 * 60 * 1000),
      status: "planning",
      expectedParticipants: 250,
      expectedVolunteers: 20,
      createdBy: organizerUser._id,
    });

    const event2 = await Event.create({
      clubId: club._id,
      name: "Annual Robotics Symposium",
      description: "Keynote talks, live robotic demonstrations, and engineering networking mixer.",
      venue: "Auditorium West, Innovation Center",
      startDate: futureDate2,
      endDate: new Date(futureDate2.getTime() + 1 * 24 * 60 * 60 * 1000),
      status: "ongoing",
      expectedParticipants: 180,
      expectedVolunteers: 15,
      createdBy: organizerUser._id,
    });

    const event3 = await Event.create({
      clubId: club._id,
      name: "Campus Open Source Showcase",
      description: "Student lightning demos showcasing open-source contributions and community software projects.",
      venue: "Student Union Lounge",
      startDate: pastDate,
      endDate: new Date(pastDate.getTime() + 4 * 60 * 60 * 1000),
      status: "completed",
      expectedParticipants: 95,
      expectedVolunteers: 8,
      createdBy: adminUser._id,
    });

    console.log("Created 3 events.");

    // =========================================================================
    // 4. Tasks for Event 1
    // =========================================================================
    const task1 = await Task.create({
      eventId: event1._id,
      title: "Secure Auditorium AV & Live Streaming Setup",
      description: "Coordinate with campus IT to reserve 4 lapel microphones, main projector, and high-speed streaming uplink.",
      assignedTo: volunteer1._id,
      createdBy: organizerUser._id,
      priority: "high",
      status: "in_progress",
      deadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      source: "manual",
    });

    const task2 = await Task.create({
      eventId: event1._id,
      title: "Distribute Sponsor Branding & Swag Kits",
      description: "Finalize t-shirt prints, lanyard badges, and participant welcome packages with printing vendor.",
      assignedTo: volunteer2._id,
      createdBy: organizerUser._id,
      priority: "medium",
      status: "pending",
      deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      source: "manual",
    });

    const task3 = await Task.create({
      eventId: event1._id,
      title: "Confirm Catering & Dietary Accommodations",
      description: "Verify lunch and midnight snack orders for 250 hackers including vegan and gluten-free dietary menus.",
      assignedTo: volunteer3._id,
      createdBy: organizerUser._id,
      priority: "critical",
      status: "pending",
      deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      source: "manual",
    });

    const task4 = await Task.create({
      eventId: event1._id,
      title: "Deploy Dedicated High-Concurrency Wi-Fi Access Points",
      description: "Install 4 temporary high-throughput Wi-Fi mesh routers across Building B floors 1 and 2.",
      assignedTo: volunteer4._id,
      createdBy: organizerUser._id,
      priority: "high",
      status: "in_progress",
      deadline: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      source: "ai_agent",
    });

    const task5 = await Task.create({
      eventId: event1._id,
      title: "Publish Mentor & Judge Schedules",
      description: "Send calendar invites to 12 industry mentors and 4 judging panel members.",
      assignedTo: organizerUser._id,
      createdBy: adminUser._id,
      priority: "low",
      status: "completed",
      deadline: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      source: "manual",
    });

    console.log("Created 5 event tasks.");

    // =========================================================================
    // 5. Risks for Event 1
    // =========================================================================
    await Risk.create({
      eventId: event1._id,
      title: "Wi-Fi Bandwidth Saturation during Opening Ceremonies",
      description: "High concurrency of 250+ laptops and streaming traffic may overwhelm the Building B access point.",
      severity: "high",
      probability: "high",
      status: "open",
      detectedBy: "ai",
      recommendedAction: "Request campus networking team to deploy temporary secondary Wi-Fi mesh nodes.",
      assignedTo: volunteer4._id,
    });

    await Risk.create({
      eventId: event1._id,
      title: "Potential Delay in T-Shirt Delivery",
      description: "Vendor warehouse reported supply chain backlog; delivery estimate is 24 hours prior to launch.",
      severity: "medium",
      probability: "medium",
      status: "investigating",
      detectedBy: "manual",
      recommendedAction: "Have backup distribution plan or distribute badges first, swag during closing ceremony.",
      assignedTo: volunteer2._id,
    });

    await Risk.create({
      eventId: event1._id,
      title: "Audio Feedback in Overflow Seating Room",
      description: "Auxiliary speaker cabling in room 102 had intermittent connection during last semester's rehearsal.",
      severity: "low",
      probability: "low",
      status: "resolved",
      detectedBy: "manual",
      recommendedAction: "Replaced faulty XLR audio cables with shielded cords.",
      assignedTo: volunteer1._id,
    });

    await Risk.create({
      eventId: event1._id,
      title: "Power Circuit Overload in Prototyping Hardware Lab",
      description: "Simultaneous soldering stations and 3D printers could trip the 15A lab circuit breaker.",
      severity: "critical",
      probability: "medium",
      status: "open",
      detectedBy: "ai",
      recommendedAction: "Distribute heavy power loads across isolated circuit outlets and request a 30A industrial surge box.",
      assignedTo: organizerUser._id,
    });

    console.log("Created 4 risks.");

    // =========================================================================
    // 6. Volunteers for Event 1
    // =========================================================================
    await Volunteer.create({
      eventId: event1._id,
      userId: volunteer1._id,
      team: "Technical Operations",
      skills: volunteer1.skills,
      availability: "available",
      assignedTasks: [task1._id],
    });

    await Volunteer.create({
      eventId: event1._id,
      userId: volunteer2._id,
      team: "Partnerships & Media",
      skills: volunteer2.skills,
      availability: "busy",
      assignedTasks: [task2._id],
    });

    await Volunteer.create({
      eventId: event1._id,
      userId: volunteer3._id,
      team: "Logistics & Hospitality",
      skills: volunteer3.skills,
      availability: "available",
      assignedTasks: [task3._id],
    });

    await Volunteer.create({
      eventId: event1._id,
      userId: volunteer4._id,
      team: "Infrastructure & Network",
      skills: volunteer4.skills,
      availability: "available",
      assignedTasks: [task4._id],
    });

    console.log("Created 4 event volunteers.");

    // =========================================================================
    // 7. Documents & RAG Ingestion for Event 1
    // =========================================================================
    const doc1Content = `
AUDITORIUM SAFETY AND VENUE GUIDELINES 2026
Institution: Tech & Innovation Society | Venue: Grand Campus Hall, Building B

1. OCCUPANCY AND VENUE REGULATIONS
- The maximum auditorium occupancy is strictly limited to 300 seated persons at any time.
- Overnight building access is permitted from Friday 6:00 PM through Sunday 4:00 PM under campus permit #2026-B9.
- Quiet hours and noise curfews commence strictly at 11:00 PM each night. Amplified music and loudspeaker announcements must cease after 11:00 PM.

2. FIRE SAFETY AND EMERGENCY PROTOCOLS
- Emergency exit doors, illuminated exit signs, and fire extinguisher stations must remain completely unobstructed at all times.
- No equipment, registration tables, banners, or power cables may be placed in primary hallway egress routes.
- In case of fire alarm sounding, all participants and volunteers must immediately evacuate through Exit 1A and assemble at Assembly Point B (North Quad Lawn).
- First aid kits are stationed at the main Registration Desk and in Room 104 with certified student responders.

3. ELECTRICAL AND HARDWARE PROTOCOLS
- All extension cords and power distribution strips must be industrial surge-protected. Daisy-chaining power strips is strictly forbidden.
- Soldering and high-draw hardware testing are restricted exclusively to the designated Prototyping Hardware Lab (Room 112).
- Food and open beverage containers are strictly prohibited within 10 feet of the stage audio-visual mixing console.

4. CAMPUS SECURITY CONTACTS
- 24/7 Campus Public Safety Dispatch: extension 4400 or (555) 019-4400.
- Operations Lead Krish Patel: extension 2104.
    `.trim();

    const doc2Content = `
AI HACKATHON 2026 OFFICIAL RULES AND SUBMISSION GUIDELINES
Tech & Innovation Society | Grand Campus Hall

1. TEAM COMPOSITION & ELIGIBILITY
- Teams must comprise between 2 and 4 registered university participants.
- Cross-disciplinary teams pairing software engineers with design or domain specialists are strongly encouraged.
- All code, models, and presentation assets must be created during the 48-hour event duration. Using pre-existing open-source libraries and public APIs is permitted provided they are declared in the submission README.

2. SUBMISSION DEADLINES AND PLATFORM
- Project submissions close promptly at Sunday 12:00 PM (Noon) on the official Devpost portal.
- Submissions must include: GitHub repository link, 2-minute demonstration video, and description of technical architecture.
- Late submissions will not be eligible for category prizes.

3. JUDGING CRITERIA
- Technical Complexity & Implementation: 30%
- Real-World Impact & Novelty: 30%
- User Experience & UI Polish: 20%
- Live Demo & Pitch Presentation: 20%

4. MENTORSHIP & WORKSHOPS
- Technical mentors will be present in the Innovation Hub between 2:00 PM and 8:00 PM on Saturday.
- Workshop 1: "Agentic Workflows with Gemini 3.6 Flash" at Saturday 10:00 AM in Room 102.
- Workshop 2: "Vector Search and RAG Pipelines" at Saturday 3:00 PM in Room 102.
    `.trim();

    const doc1 = await Document.create({
      clubId: club._id,
      eventId: event1._id,
      title: "Auditorium Safety & Venue Guidelines 2026",
      fileName: "Auditorium_Safety_Guidelines_2026.pdf",
      fileType: "pdf",
      content: doc1Content,
      uploadedBy: organizerUser._id,
      processed: true,
    });

    const doc2 = await Document.create({
      clubId: club._id,
      eventId: event1._id,
      title: "AI Hackathon 2026 Official Rules & Schedule",
      fileName: "Hackathon_Rules_and_Schedule.pdf",
      fileType: "pdf",
      content: doc2Content,
      uploadedBy: adminUser._id,
      processed: true,
    });

    console.log("Created 2 event documents.");

    // Chunk and generate embeddings for RAG
    const docsToEmbed = [
      { doc: doc1, text: doc1Content },
      { doc: doc2, text: doc2Content },
    ];

    let totalEmbeddedChunks = 0;
    for (const item of docsToEmbed) {
      const chunks = chunkText(item.text, 400, 40);
      for (const chunk of chunks) {
        let embedding = [];
        try {
          if (process.env.GEMINI_API_KEY) {
            embedding = await generateEmbedding(chunk.text);
          }
        } catch (embErr) {
          console.warn(`[Seed Embedding] Optional embedding generation warning: ${embErr.message}`);
        }

        await DocumentChunk.create({
          documentId: item.doc._id.toString(),
          clubId: club._id.toString(),
          eventId: event1._id.toString(),
          fileName: item.doc.fileName,
          chunkIndex: chunk.chunkIndex,
          text: chunk.text,
          embedding,
          metadata: {
            title: item.doc.title,
          },
        });
        totalEmbeddedChunks++;
      }
    }
    console.log(`Created ${totalEmbeddedChunks} RAG document chunks for in-process search.`);

    // =========================================================================
    // 8. Meeting & AI Analysis for Event 1
    // =========================================================================
    const meeting1 = await Meeting.create({
      eventId: event1._id,
      title: "Sprint Planning & Risk Assessment Sync",
      date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      participants: [organizerUser._id, volunteer1._id, volunteer2._id, volunteer3._id, volunteer4._id],
      processedByAI: true,
      transcript: `
Sarah (Admin): Let's kick off our sprint planning for the AI Hackathon 2026. Krish, what are our main operational bottlenecks?
Krish (Organizer): Our biggest priority is securing the auditorium AV setup. Maya, can you confirm if campus IT has locked in the equipment?
Maya: I'll test the wireless mics and stage projector on Thursday. We also need to test the backup power strips.
Krish: Great. Next, Alex, how is the swag kits distribution looking?
Alex: The printer confirmed delivery for Wednesday, but there might be a minor delay. I'll follow up with the warehouse tomorrow morning.
Samira: Regarding catering, we have 45 attendees requesting vegan and gluten-free meals. I need the final headcount confirmed by Friday noon.
David: We also need high-capacity mesh Wi-Fi APs so that 250 simultaneous laptops don't saturate the local gateway during the keynote.
Krish: Let's also ensure hardware soldering is restricted to Room 112 to prevent circuit tripping.
Sarah: Sounds great. Let's make sure all action items are assigned with clear deadlines.
      `.trim(),
      summary: "Team reviewed AV preparation, swag kit delivery timelines, dietary catering headcounts, Wi-Fi mesh routing, and lab circuit safety.",
    });

    await AIAnalysis.create({
      meetingId: meeting1._id,
      eventId: event1._id,
      summary: "Comprehensive sprint sync covering AV stage checks, swag kit delivery logistics, dietary accommodations, high-concurrency Wi-Fi deployment, and hardware lab circuit safety.",
      tasks: [
        {
          title: "Test wireless lapel microphones and stage projector",
          ownerId: volunteer1._id,
          deadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
          priority: "high",
        },
        {
          title: "Follow up with swag kit vendor regarding shipment tracking",
          ownerId: volunteer2._id,
          deadline: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
          priority: "medium",
        },
        {
          title: "Lock in vegan and gluten-free catering order headcounts",
          ownerId: volunteer3._id,
          deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
          priority: "critical",
        },
      ],
      risks: [
        {
          title: "Wi-Fi gateway saturation during keynote streaming",
          severity: "high",
          description: "250+ concurrent attendees may overwhelm single access point bandwidth.",
        },
        {
          title: "Swag kit delivery supply chain delay",
          severity: "medium",
          description: "Vendor tracking indicates possible 24-hour delivery buffer delay.",
        },
      ],
      decisions: [
        "Approved deployment of 4 temporary Wi-Fi mesh access points across Building B.",
        "Restricted all soldering and high-voltage prototyping exclusively to Room 112.",
        "Set strict noise curfew at 11:00 PM for amplified auditorium sound.",
      ],
      actionItems: [
        "Maya to test stage mics by Thursday 3:00 PM.",
        "Alex to inspect delivered badges and lanyards.",
        "Samira to submit final dietary list to catering services by Friday noon.",
        "David to map out power distribution across hardware stations.",
      ],
    });

    console.log("Created meeting log and populated AIAnalysis record.");

    // =========================================================================
    // 9. Notifications
    // =========================================================================
    await Notification.create({
      userId: organizerUser._id,
      eventId: event1._id,
      type: "risk_detected",
      title: "High Risk Detected: Wi-Fi Saturation",
      message: "AI analysis identified network congestion as a high-probability bottleneck during opening ceremony.",
      priority: "high",
      read: false,
    });

    await Notification.create({
      userId: organizerUser._id,
      eventId: event1._id,
      type: "task_assigned",
      title: "New Task: Publish Mentor Schedules",
      message: "Sarah assigned you to finalize and dispatch judge & mentor calendar invitations.",
      priority: "medium",
      read: false,
    });

    await Notification.create({
      userId: organizerUser._id,
      eventId: event1._id,
      type: "announcement",
      title: "Campus Facility Permit Approved",
      message: "Permit #2026-B9 has been granted for Grand Campus Hall overnight access.",
      priority: "low",
      read: true,
    });

    await Notification.create({
      userId: organizerUser._id,
      eventId: event1._id,
      type: "task_deadline",
      title: "Approaching Deadline: Catering Confirmation",
      message: "Catering order for 250 attendees must be submitted within 48 hours.",
      priority: "high",
      read: false,
    });

    console.log("Created 4 notifications.");

    // =========================================================================
    // 10. Agent Actions Log
    // =========================================================================
    await AgentAction.create({
      userId: organizerUser._id,
      eventId: event1._id,
      command: "Assign Maya to test auditorium wireless mics by Thursday 3pm",
      intent: "CREATE_TASK",
      status: "completed",
      tool: "CREATE_TASK",
      parameters: {
        title: "Test auditorium wireless microphones and stage sound",
        assignedTo: volunteer1._id,
        priority: "high",
      },
    });

    await AgentAction.create({
      userId: organizerUser._id,
      eventId: event1._id,
      command: "According to our documents, what are the auditorium venue rules and noise curfew?",
      intent: "QUERY_KNOWLEDGE",
      status: "completed",
      tool: "QUERY_KNOWLEDGE",
      parameters: {
        query: "What are the auditorium venue rules and noise curfew?",
      },
    });

    console.log("Created 2 agent action logs.");

    console.log("\n========================================================");
    console.log("  ClubOps-AI Comprehensive Seed Data Populated!        ");
    console.log("========================================================");
    console.log("Club: Tech & Innovation Society");
    console.log("Events: AI Hackathon 2026, Robotics Symposium, Open Source Showcase");
    console.log("Test Login Credentials (password for all: password123):");
    console.log("  • Admin:      admin@clubops.org");
    console.log("  • Organizer:  organizer@clubops.org");
    console.log("  • Lead:       rahul@clubops.org");
    console.log("  • Member:     maya@clubops.org");
    console.log("========================================================\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
