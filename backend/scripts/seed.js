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

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/clubops";

// Helper date offsets
const now = new Date();
const daysOffset = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

async function seed() {
  try {
    console.log("Connecting to MongoDB:", MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log("Connected to database. Resetting all collections...");

    // 1. Clear all existing data
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
    console.log("✓ Cleared all collections successfully.");

    const passwordHash = await bcrypt.hash("password123", 10);

    // =========================================================================
    // 2. Create ONLY 1 Organizer User
    // =========================================================================
    const organizerUser = await User.create({
      name: "Krish Patel",
      email: "organizer@clubops.org",
      passwordHash,
      role: "organizer",
      skills: ["Event Planning", "Logistics Lead", "Technical Operations", "Budgeting", "Leadership"],
      availability: "available",
    });
    console.log(`✓ Created 1 organizer user: ${organizerUser.name} (${organizerUser.email})`);

    // =========================================================================
    // 3. Create 10 Volunteers
    // =========================================================================
    const volunteerDefs = [
      { name: "Marcus Vance", email: "marcus.vance@clubops.org", team: "AV Operations", skills: ["Audio/Visual", "PA Sound", "Video Streaming"] },
      { name: "Maya Lin", email: "maya.lin@clubops.org", team: "Technical Operations", skills: ["Robot Calibration", "Lab Safety", "Power Circuits"] },
      { name: "David Kim", email: "david.kim@clubops.org", team: "Hardware Support", skills: ["Wi-Fi Repeaters", "Hardware Troubleshooting", "Soldering"] },
      { name: "Elena Rostova", email: "elena.rostova@clubops.org", team: "Guest Logistics", skills: ["Catering Coordination", "Dietary Verification", "Hospitality"] },
      { name: "Chloe Bennett", email: "chloe.bennett@clubops.org", team: "Registration", skills: ["NFC Badges", "Check-in Desk", "Attendee Verification"] },
      { name: "Vikram Sethi", email: "vikram.sethi@clubops.org", team: "Sponsor Relations", skills: ["Booth Setup", "Swag Kits", "Sponsor Liaising"] },
      { name: "Lucas Gray", email: "lucas.gray@clubops.org", team: "Stage Management", skills: ["Speaker Timings", "Microphone Handover", "Lighting"] },
      { name: "Aisha Patel", email: "aisha.patel@clubops.org", team: "Media & PR", skills: ["Photography", "Live Social Updates", "Press Passes"] },
      { name: "Samuel Torres", email: "samuel.torres@clubops.org", team: "Safety & Security", skills: ["Crowd Control", "Fire Safety", "Emergency Access"] },
      { name: "Priya Nair", email: "priya.nair@clubops.org", team: "Mentorship Liaison", skills: ["Judge Coordination", "Rubric Evaluation", "Mentors"] },
    ];

    const volunteerUsers = [];
    for (const v of volunteerDefs) {
      const u = await User.create({
        name: v.name,
        email: v.email,
        passwordHash,
        role: "member",
        skills: v.skills,
        availability: "available",
      });
      volunteerUsers.push({ ...v, userDoc: u });
    }
    console.log(`✓ Created ${volunteerUsers.length} volunteer accounts.`);

    // =========================================================================
    // 4. Create 1 Club
    // =========================================================================
    const club = await Club.create({
      name: "AI & Robotics Society (AIRS)",
      description: "Pioneering intelligent autonomous systems, machine learning research, hardware prototyping, and competitive robotics.",
      adminId: organizerUser._id,
      members: [organizerUser._id, ...volunteerUsers.map((v) => v.userDoc._id)],
    });
    console.log(`✓ Created club: ${club.name}`);

    // =========================================================================
    // 5. Create 3 Events (1 Pending/Planning, 1 Ongoing, 1 Completed)
    // =========================================================================
    const eventPending = await Event.create({
      name: "Autonomous Drone Racing Cup 2026",
      description: "High-speed FPV drone racing tournament inside an enclosed obstacle arena with real-time telemetry.",
      clubId: club._id,
      venue: "Indoor Athletics Pavilion",
      status: "planning", // PENDING
      startDate: daysOffset(20),
      endDate: daysOffset(22),
      expectedParticipants: 180,
      expectedVolunteers: 10,
      createdBy: organizerUser._id,
    });

    const eventOngoing = await Event.create({
      name: "AI Hackathon 2026",
      description: "48-hour university hackathon focused on autonomous agent workflows, local LLMs, and robotics.",
      clubId: club._id,
      venue: "Grand Campus Hall, Building B",
      status: "ongoing", // ONGOING
      startDate: daysOffset(-1),
      endDate: daysOffset(2),
      expectedParticipants: 280,
      expectedVolunteers: 10,
      createdBy: organizerUser._id,
    });

    const eventCompleted = await Event.create({
      name: "Winter Robotics Showcase 2025",
      description: "Annual demonstration of autonomous quadruped robots, arm manipulators, and computer vision projects.",
      clubId: club._id,
      venue: "Engineering Atrium West",
      status: "completed", // COMPLETED
      startDate: daysOffset(-30),
      endDate: daysOffset(-29),
      expectedParticipants: 160,
      expectedVolunteers: 10,
      createdBy: organizerUser._id,
    });

    const allEvents = [eventPending, eventOngoing, eventCompleted];
    console.log(`✓ Created 3 events:`);
    console.log(`   1. [PENDING]   ${eventPending.name}`);
    console.log(`   2. [ONGOING]   ${eventOngoing.name}`);
    console.log(`   3. [COMPLETED] ${eventCompleted.name}`);

    // =========================================================================
    // 6. Link 10 Volunteers to Each of the 3 Events
    // =========================================================================
    const volunteerDocsByEvent = {};

    for (const evt of allEvents) {
      volunteerDocsByEvent[evt._id.toString()] = [];
      for (const v of volunteerUsers) {
        const volDoc = await Volunteer.create({
          eventId: evt._id,
          userId: v.userDoc._id,
          team: v.team,
          skills: v.skills,
          availability: "available",
          assignedTasks: [],
        });
        volunteerDocsByEvent[evt._id.toString()].push({ ...v, volDoc });
      }
    }
    console.log(`✓ Linked 10 volunteers to all 3 events.`);

    // =========================================================================
    // 7. Create Tasks for ALL 3 Events
    // =========================================================================
    const getUserByName = (name) => {
      const found = volunteerUsers.find((v) => v.name.toLowerCase().includes(name.toLowerCase()));
      return found ? found.userDoc : organizerUser;
    };

    const getVolDoc = (eventId, name) => {
      const list = volunteerDocsByEvent[eventId.toString()] || [];
      return list.find((v) => v.name.toLowerCase().includes(name.toLowerCase()))?.volDoc;
    };

    // --- Tasks for Event 1: Autonomous Drone Racing Cup (Pending / Planning) ---
    const pendingTasksDef = [
      {
        title: "Anchor 10-meter protective arena ceiling netting",
        description: "Secure high-strength nylon netting to east and west roof trusses to contain drones within the arena.",
        assigneeName: "Samuel Torres",
        priority: "critical",
        status: "pending",
        deadline: daysOffset(15),
      },
      {
        title: "Equip LiPo battery charging station with fire lockers",
        description: "Install 3 sand buckets and 2 Class-D fire extinguishers in pit lane for safe battery charging.",
        assigneeName: "Maya Lin",
        priority: "high",
        status: "pending",
        deadline: daysOffset(16),
      },
      {
        title: "Calibrate pilot video transponder frequencies on 5.8 GHz",
        description: "Verify all 32 pilot video transmitters are isolated across Raceband channels to avoid live interference.",
        assigneeName: "Lucas Gray",
        priority: "medium",
        status: "pending",
        deadline: daysOffset(18),
      },
      {
        title: "Order pilot participant lanyard passes and safety signage",
        description: "Print colored pilot badges, spotter credentials, and safety caution signs for pit perimeter.",
        assigneeName: "Chloe Bennett",
        priority: "medium",
        status: "pending",
        deadline: daysOffset(17),
      },
    ];

    for (const td of pendingTasksDef) {
      const assignedUser = getUserByName(td.assigneeName);
      const t = await Task.create({
        title: td.title,
        description: td.description,
        eventId: eventPending._id,
        assignedTo: assignedUser._id,
        createdBy: organizerUser._id,
        priority: td.priority,
        status: td.status,
        deadline: td.deadline,
      });
      const vol = getVolDoc(eventPending._id, td.assigneeName);
      if (vol) {
        vol.assignedTasks.push(t._id);
        await vol.save();
      }
    }

    // --- Tasks for Event 2: AI Hackathon 2026 (Ongoing) ---
    const ongoingTasksDef = [
      {
        title: "Setup high-gain Wi-Fi repeater bridge in Hall B",
        description: "Deploy and configure enterprise Wi-Fi repeaters across Hall B to support 280 concurrent developers.",
        assigneeName: "David Kim",
        priority: "critical",
        status: "in_progress",
        deadline: daysOffset(1),
      },
      {
        title: "Test stage PA system, 4 lapel microphones and main projector",
        description: "Perform comprehensive audio frequency sweep and test HDMI color calibration on main auditorium display.",
        assigneeName: "Marcus Vance",
        priority: "high",
        status: "completed",
        deadline: daysOffset(-1),
      },
      {
        title: "Finalize vegan and gluten-free catering boxes delivery timing",
        description: "Confirm hot dinner delivery schedule and dietary labels with university catering services.",
        assigneeName: "Elena Rostova",
        priority: "high",
        status: "in_progress",
        deadline: daysOffset(1),
      },
      {
        title: "Distribute NFC attendee badges and welcome kits at check-in",
        description: "Scan attendee QR codes, verify government IDs, and hand out lanyards and stickers at front desk.",
        assigneeName: "Chloe Bennett",
        priority: "medium",
        status: "in_progress",
        deadline: daysOffset(0),
      },
      {
        title: "Coordinate sponsor booth setup and power strips with NVIDIA team",
        description: "Assist visiting engineers with table setup, 220V power extensions, and demonstration displays.",
        assigneeName: "Vikram Sethi",
        priority: "medium",
        status: "pending",
        deadline: daysOffset(1),
      },
    ];

    for (const td of ongoingTasksDef) {
      const assignedUser = getUserByName(td.assigneeName);
      const t = await Task.create({
        title: td.title,
        description: td.description,
        eventId: eventOngoing._id,
        assignedTo: assignedUser._id,
        createdBy: organizerUser._id,
        priority: td.priority,
        status: td.status,
        deadline: td.deadline,
      });
      const vol = getVolDoc(eventOngoing._id, td.assigneeName);
      if (vol) {
        vol.assignedTasks.push(t._id);
        await vol.save();
      }
    }

    // --- Tasks for Event 3: Winter Robotics Showcase 2025 (Completed) ---
    const completedTasksDef = [
      {
        title: "Archive all raw 4K stream footage and demo videos to NAS",
        description: "Collect SD cards from 3 camera operators and upload 120GB raw video to department archive storage.",
        assigneeName: "Aisha Patel",
        priority: "high",
        status: "completed",
        deadline: daysOffset(-25),
      },
      {
        title: "Submit finalized expense receipts and equipment inventory report",
        description: "Reconcile vendor invoices and submit final financial audit to student union finance office.",
        assigneeName: "Vikram Sethi",
        priority: "high",
        status: "completed",
        deadline: daysOffset(-22),
      },
      {
        title: "Send thank-you letters and digital certificates to industry judges",
        description: "Email personalized appreciation letters and digital credential badges to all 8 visiting judges.",
        assigneeName: "Priya Nair",
        priority: "medium",
        status: "completed",
        deadline: daysOffset(-20),
      },
      {
        title: "Inspect and pack display easels and stage spotlights for vendor return",
        description: "Audit rented stage lighting equipment for zero physical damage and obtain return receipt.",
        assigneeName: "Samuel Torres",
        priority: "medium",
        status: "completed",
        deadline: daysOffset(-26),
      },
    ];

    for (const td of completedTasksDef) {
      const assignedUser = getUserByName(td.assigneeName);
      const t = await Task.create({
        title: td.title,
        description: td.description,
        eventId: eventCompleted._id,
        assignedTo: assignedUser._id,
        createdBy: organizerUser._id,
        priority: td.priority,
        status: td.status,
        deadline: td.deadline,
      });
      const vol = getVolDoc(eventCompleted._id, td.assigneeName);
      if (vol) {
        vol.assignedTasks.push(t._id);
        await vol.save();
      }
    }

    console.log(`✓ Created tasks for all 3 events (4 pending, 5 ongoing, 4 completed).`);

    // =========================================================================
    // 8. Create Operational Risks across Events
    // =========================================================================
    // Ongoing Event Risks
    await Risk.create({
      title: "Unsigned Catering Contract",
      description: "Pending vendor signature could delay hot dinner delivery for 280 hackers.",
      eventId: eventOngoing._id,
      severity: "high",
      probability: "medium",
      status: "open",
      assignedTo: organizerUser._id,
      recommendedAction: "Escalate to university procurement officer by Thursday 4 PM.",
    });

    await Risk.create({
      title: "Wi-Fi Congestion in Hall B",
      description: "Heavy streaming traffic may cause network latency drops during live sponsor demonstrations.",
      eventId: eventOngoing._id,
      severity: "medium",
      probability: "high",
      status: "open",
      assignedTo: getUserByName("David Kim")._id,
      recommendedAction: "Configure high-gain repeater bridge with dedicated 5GHz channel isolation.",
    });

    await Risk.create({
      title: "Keynote Stage Power Circuit Overload",
      description: "Concurrent stage lighting and 4K video transmitters may exceed 15A wall breaker capacity.",
      eventId: eventOngoing._id,
      severity: "high",
      probability: "medium",
      status: "open",
      assignedTo: getUserByName("Marcus Vance")._id,
      recommendedAction: "Run dedicated 3-phase power extension from main distribution panel in Room 104.",
    });

    await Risk.create({
      title: "Overnight Security Corridor Access Restriction",
      description: "Campus facilities locks side building gates at 11:00 PM, preventing hackathon attendee re-entry.",
      eventId: eventOngoing._id,
      severity: "medium",
      probability: "medium",
      status: "open",
      assignedTo: getUserByName("Samuel Torres")._id,
      recommendedAction: "Issue 24-hour electronic keycard badges to volunteer security leads.",
    });

    // Pending Event Risks
    await Risk.create({
      title: "LiPo Battery Thermal Runaway Hazard",
      description: "High-discharge drone batteries risk fire if charged rapidly without supervision.",
      eventId: eventPending._id,
      severity: "critical",
      probability: "low",
      status: "open",
      assignedTo: getUserByName("Samuel Torres")._id,
      recommendedAction: "Mandate fire-safe charging bags and station Class-D extinguishers in pit lane.",
    });

    await Risk.create({
      title: "Arena Protective Netting Deflection Risk",
      description: "High-speed 120km/h drones may deflect safety netting into spectator viewing barrier.",
      eventId: eventPending._id,
      severity: "high",
      probability: "low",
      status: "open",
      assignedTo: getUserByName("Maya Lin")._id,
      recommendedAction: "Enforce 2-meter safety standoff distance between net perimeter and spectator railing.",
    });

    await Risk.create({
      title: "FPV Video Transmitter 5.8GHz Spectrum Jamming",
      description: "Unregistered analog video transmitters broadcasting on adjacent race channels may black out pilot goggles.",
      eventId: eventPending._id,
      severity: "medium",
      probability: "high",
      status: "open",
      assignedTo: getUserByName("Lucas Gray")._id,
      recommendedAction: "Mandate hardware check-in with calibrated RF spectrum analyzer before flight heats.",
    });

    // Completed Event Risks (Resolved)
    await Risk.create({
      title: "Quadruped Robot Transport Crating Damage",
      description: "Rented quadruped robot crate showed structural hinge wear prior to transport.",
      eventId: eventCompleted._id,
      severity: "medium",
      probability: "low",
      status: "resolved",
      assignedTo: getUserByName("Aisha Patel")._id,
      recommendedAction: "Secured replacement flight cases with vendor before exhibition load-in.",
    });

    console.log(`✓ Created 8 operational risks across all events.`);

    // =========================================================================
    // 9. Create Meetings across Events (Completed with AI Analysis + Pending)
    // =========================================================================
    const allParticipants = [organizerUser._id, ...volunteerUsers.map((v) => v.userDoc._id)];

    // --- EVENT 2 (ONGOING): Meeting 1 (Completed with AI Analysis) ---
    const meeting1Transcript = `Krish: Welcome everyone to the AI Hackathon operations sync.
Marcus Vance: I have confirmed the 4 lapel microphones and main projector. We will test the stage PA system by Friday 2 PM.
Elena Rostova: I reviewed the catering numbers. We need to finalize the vegan and gluten-free dietary boxes by Thursday evening.
David Kim: The campus Wi-Fi repeaters arrived. I will set up the repeater bridge in Hall B before Saturday morning.
Krish: Risk check: The main catering contract is still awaiting signature. We must sign before Friday to avoid delay penalties.
Chloe Bennett: 300 NFC attendee badges and welcome lanyards will arrive from the print shop by Thursday 10 AM.`;

    const meeting1 = await Meeting.create({
      title: "Sprint Planning & Risk Assessment Sync",
      eventId: eventOngoing._id,
      date: daysOffset(-1),
      processedByAI: true,
      participants: allParticipants,
      transcript: meeting1Transcript,
      summary: "Core alignment on main stage audio, high-gain Wi-Fi repeaters, sponsor swag distribution, and catering contract verification.",
    });

    await AIAnalysis.create({
      meetingId: meeting1._id,
      eventId: eventOngoing._id,
      summary: "The committee finalized key AV checks, Wi-Fi infrastructure deployment, and registration badge deliveries for the upcoming hackathon. Identified an urgent liability regarding unsigned catering contracts.",
      decisions: [
        "Stage sound and projector calibration locked for Friday 2:00 PM",
        "NFC attendee badges scheduled for distribution Thursday 10:00 AM",
        "Hall B Wi-Fi repeater bridge to be installed prior to Saturday morning hackathon kickoff"
      ],
      tasks: [
        { title: "Test stage PA system and projectors", ownerId: getUserByName("Marcus Vance")._id, priority: "high", deadline: daysOffset(1) },
        { title: "Verify dietary boxes with catering", ownerId: getUserByName("Elena Rostova")._id, priority: "high", deadline: daysOffset(2) },
        { title: "Setup high-gain Wi-Fi repeater bridge in Hall B", ownerId: getUserByName("David Kim")._id, priority: "high", deadline: daysOffset(3) }
      ],
      risks: [
        { title: "Unsigned Catering Contract", severity: "high", description: "Pending contract could delay hot meal delivery for 280 hackers." },
        { title: "Wi-Fi Congestion in Hall B", severity: "medium", description: "Heavy streaming traffic may cause network drops during live demos." }
      ]
    });

    // --- EVENT 1 (PENDING): Meeting 2 (Completed with AI Analysis) ---
    const meeting2Transcript = `Krish: Let's inspect the safety perimeter for the Autonomous Drone Racing Cup.
Maya Lin: The 10-meter ceiling netting is delivered. We need Lucas Gray and Samuel Torres to secure the anchors along the east truss by Tuesday.
Samuel Torres: I inspected the LiPo battery charging station. We must install 3 sand buckets and 2 Class-D fire extinguishers in the pit lane.
Lucas Gray: I will verify pilot registration and drone transponder frequencies on 5.8 GHz.
Krish: Decision: No drone is permitted to arm motors without a verified fail-safe kill switch test.`;

    const meeting2 = await Meeting.create({
      title: "Arena Safety Perimeter & Netting Review",
      eventId: eventPending._id,
      date: daysOffset(0),
      processedByAI: true,
      participants: allParticipants,
      transcript: meeting2Transcript,
      summary: "Inspection of ceiling nets, pit crew safety zones, and battery charging fire lockers for the Drone Racing Cup.",
    });

    await AIAnalysis.create({
      meetingId: meeting2._id,
      eventId: eventPending._id,
      summary: "Evaluated structural netting anchor points and LiPo battery storage in pit lanes. Established strict motor arming safety protocols requiring radio fail-safe verification.",
      decisions: [
        "LiPo battery charging restricted exclusively to designated fire-safe lockers",
        "Mandatory fail-safe kill switch test required before every race heat"
      ],
      tasks: [
        { title: "Anchor 10-meter protective arena ceiling netting", ownerId: getUserByName("Samuel Torres")._id, priority: "critical", deadline: daysOffset(5) },
        { title: "Equip LiPo battery charging station with fire lockers", ownerId: getUserByName("Maya Lin")._id, priority: "high", deadline: daysOffset(4) },
        { title: "Calibrate pilot video transponder frequencies on 5.8 GHz", ownerId: getUserByName("Lucas Gray")._id, priority: "medium", deadline: daysOffset(6) }
      ],
      risks: [
        { title: "LiPo Battery Thermal Runaway Hazard", severity: "critical", description: "High-discharge drone batteries risk fire if charged improperly without supervision." }
      ]
    });

    // --- EVENT 2 (ONGOING): Meeting 3 (Pending Live Testing) ---
    const meeting3Transcript = `Krish: Team, let's run our final tech check before the keynote doors open tomorrow morning.
Marcus Vance: The wireless lapel mic frequency interference check passed. Battery packs are fully charged for 12 hours of stage presentations.
Vikram Sethi: Premier sponsors Google and NVIDIA have delivered their stage banners. We need Aisha Patel to photograph the backdrop before attendees arrive.
Aisha Patel: I will arrive at 8:00 AM sharp to capture high-res sponsor photos and set up the live YouTube broadcast stream.
David Kim: The backup fiber ethernet line in Hall B is active. Latency to Cloudflare edge is under 4 milliseconds.
Krish: Excellent. Decision: The keynote stage locks at 9:00 AM for live rehearsals. Everyone please ensure badges are worn at all times.`;

    const meeting3 = await Meeting.create({
      title: "Final Stage AV & Sponsor Keynote Tech Check",
      eventId: eventOngoing._id,
      date: daysOffset(1),
      processedByAI: false, // PENDING LIVE AI ANALYSIS
      participants: allParticipants,
      transcript: meeting3Transcript,
      summary: "Final pre-flight check for keynote audio, live streaming cameras, backup fiber ethernet, and sponsor branding.",
    });

    // --- EVENT 1 (PENDING): Meeting 4 (Pending Live Testing) ---
    const meeting4Transcript = `Krish: Opening meeting for Drone Pilot Transponder registration.
Lucas Gray: We have 28 pilots confirmed. Each pilot will receive a dedicated 5.8 GHz analog channel.
Maya Lin: Pit tables are numbered from 1 to 32. Battery charging station will open at 8:30 AM.
Chloe Bennett: Pilots must sign the liability waiver before receiving transmitter frequency tags.
Krish: Decision: Pilot briefing starts at 9:15 AM sharp in the main pavilion.`;

    const meeting4 = await Meeting.create({
      title: "FPV Pilot Transponder & Frequency Allocation Sync",
      eventId: eventPending._id,
      date: daysOffset(3),
      processedByAI: false, // PENDING LIVE AI ANALYSIS
      participants: allParticipants,
      transcript: meeting4Transcript,
      summary: "Coordination of pilot frequency bands, transmitter safety tags, and pit lane power allocation.",
    });

    // --- EVENT 3 (COMPLETED): Meeting 5 (Completed with AI Analysis) ---
    const meeting5Transcript = `Krish: Welcome to the post-event retrospective for Winter Robotics Showcase 2025.
Aisha Patel: All 4K stream recordings and keynote videos have been safely archived to the university media NAS. Total storage footprint is 118 GB.
Vikram Sethi: We audited all vendor invoices for audio rental and stage spotlights. Total expenses came in 5% under allocated budget.
Priya Nair: Judges submitted high praise for student robot manipulators. 8 industry certificates have been dispatched via email.
Samuel Torres: All display easels and stage lighting have been inspected with zero physical damage. Vendor deposit has been refunded in full.
Krish: Decision: Showcase archive closed with zero outstanding liabilities. Commendation to all volunteers.`;

    const meeting5 = await Meeting.create({
      title: "Post-Event Retrospective & Budget Reconciliation",
      eventId: eventCompleted._id,
      date: daysOffset(-25),
      processedByAI: true,
      participants: allParticipants,
      transcript: meeting5Transcript,
      summary: "Financial debrief, equipment return audit, and media archiving following the successful Winter Robotics Showcase.",
    });

    await AIAnalysis.create({
      meetingId: meeting5._id,
      eventId: eventCompleted._id,
      summary: "Completed financial reconciliation with 5% budget surplus, successfully archived 118 GB of 4K footage to NAS, and confirmed 100% equipment return with zero damage.",
      decisions: [
        "Archived all raw 4K stream footage and keynote video to NAS storage",
        "Approved surplus budget rollover to upcoming spring hackathon hardware fund",
        "Officially closed exhibition register with full refund of venue deposit"
      ],
      tasks: [
        { title: "Publish showcase highlight reel to club YouTube channel", ownerId: getUserByName("Aisha Patel")._id, priority: "medium", deadline: daysOffset(-20) },
        { title: "Submit finalized financial reconciliation to student council", ownerId: getUserByName("Vikram Sethi")._id, priority: "high", deadline: daysOffset(-18) }
      ],
      risks: []
    });

    console.log(`✓ Created 5 meetings across all 3 events (3 completed with AI analysis, 2 pending live analysis).`);

    // =========================================================================
    // 10. Upload 3 Documents of Transcripts + 1 Policy Document (with RAG Chunks)
    // =========================================================================

    // Document 1: Hackathon Sprint Planning Transcript
    const doc1 = await Document.create({
      clubId: club._id,
      eventId: eventOngoing._id,
      title: "Meeting Transcript — Sprint Planning & Operations Sync",
      fileName: "Sprint_Planning_Operations_Sync_Transcript.txt",
      fileType: "txt",
      content: meeting1Transcript,
      processed: true,
      uploadedBy: organizerUser._id,
    });

    await DocumentChunk.create([
      {
        documentId: doc1._id,
        clubId: club._id,
        eventId: eventOngoing._id,
        fileName: doc1.fileName,
        chunkIndex: 0,
        text: `TRANSCRIPT - SPRINT PLANNING & RISK ASSESSMENT SYNC (AI Hackathon 2026)\n\n${meeting1Transcript}\n\nKey Decisions: Stage sound check scheduled for Friday 2 PM. NFC badges to arrive Thursday 10 AM. Wi-Fi repeaters to be deployed in Hall B by Saturday morning.`,
        metadata: { title: doc1.title },
      },
      {
        documentId: doc1._id,
        clubId: club._id,
        eventId: eventOngoing._id,
        fileName: doc1.fileName,
        chunkIndex: 1,
        text: `OPERATIONAL ACTIONS FROM SPRINT SYNC:\n- Test stage PA system and 4 lapel microphones: Marcus Vance (High Priority)\n- Verify dietary vegan and gluten-free meals with catering: Elena Rostova (High Priority)\n- Deploy high-gain Wi-Fi repeater bridge in Hall B: David Kim (Critical Priority)\n- Flagged Risk: Unsigned Catering Contract awaiting procurement approval.`,
        metadata: { title: doc1.title },
      },
    ]);

    // Document 2: Drone Racing Arena Safety Transcript
    const doc2 = await Document.create({
      clubId: club._id,
      eventId: eventPending._id,
      title: "Meeting Transcript — Drone Arena Safety & Netting Briefing",
      fileName: "Drone_Arena_Safety_and_Netting_Transcript.txt",
      fileType: "txt",
      content: meeting2Transcript,
      processed: true,
      uploadedBy: organizerUser._id,
    });

    await DocumentChunk.create([
      {
        documentId: doc2._id,
        clubId: club._id,
        eventId: eventPending._id,
        fileName: doc2.fileName,
        chunkIndex: 0,
        text: `TRANSCRIPT - ARENA SAFETY PERIMETER & NETTING INSPECTION (Drone Racing Cup 2026)\n\n${meeting2Transcript}\n\nKey Safety Rules: 10-meter ceiling netting anchored to east truss. LiPo battery charging restricted exclusively to fire-safe lockers with sand buckets and Class-D extinguishers.`,
        metadata: { title: doc2.title },
      },
      {
        documentId: doc2._id,
        clubId: club._id,
        eventId: eventPending._id,
        fileName: doc2.fileName,
        chunkIndex: 1,
        text: `DRONE RACE SAFETY DECISIONS:\n- Mandatory radio fail-safe kill switch test required before any drone can arm motors.\n- 5.8 GHz video transponder frequencies must be verified across Raceband channels.\n- Safety leads: Samuel Torres (Ceiling Netting Anchor) and Maya Lin (LiPo Charging Fire Station).`,
        metadata: { title: doc2.title },
      },
    ]);

    // Document 3: Keynote AV Tech Check Transcript
    const doc3 = await Document.create({
      clubId: club._id,
      eventId: eventOngoing._id,
      title: "Meeting Transcript — Final Stage AV & Keynote Tech Check",
      fileName: "Stage_AV_and_Keynote_Tech_Check_Transcript.txt",
      fileType: "txt",
      content: meeting3Transcript,
      processed: true,
      uploadedBy: organizerUser._id,
    });

    await DocumentChunk.create([
      {
        documentId: doc3._id,
        clubId: club._id,
        eventId: eventOngoing._id,
        fileName: doc3.fileName,
        chunkIndex: 0,
        text: `TRANSCRIPT - FINAL STAGE AV & SPONSOR KEYNOTE TECH CHECK (AI Hackathon 2026)\n\n${meeting3Transcript}\n\nTechnical Details: Wireless lapel mics confirmed interference-free for 12 hours. Backup fiber ethernet in Hall B running with 4ms latency to Cloudflare edge.`,
        metadata: { title: doc3.title },
      },
      {
        documentId: doc3._id,
        clubId: club._id,
        eventId: eventOngoing._id,
        fileName: doc3.fileName,
        chunkIndex: 1,
        text: `KEYNOTE STAGE PROTOCOLS:\n- Keynote stage locks at 9:00 AM for speaker rehearsals.\n- Sponsor banners from Google and NVIDIA must be photographed by Aisha Patel by 8:00 AM.\n- All volunteers and committee members must visibly wear NFC credential badges.`,
        metadata: { title: doc3.title },
      },
    ]);

    // Document 4: Venue Safety Guidelines PDF
    const doc4 = await Document.create({
      clubId: club._id,
      eventId: eventOngoing._id,
      title: "Venue Safety and Operations Guidelines 2026",
      fileName: "Venue_Safety_and_Operations_Guidelines_2026.pdf",
      fileType: "pdf",
      processed: true,
      uploadedBy: organizerUser._id,
    });

    await DocumentChunk.create([
      {
        documentId: doc4._id,
        clubId: club._id,
        eventId: eventOngoing._id,
        fileName: doc4.fileName,
        chunkIndex: 0,
        text: "Grand Campus Hall Building B Operations Policy: All electrical cables crossing pedestrian walkways must be covered with rubber cable ramps. Main stage sound levels must remain strictly below 85 decibels after 10:00 PM per campus noise curfew regulations. Emergency exit doors must remain unobstructed by tables or displays at all times.",
        metadata: { title: doc4.title },
      },
      {
        documentId: doc4._id,
        clubId: club._id,
        eventId: eventOngoing._id,
        fileName: doc4.fileName,
        chunkIndex: 1,
        text: "Catering & Dietary Compliance: Hot food catering deliveries must be inspected for temperature compliance upon arrival. Vegan, vegetarian, halal, and gluten-free meals must be labeled and separated at the serving tables. Food waste must be disposed of in compost bins located outside the service entrance.",
        metadata: { title: doc4.title },
      },
    ]);

    console.log(`✓ Uploaded 3 meeting transcript documents + 1 policy document with indexed RAG chunks.`);

    console.log("\n==========================================================");
    console.log("             SEED DATA GENERATION COMPLETE                ");
    console.log("==========================================================");
    console.log(`Users Created:        1 Organizer (${organizerUser.email})`);
    console.log(`Volunteers Created:   10 Volunteers (each with unique accounts)`);
    console.log(`Events Created:       3 Events (1 pending, 1 ongoing, 1 completed)`);
    console.log(`Tasks Created:        13 Tasks across all 3 events`);
    console.log(`Meetings Created:     3 Meetings (2 completed with AI analysis, 1 pending)`);
    console.log(`Default Password:     password123`);
    console.log("==========================================================\n");

    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seed();
