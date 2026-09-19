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

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/clubops";

async function seed() {
  try {
    console.log("Connecting to MongoDB:", MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log("Connected to database. Seeding data...");

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
    ]);

    console.log("Cleared existing collections.");

    const passwordHash = await bcrypt.hash("password123", 10);

    // 1. Create Users
    const adminUser = await User.create({
      name: "Sarah Chen",
      email: "admin@clubops.org",
      passwordHash,
      role: "admin",
      skills: ["Leadership", "Budgeting", "Operations"],
      availability: "available",
    });

    const organizerUser = await User.create({
      name: "Krish Patel",
      email: "organizer@clubops.org",
      passwordHash,
      role: "organizer",
      skills: ["Event Planning", "Logistics", "Marketing"],
      availability: "available",
    });

    const rahulUser = await User.create({
      name: "Rahul Patel",
      email: "rahul@clubops.org",
      passwordHash,
      role: "organizer",
      skills: ["Operations Lead", "Hackathon Logistics"],
      availability: "available",
    });

    const volunteer1 = await User.create({
      name: "Maya Lin",
      email: "maya@clubops.org",
      passwordHash,
      role: "member",
      skills: ["Audio/Visual", "Stage Setup", "Photography"],
      availability: "available",
    });

    const volunteer2 = await User.create({
      name: "Alex Rivera",
      email: "alex@clubops.org",
      passwordHash,
      role: "member",
      skills: ["Sponsorship", "Social Media", "Graphic Design"],
      availability: "busy",
    });

    const volunteer3 = await User.create({
      name: "Samira Khan",
      email: "samira@clubops.org",
      passwordHash,
      role: "member",
      skills: ["Registration", "Guest Management", "First Aid"],
      availability: "available",
    });

    console.log("Created 5 test users.");

    // 2. Create Club
    const club = await Club.create({
      name: "Tech & Innovation Society",
      description: "Premier university club driving hands-on technology workshops, hackathons, and symposiums.",
      adminId: adminUser._id,
      members: [adminUser._id, organizerUser._id, rahulUser._id, volunteer1._id, volunteer2._id, volunteer3._id],
    });

    // Update users with clubId
    await User.updateMany({}, { clubId: club._id });
    console.log("Created club: Tech & Innovation Society.");

    // 3. Create Events
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

    // 4. Create Tasks for Event 1
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
      title: "Publish Mentor & Judge Schedules",
      description: "Send calendar invites to 12 industry mentors and 4 judging panel members.",
      assignedTo: organizerUser._id,
      createdBy: adminUser._id,
      priority: "low",
      status: "completed",
      deadline: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      source: "manual",
    });

    console.log("Created 4 tasks.");

    // 5. Create Risks for Event 1
    await Risk.create({
      eventId: event1._id,
      title: "Wi-Fi Bandwidth Saturation during Opening Ceremonies",
      description: "High concurrency of 250+ laptops and streaming traffic may overwhelm the Building B access point.",
      severity: "high",
      probability: "high",
      status: "open",
      detectedBy: "ai",
      recommendedAction: "Request campus networking team to deploy temporary secondary Wi-Fi mesh nodes.",
      assignedTo: organizerUser._id,
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

    console.log("Created 3 risks.");

    // 6. Create Volunteers for Event 1
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

    console.log("Created 3 event volunteers.");

    // 7. Create Meeting with Transcript for Event 1
    await Meeting.create({
      eventId: event1._id,
      title: "Sprint Planning & Risk Assessment Sync",
      date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      participants: [organizerUser._id, volunteer1._id, volunteer2._id, volunteer3._id],
      processedByAI: false,
      transcript: `
Sarah (Admin): Let's kick off our sprint planning for the AI Hackathon 2026. Krish, what are our main operational bottlenecks?
Krish (Organizer): Our biggest priority is securing the auditorium AV setup. Maya, can you confirm if campus IT has locked in the equipment?
Maya: I'll test the wireless mics and stage projector on Thursday. We also need to test the backup power strips.
Krish: Great. Next, Alex, how is the swag kits distribution looking?
Alex: The printer confirmed delivery for Wednesday, but there might be a minor delay. I'll follow up with the warehouse tomorrow morning.
Samira: Regarding catering, we have 45 attendees requesting vegan and gluten-free meals. I need the final headcount confirmed by Friday noon.
Krish: Let's also make sure we have a secondary Wi-Fi SSID from campus IT so attendees don't saturate the local router during opening remarks.
Sarah: Sounds good. Let's reconvene on Friday with all deliverables completed.
      `.trim(),
      summary: "Team reviewed AV preparation, swag kit delivery timelines, dietary catering headcounts, and potential Wi-Fi saturation risks.",
    });

    console.log("Created meeting with transcript.");

    // 8. Create Notifications for Organizer
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

    console.log("Created 3 notifications.");

    // 9. Create Sample Agent Actions for Event 1
    await AgentAction.create({
      userId: organizerUser._id,
      eventId: event1._id,
      command: "Assign Maya to test auditorium wireless mics by Thursday",
      intent: "CREATE_TASK",
      status: "completed",
      tool: "taskService.createTask",
      parameters: {
        title: "Test auditorium wireless microphones and stage sound",
        assignedTo: volunteer1._id,
        priority: "high",
      },
    });

    console.log("Created 1 agent action.");
    console.log("\n========================================================");
    console.log("  ClubOps-AI Seed Data Successfully Populated!          ");
    console.log("========================================================");
    console.log("Test Login Credentials (password for all: password123):");
    console.log("  • Admin:      admin@clubops.org");
    console.log("  • Organizer:  organizer@clubops.org");
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
