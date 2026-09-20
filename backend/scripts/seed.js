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

// Helper date generator
const now = new Date();
const daysOffset = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

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
    // 1. Core Organizers & Admins (Common across all clubs)
    // =========================================================================
    const sarahAdmin = await User.create({
      name: "Sarah Chen",
      email: "admin@clubops.org",
      passwordHash,
      role: "admin",
      skills: ["Leadership", "Budgeting", "Operations", "Sponsorship", "University Relations"],
      availability: "available",
    });

    const krishOrganizer = await User.create({
      name: "Krish Patel",
      email: "organizer@clubops.org",
      passwordHash,
      role: "organizer",
      skills: ["Event Planning", "Logistics Lead", "Technical AV", "Sponsor Management"],
      availability: "available",
    });

    const rahulOrganizer = await User.create({
      name: "Rahul Patel",
      email: "rahul@clubops.org",
      passwordHash,
      role: "organizer",
      skills: ["Operations Lead", "Hackathon Logistics", "Volunteer Coordination"],
      availability: "available",
    });

    console.log("Created 3 core administrators & organizers.");

    // =========================================================================
    // 2. Club Definitions & Seed Data
    // =========================================================================
    const clubSpecs = [
      {
        name: "AI & Robotics Society (AIRS)",
        description: "Pioneering intelligent autonomous systems, machine learning research, hardware prototyping, and competitive robotics.",
        volunteers: [
          { name: "Marcus Vance", email: "marcus.airs@clubops.org", team: "AV Operations", skills: ["Audio/Visual", "PA Sound", "Video Streaming"] },
          { name: "Maya Lin", email: "maya.airs@clubops.org", team: "Technical Operations", skills: ["Robot Calibration", "Lab Safety", "Power Circuits"] },
          { name: "David Kim", email: "david.airs@clubops.org", team: "Hardware Support", skills: ["Wi-Fi Repeaters", "Hardware Troubleshooting", "Soldering"] },
          { name: "Elena Rostova", email: "elena.airs@clubops.org", team: "Guest Logistics", skills: ["Catering Coordination", "Dietary Verification", "Hospitality"] },
          { name: "Chloe Bennett", email: "chloe.airs@clubops.org", team: "Registration", skills: ["NFC Badges", "Check-in Desk", "Attendee Verification"] },
          { name: "Vikram Sethi", email: "vikram.airs@clubops.org", team: "Sponsor Relations", skills: ["Booth Setup", "Swag Kits", "Sponsor Liaising"] },
          { name: "Lucas Gray", email: "lucas.airs@clubops.org", team: "Stage Management", skills: ["Speaker Timings", "Microphone Handover", "Lighting"] },
          { name: "Aisha Patel", email: "aisha.airs@clubops.org", team: "Media & PR", skills: ["Photography", "Live Social Updates", "Press Passes"] },
          { name: "Samuel Torres", email: "samuel.airs@clubops.org", team: "Safety & Security", skills: ["Crowd Control", "Fire Safety", "Emergency Access"] },
          { name: "Priya Nair", email: "priya.airs@clubops.org", team: "Mentorship Liaison", skills: ["Judge Coordination", "Rubric Evaluation", "Mentors"] },
          { name: "Leo Dupont", email: "leo.airs@clubops.org", team: "Logistics", skills: ["Inventory Tracking", "Courier Pickup", "Table Layout"] },
          { name: "Nina Zhang", email: "nina.airs@clubops.org", team: "Volunteer Care", skills: ["Shift Scheduling", "Snack Distribution", "First Aid"] },
        ],
        events: [
          {
            name: "Autonomous Drone Racing Cup 2026",
            description: "High-speed FPV drone racing tournament inside an enclosed obstacle arena with real-time telemetry.",
            venue: "Indoor Athletics Pavilion",
            status: "planning", // PENDING
            startDate: daysOffset(20),
            endDate: daysOffset(22),
            expectedParticipants: 180,
            expectedVolunteers: 15,
          },
          {
            name: "AI Hackathon 2026",
            description: "48-hour university hackathon focused on autonomous agent workflows, local LLMs, and robotics.",
            venue: "Grand Campus Hall, Building B",
            status: "ongoing", // ONGOING
            startDate: daysOffset(-1),
            endDate: daysOffset(2),
            expectedParticipants: 280,
            expectedVolunteers: 20,
          },
          {
            name: "Winter Robotics Showcase 2025",
            description: "Annual demonstration of autonomous quadruped robots, arm manipulators, and computer vision projects.",
            venue: "Engineering Atrium West",
            status: "completed", // COMPLETED
            startDate: daysOffset(-30),
            endDate: daysOffset(-29),
            expectedParticipants: 160,
            expectedVolunteers: 12,
          },
        ],
        meetings: [
          {
            title: "Sprint Planning & Risk Assessment Sync",
            date: daysOffset(-1),
            completed: true,
            summary: "Core alignment on main stage audio, high-gain Wi-Fi repeaters, sponsor swag distribution, and catering contract verification.",
            transcript: `Rahul: Welcome everyone to the AI Hackathon operations sync.
Marcus Vance: I have confirmed the 4 lapel microphones and main projector. We will test the stage PA system by Friday 2 PM.
Elena Rostova: I reviewed the catering numbers. We need to finalize the vegan and gluten-free dietary boxes by Thursday evening.
David Kim: The campus Wi-Fi repeaters arrived. I will set up the repeater bridge in Hall B before Saturday morning.
Rahul: Risk check: The main catering contract is still awaiting signature. We must sign before Friday to avoid delay penalties.
Chloe Bennett: 300 NFC attendee badges and welcome lanyards will arrive from the print shop by Thursday 10 AM.`,
            decisions: ["Stage sound checks locked for Friday 2 PM", "NFC badges scheduled for distribution Thursday 10 AM"],
            tasks: [
              { title: "Test stage PA system and projectors", assignee: "Marcus Vance", priority: "high", deadline: daysOffset(1) },
              { title: "Verify dietary boxes with catering", assignee: "Elena Rostova", priority: "high", deadline: daysOffset(2) },
              { title: "Setup high-gain Wi-Fi repeater bridge in Hall B", assignee: "David Kim", priority: "high", deadline: daysOffset(3) },
            ],
            risks: [
              { title: "Unsigned Catering Contract", severity: "high", description: "Pending contract could delay hot meal delivery for 280 hackers." },
              { title: "Wi-Fi Congestion in Hall B", severity: "medium", description: "Heavy streaming traffic may cause network drops during live demos." },
            ],
          },
          {
            title: "Safety Barrier & Netting Inspection for Drone Arena",
            date: daysOffset(2),
            completed: true,
            summary: "Inspection of ceiling nets, pit crew safety zones, and battery charging fire lockers for the Drone Racing Cup.",
            transcript: `Krish: Let's inspect the safety perimeter for the Drone Racing Cup.
Maya Lin: The 10-meter ceiling netting is delivered. We need Lucas Gray and Samuel Torres to secure the anchors along the east truss by Tuesday.
Samuel Torres: I inspected the LiPo battery charging station. We must install 3 sand buckets and 2 Class-D fire extinguishers in the pit lane.
Lucas Gray: I will verify pilot registration and drone transponder frequencies on 5.8 GHz.
Krish: Decision: No drone is permitted to arm motors without a verified fail-safe kill switch test.`,
            decisions: ["LiPo battery charging restricted exclusively to designated fire-safe lockers", "Mandatory fail-safe kill switch test before every race heat"],
            tasks: [
              { title: "Anchor 10-meter ceiling protective netting", assignee: "Samuel Torres", priority: "critical", deadline: daysOffset(5) },
              { title: "Equip LiPo charging area with sand buckets and extinguishers", assignee: "Maya Lin", priority: "high", deadline: daysOffset(4) },
              { title: "Calibrate pilot video transponder frequencies (5.8 GHz)", assignee: "Lucas Gray", priority: "medium", deadline: daysOffset(6) },
            ],
            risks: [
              { title: "LiPo Battery Thermal Runaway Hazard", severity: "critical", description: "High-discharge drone batteries risk fire if charged improperly without supervision." },
            ],
          },
          {
            title: "Post-Event Retrospective & Budget Reconciliation",
            date: daysOffset(-25),
            completed: true,
            summary: "Financial debrief and equipment return audit following the successful Winter Robotics Showcase.",
            transcript: `Sarah Chen: Outstanding job at the Winter Showcase. Attendance hit 160 participants with zero hardware damage.
Aisha Patel: The live demo stream garnered over 1,200 views. All recorded video footage has been archived to the society NAS.
Vikram Sethi: We collected receipts for venue cleaning and robot transport crates. Total expenses were 8% under our allocated budget.
Priya Nair: Judges submitted high praise for student demonstrations. Recommendation for next year: add 30 minutes between keynote sessions.`,
            decisions: ["Archived all raw 4K stream footage to NAS storage", "Approved surplus budget rollover to Spring Hackathon hardware fund"],
            tasks: [
              { title: "Publish highlight reel to university social channels", assignee: "Aisha Patel", priority: "medium", deadline: daysOffset(-20) },
              { title: "Submit finalized expense report and invoices to student council", assignee: "Vikram Sethi", priority: "high", deadline: daysOffset(-18) },
            ],
            risks: [],
          },
          {
            title: "Sponsor Swag & Hardware Lab Loan Agreement Sync",
            date: daysOffset(5),
            completed: false, // PENDING
            summary: "Coordination with NVIDIA and Arduino representatives on sponsored GPU lab credits and microcontroller giveaway kits.",
            transcript: `Krish: We have confirmation from our premier sponsors for hardware giveaways.
Vikram Sethi: Arduino shipped 50 IoT development boards. We need Nina Zhang and Leo Dupont to inventory them in Room 204.
Nina Zhang: I will verify serial numbers and organize hardware loan checkout sheets.
Krish: Remember each borrower must sign the equipment return liability waiver.`,
            decisions: [],
            tasks: [],
            risks: [],
          },
          {
            title: "Mentor & Judge Orientation Schedule Review",
            date: daysOffset(7),
            completed: false, // PENDING
            summary: "Briefing external industry mentors on project evaluation rubrics and automated scoring portals.",
            transcript: `Priya Nair: We have 14 industry mentors confirmed from Google, Microsoft, and local robotics startups.
Rahul: We must configure the digital judging rubric on the ClubOps portal by Thursday noon.
Priya Nair: I will prepare mentor hospitality packages and parking passes for Saturday morning check-in.`,
            decisions: [],
            tasks: [],
            risks: [],
          },
        ],
      },
      {
        name: "ACM Student Chapter",
        description: "Promoting computing machinery, technical workshops, distributed systems masterclasses, and national programming competitions.",
        volunteers: [
          { name: "Jordan Reed", email: "jordan.acm@clubops.org", team: "Systems Admin", skills: ["Linux", "Docker", "Kubernetes", "Load Balancers"] },
          { name: "Tara Ferguson", email: "tara.acm@clubops.org", team: "Workshop Lead", skills: ["Curriculum Planning", "Code Mentoring", "Slide Decks"] },
          { name: "Nathan Wu", email: "nathan.acm@clubops.org", team: "Network Ops", skills: ["Subnets", "Firewall Rules", "Cat6 Cabling"] },
          { name: "Beatrice Vance", email: "beatrice.acm@clubops.org", team: "Guest Hospitality", skills: ["Keynote Hospitality", "Travel Booking", "Dining"] },
          { name: "Rohan Mehta", email: "rohan.acm@clubops.org", team: "Registration", skills: ["Ticketing", "QR Scanners", "Badge Printing"] },
          { name: "Isabella Cruz", email: "isabella.acm@clubops.org", team: "Media & PR", skills: ["Branding", "Social Graphics", "Newsletter"] },
          { name: "Felix Murphy", email: "felix.acm@clubops.org", team: "Security", skills: ["CTF Challenges", "Sandboxing", "Incident Response"] },
          { name: "Ananya Roy", email: "ananya.acm@clubops.org", team: "Logistics", skills: ["Classroom Booking", "Whiteboard Markers", "Snacks"] },
          { name: "Kevin Zhang", email: "kevin.acm@clubops.org", team: "Tech Support", skills: ["OS Imaging", "Wi-Fi Config", "AV Switcher"] },
          { name: "Zoe Miller", email: "zoe.acm@clubops.org", team: "Sponsorship", skills: ["Recruiting Fair", "Resume Books", "Liaison"] },
          { name: "Ethan Hawke", email: "ethan.acm@clubops.org", team: "Volunteer Care", skills: ["Roster Timing", "Meal Deliveries", "Relief"] },
          { name: "Hannah Abbott", email: "hannah.acm@clubops.org", team: "Finance", skills: ["Invoice Tracking", "Receipt Scanning", "Budget"] },
        ],
        events: [
          {
            name: "Distributed Systems & Cloud Conclave 2026",
            description: "Two-day academic and industry conference addressing high-throughput microservices, Raft consensus, and serverless architectures.",
            venue: "Computer Science Auditorium & Labs",
            status: "planning", // PENDING
            startDate: daysOffset(25),
            endDate: daysOffset(27),
            expectedParticipants: 220,
            expectedVolunteers: 15,
          },
          {
            name: "ACM Winter CodeCamp 2026",
            description: "Hands-on weekend bootcamp covering Linux kernel internals, Rust systems programming, and high-performance databases.",
            venue: "Turing Computing Lab 301",
            status: "ongoing", // ONGOING
            startDate: daysOffset(-2),
            endDate: daysOffset(1),
            expectedParticipants: 120,
            expectedVolunteers: 12,
          },
          {
            name: "Cybersecurity Capture The Flag 2025",
            description: "Jeopardy-style security tournament with binary exploitation, cryptography, reverse engineering, and web challenges.",
            venue: "Cyber Range & Innovation Hub",
            status: "completed", // COMPLETED
            startDate: daysOffset(-40),
            endDate: daysOffset(-39),
            expectedParticipants: 150,
            expectedVolunteers: 10,
          },
        ],
        meetings: [
          {
            title: "Cloud Conclave Infrastructure & Cluster Provisioning",
            date: daysOffset(3),
            completed: true,
            summary: "Planning cloud infrastructure quotas, sandbox environments for student labs, and speaker keynote itineraries.",
            transcript: `Sarah Chen: Let's review the infrastructure requirements for the Cloud Conclave.
Jordan Reed: We have 3 dedicated Kubernetes clusters provisioned on AWS credits. Nathan Wu will configure the ingress firewall rules by Monday.
Nathan Wu: I will ensure participant subnets cannot communicate across tenant namespaces to prevent noisy-neighbor crashes.
Tara Ferguson: Keynote speaker Dr. Vohra requested a high-resolution display with terminal streaming support in Auditorium A.
Beatrice Vance: Speaker hotel reservations and airport shuttle service are locked for next Wednesday.`,
            decisions: ["Cluster resource limits capped at 2 CPU cores and 4GB RAM per attendee pod", "Keynote room allocated to Auditorium A with dedicated low-latency fiber link"],
            tasks: [
              { title: "Configure Kubernetes ingress firewall rules and isolation", assignee: "Nathan Wu", priority: "critical", deadline: daysOffset(6) },
              { title: "Test 4K display and terminal streaming in Auditorium A", assignee: "Tara Ferguson", priority: "high", deadline: daysOffset(8) },
              { title: "Confirm speaker shuttle timing with university fleet", assignee: "Beatrice Vance", priority: "medium", deadline: daysOffset(10) },
            ],
            risks: [
              { title: "AWS Educational Credit Expiration Risk", severity: "high", description: "Educational credits expire at end of month; requires renewal ticket to avoid shutdown." },
            ],
          },
          {
            title: "Winter CodeCamp Mid-Flight Logistics & Lab Sync",
            date: daysOffset(-1),
            completed: true,
            summary: "Operational review during CodeCamp day 1, covering student lab logins, lunch queue distribution, and Rust toolchain installations.",
            transcript: `Krish: Quick standup for day 1 of CodeCamp. How are the lab workstations performing?
Kevin Zhang: All 60 Linux workstations in Turing Lab 301 have Rust 1.80 pre-installed. Zero compiler dependency issues reported.
Ethan Hawke: Lunch distribution in the hallway was smooth. We distributed 120 boxed lunches in under 18 minutes.
Rohan Mehta: 15 late walk-ins registered at the desk. We printed temporary badges on the spot.`,
            decisions: ["Permitted late walk-ins with day pass credentials", "Extended evening lab open hours until 9:30 PM based on student demand"],
            tasks: [
              { title: "Run nightly system hygiene script on lab machines", assignee: "Kevin Zhang", priority: "medium", deadline: daysOffset(0) },
              { title: "Verify day-2 morning coffee and bagel delivery", assignee: "Ethan Hawke", priority: "high", deadline: daysOffset(1) },
            ],
            risks: [],
          },
          {
            title: "Cybersecurity CTF Retrospective & Flag Audit",
            date: daysOffset(-35),
            completed: true,
            summary: "Scoring review and infrastructure post-mortem following the annual Capture The Flag competition.",
            transcript: `Felix Murphy: CTF concluded with 34 teams scoring over 1,000 points. The dynamic flag generator worked flawlessly.
Jordan Reed: We experienced a 4-minute DDoS incident on the scoreboard during hour 6, but Cloudflare mitigated the attack successfully.
Hannah Abbott: Cash prizes have been wired to the top 3 teams. All financial paperwork is fully signed.`,
            decisions: ["Published writeups for all 24 challenge flags to GitHub repository", "Automated scoreboard backup snapshots every 5 minutes for future events"],
            tasks: [
              { title: "Archive CTF challenge Docker containers to registry", assignee: "Felix Murphy", priority: "low", deadline: daysOffset(-30) },
            ],
            risks: [],
          },
          {
            title: "Sponsor Booth Allocation & Career Mixer Sync",
            date: daysOffset(8),
            completed: false, // PENDING
            summary: "Allocating booth locations and resume drop stations for visiting tech companies.",
            transcript: `Zoe Miller: We have 8 sponsors attending the career fair including Bloomberg and Red Hat.
Ananya Roy: We need table layout schematics for the CS Building 1st floor concourse.
Zoe Miller: I will finalize the booth placement map by Friday afternoon.`,
            decisions: [],
            tasks: [],
            risks: [],
          },
          {
            title: "Workshop Curriculum & Lab Handout Review",
            date: daysOffset(11),
            completed: false, // PENDING
            summary: "Finalizing markdown lab guides and starter repositories for upcoming cloud computing tutorials.",
            transcript: `Tara Ferguson: The Docker and Kubernetes lab handouts are drafted.
Nathan Wu: I will test all curl and deployment steps on a clean student account to ensure zero broken links.`,
            decisions: [],
            tasks: [],
            risks: [],
          },
        ],
      },
      {
        name: "Google Developer Student Club (GDSC)",
        description: "Empowering university developers to build real-world mobile, web, and cloud solutions while connecting students with Google technologies.",
        volunteers: [
          { name: "Liam Gallagher", email: "liam.gdsc@clubops.org", team: "Mobile Dev", skills: ["Flutter", "Dart", "Android Studio"] },
          { name: "Sophia Chen", email: "sophia.gdsc@clubops.org", team: "Web Technologies", skills: ["React", "Firebase", "Google Cloud", "PWA"] },
          { name: "Mateo Hernandez", email: "mateo.gdsc@clubops.org", team: "AI/ML Lead", skills: ["TensorFlow", "MediaPipe", "Gemini API"] },
          { name: "Jasmine Kaur", email: "jasmine.gdsc@clubops.org", team: "Community Lead", skills: ["Event Moderation", "Outreach", "Partnerships"] },
          { name: "Oliver Twist", email: "oliver.gdsc@clubops.org", team: "Design Lead", skills: ["Material Design 3", "Figma", "Branding"] },
          { name: "Emily Watson", email: "emily.gdsc@clubops.org", team: "Logistics", skills: ["Room Reservations", "Catering", "Swag Kits"] },
          { name: "Daniel Park", email: "daniel.gdsc@clubops.org", team: "AV Ops", skills: ["Google Meet Livestream", "Obsidian Recording"] },
          { name: "Riya Sen", email: "riya.gdsc@clubops.org", team: "Registration", skills: ["Google Forms", "Check-in QR", "Attendee Sync"] },
          { name: "Gabriel Souza", email: "gabriel.gdsc@clubops.org", team: "Cloud Admin", skills: ["GCP Console", "Cloud Run", "Budget Quotas"] },
          { name: "Natalie Portman", email: "natalie.gdsc@clubops.org", team: "Sponsorship", skills: ["Google Swag", "Local Business Perks"] },
          { name: "Jason Bourne", email: "jason.gdsc@clubops.org", team: "Safety Lead", skills: ["First Aid", "Corridor Security"] },
          { name: "Layla Moran", email: "layla.gdsc@clubops.org", team: "Social Media", skills: ["YouTube Shorts", "LinkedIn Postings"] },
        ],
        events: [
          {
            name: "Solution Challenge HackFest 2026",
            description: "Annual hackathon solving one of the United Nations 17 Sustainable Development Goals using Google technology.",
            venue: "Innovation Hub & Collaborative Pods",
            status: "planning", // PENDING
            startDate: daysOffset(18),
            endDate: daysOffset(20),
            expectedParticipants: 240,
            expectedVolunteers: 18,
          },
          {
            name: "GDSC Android & Flutter Bootcamp",
            description: "Four-week intensive workshop track guiding novice programmers from Dart basics to published multiplatform apps.",
            venue: "Lecture Hall Delta",
            status: "ongoing", // ONGOING
            startDate: daysOffset(-5),
            endDate: daysOffset(15),
            expectedParticipants: 160,
            expectedVolunteers: 12,
          },
          {
            name: "Cloud Study Jam & GenAI Sprint 2025",
            description: "Hands-on lab marathon earning Google Cloud skill badges in Vertex AI, Gemini models, and BigQuery ML.",
            venue: "Virtual & Hybrid Campus Center",
            status: "completed", // COMPLETED
            startDate: daysOffset(-50),
            endDate: daysOffset(-49),
            expectedParticipants: 210,
            expectedVolunteers: 10,
          },
        ],
        meetings: [
          {
            title: "Solution Challenge Kickoff & Community Partner Alignment",
            date: daysOffset(1),
            completed: true,
            summary: "Reviewing community NGO problem statements, mentor assignments, and Google Cloud project credits.",
            transcript: `Jasmine Kaur: Welcome to our Solution Challenge organizing meeting.
Mateo Hernandez: We have 5 local non-profits contributing problem statements around food waste tracking and solar grid micro-metering.
Sophia Chen: Google Cloud vouchers providing $100 per team have been approved. Gabriel Souza will distribute the redemption codes by Wednesday.
Gabriel Souza: I will setup GCP billing alerts at $80 threshold to prevent student teams from incurring unexpected charges.
Emily Watson: We ordered 250 Google Developer swag kits and stickers. They will arrive at the campus mailroom Friday morning.`,
            decisions: ["GCP billing alerts mandatory on all team project sandboxes", "Partnered with 5 local NGOs for community impact mentorship"],
            tasks: [
              { title: "Distribute GCP credit redemption codes to hackathon teams", assignee: "Gabriel Souza", priority: "critical", deadline: daysOffset(3) },
              { title: "Retrieve Google Developer swag boxes from mailroom", assignee: "Emily Watson", priority: "medium", deadline: daysOffset(4) },
              { title: "Publish UN SDG problem briefs to club portal", assignee: "Sophia Chen", priority: "high", deadline: daysOffset(2) },
            ],
            risks: [
              { title: "Google Cloud Project Quota Delay", severity: "high", description: "New GCP accounts may experience automated project creation rate limits." },
            ],
          },
          {
            title: "Flutter Bootcamp Week-2 Live Coding Prep",
            date: daysOffset(-2),
            completed: true,
            summary: "Reviewing student code challenges, live state management demonstrations, and room capacity adjustments.",
            transcript: `Liam Gallagher: Week 1 of the Flutter bootcamp had 142 attendees. The room was near max capacity.
Daniel Park: Audio recording on the secondary wireless mic had slight echo. I am bringing a directional shotgun mic for this Saturday.
Sophia Chen: We will cover Riverpod and Firebase Auth this session. I verified the starter repo on GitHub.
Riya Sen: Check-in via QR codes took less than 4 seconds per attendee. We had no congestion at the entrance.`,
            decisions: ["Upgraded audio capture to directional microphone", "Reserved overflow seating in Hall Delta balcony"],
            tasks: [
              { title: "Deploy directional shotgun microphone in Lecture Hall Delta", assignee: "Daniel Park", priority: "high", deadline: daysOffset(0) },
              { title: "Push Riverpod starter template to GDSC GitHub org", assignee: "Sophia Chen", priority: "medium", deadline: daysOffset(0) },
            ],
            risks: [],
          },
          {
            title: "Cloud Study Jam Milestone Audit & Badge Verification",
            date: daysOffset(-45),
            completed: true,
            summary: "Verification of 185 completed Google Cloud skill badges and certificate issuance.",
            transcript: `Mateo Hernandez: The Cloud Study Jam concluded with 185 participants earning at least 2 Vertex AI skill badges.
Layla Moran: Social media engagement hit an all-time high with over 350 student certificate shares on LinkedIn.
Jasmine Kaur: We received official congratulations from the Google regional developer team.`,
            decisions: ["Archived student badge completion records for annual GDSC chapter report"],
            tasks: [
              { title: "Submit chapter milestone metrics to Google Developer Dashboard", assignee: "Jasmine Kaur", priority: "low", deadline: daysOffset(-40) },
            ],
            risks: [],
          },
          {
            title: "Mentor Hospitality & Keynote Video Rehearsal",
            date: daysOffset(6),
            completed: false, // PENDING
            summary: "Technical rehearsal for remote Google engineer keynote stream via Google Meet.",
            transcript: `Daniel Park: We will run a 15-minute test call with Google engineer Alex in Seattle on Thursday.
Jasmine Kaur: I will prepare the Q&A moderation queue in Slido.`,
            decisions: [],
            tasks: [],
            risks: [],
          },
          {
            title: "HackFest Project Submission & Judging Portal Dry-Run",
            date: daysOffset(9),
            completed: false, // PENDING
            summary: "Testing project submission forms, YouTube video demo links, and judge scoring sheets.",
            transcript: `Sophia Chen: The Devpost and ClubOps submission forms are ready for end-to-end testing.
Mateo Hernandez: I will submit three test projects with dummy GitHub repos to verify rubric calculations.`,
            decisions: [],
            tasks: [],
            risks: [],
          },
        ],
      },
      {
        name: "Design & UX Guild",
        description: "Fostering human-centered digital design, interactive user experience prototyping, accessibility audits, and design sprints.",
        volunteers: [
          { name: "Julian Barnes", email: "julian.ux@clubops.org", team: "UX Research", skills: ["User Interviews", "Usability Testing", "Persona Mapping"] },
          { name: "Clara Oswald", email: "clara.ux@clubops.org", team: "Design Systems", skills: ["Figma Variables", "Tokens", "Component Architecture"] },
          { name: "Diego Luna", email: "diego.ux@clubops.org", team: "Visual Design", skills: ["Typography", "Illustrations", "Poster Art"] },
          { name: "Harper Lee", email: "harper.ux@clubops.org", team: "Accessibility", skills: ["WCAG 2.2", "Screen Readers", "Color Contrast"] },
          { name: "Miles Morales", email: "miles.ux@clubops.org", team: "Motion & Micro-interactions", skills: ["Lottie", "Rive", "Framer"] },
          { name: "Fiona Gallagher", email: "fiona.ux@clubops.org", team: "Logistics", skills: ["Sticky Notes", "Sharpies", "Whiteboards"] },
          { name: "Arthur Dent", email: "arthur.ux@clubops.org", team: "Stage Management", skills: ["Microphone", "Lighting", "Slide Clicker"] },
          { name: "Naomi Nagata", email: "naomi.ux@clubops.org", team: "Registration", skills: ["Portfolio Check-in", "Badge Stamping"] },
          { name: "Victor Stone", email: "victor.ux@clubops.org", team: "Exhibition Ops", skills: ["Easel Stands", "Foam Boards", "Gallery Lighting"] },
          { name: "Grace Hopper", email: "grace.ux@clubops.org", team: "Sponsorship", skills: ["Design Agency Liaison", "Figma Perks"] },
          { name: "Bruce Wayne", email: "bruce.ux@clubops.org", team: "Hospitality", skills: ["Coffee Catering", "Guest Speaker Dinner"] },
          { name: "Diana Prince", email: "diana.ux@clubops.org", team: "PR & Showcase", skills: ["Instagram Stories", "Behance Curation"] },
        ],
        events: [
          {
            name: "Campus UX Design Sprint 2026",
            description: "5-day rapid prototyping sprint redesigning university campus transit, dining services, and student advising portals.",
            venue: "Design Thinking Studio, Art & Architecture Bldg",
            status: "planning", // PENDING
            startDate: daysOffset(14),
            endDate: daysOffset(19),
            expectedParticipants: 140,
            expectedVolunteers: 12,
          },
          {
            name: "Design Thinking & Prototyping Marathon",
            description: "Intensive 24-hour design hackathon turning ambiguous user friction into interactive high-fidelity Figma prototypes.",
            venue: "Media Arts Lab 102",
            status: "ongoing", // ONGOING
            startDate: daysOffset(-1),
            endDate: daysOffset(1),
            expectedParticipants: 110,
            expectedVolunteers: 10,
          },
          {
            name: "Annual Digital Portfolio Showcase 2025",
            description: "Exhibition of student UX case studies, mobile design concepts, and visual identities evaluated by industry design directors.",
            venue: "Fine Arts Gallery Concourse",
            status: "completed", // COMPLETED
            startDate: daysOffset(-60),
            endDate: daysOffset(-59),
            expectedParticipants: 190,
            expectedVolunteers: 15,
          },
        ],
        meetings: [
          {
            title: "Sprint Briefing & Student Transit Persona Validation",
            date: daysOffset(2),
            completed: true,
            summary: "Finalizing problem briefs with the university transit authority and preparing workshop prototyping supplies.",
            transcript: `Julian Barnes: We completed 35 user discovery interviews with commuter students regarding campus shuttle wait times.
Clara Oswald: The design system tokens for the transit prototype are ready in Figma with light and dark mode variants.
Fiona Gallagher: I ordered 80 packs of Post-it notes, 120 colored Sharpies, and 30 rolls of painter's tape for the ideation walls.
Harper Lee: Crucial note: all student design prototypes must satisfy WCAG 2.2 AA contrast standards to qualify for judging.
Julian Barnes: We will provide a 10-minute accessibility rubric briefing on day 1 morning.`,
            decisions: ["Mandatory WCAG 2.2 AA compliance for all submitted design prototypes", "Stationery supplies assigned to Studio Rooms A, B, and C"],
            tasks: [
              { title: "Distribute ideation workshop stationery to design studios", assignee: "Fiona Gallagher", priority: "medium", deadline: daysOffset(4) },
              { title: "Publish accessibility contrast testing rubric to sprint participants", assignee: "Harper Lee", priority: "high", deadline: daysOffset(3) },
              { title: "Upload persona mapping interview snippets to shared drive", assignee: "Julian Barnes", priority: "medium", deadline: daysOffset(5) },
            ],
            risks: [
              { title: "Transit Authority API Incompatibility", severity: "medium", description: "Campus transit GPS feed has sporadic CORS restrictions for student frontend clients." },
            ],
          },
          {
            title: "Prototyping Marathon Midpoint Critique & Feedback Sync",
            date: daysOffset(0),
            completed: true,
            summary: "Midpoint review of interactive prototypes with guest design leads from Spotify and Duolingo.",
            transcript: `Diego Luna: 22 student teams have submitted their wireframe user flows into the Figma community space.
Miles Morales: The interactive transitions look sharp. Several teams utilized smooth smart-animate micro-interactions.
Arthur Dent: We need to ensure the main projector in Media Lab 102 has true color calibration for tomorrow's final pitch decks.
Diego Luna: I will adjust the HDMI color profile to sRGB today at 4 PM.`,
            decisions: ["Calibrated lab projectors to sRGB standard for color fidelity", "Permitted 3-minute pitch plus 2-minute live demo per finalist"],
            tasks: [
              { title: "Calibrate media lab projector color profile to sRGB", assignee: "Diego Luna", priority: "high", deadline: daysOffset(0) },
              { title: "Prepare finalist presentation timer display", assignee: "Arthur Dent", priority: "medium", deadline: daysOffset(1) },
            ],
            risks: [],
          },
          {
            title: "Annual Portfolio Showcase Gallery De-installation Audit",
            date: daysOffset(-55),
            completed: true,
            summary: "Tear down of gallery foam boards, return of rented exhibition lighting, and feedback aggregation.",
            transcript: `Victor Stone: All 45 display easels and spotlight fixtures have been packed and returned to the rental vendor.
Diana Prince: Student feedback was extraordinarily positive; 14 attendees received on-the-spot summer internship interview requests.
Sarah Chen: Excellent execution. All gallery security deposits have been refunded in full.`,
            decisions: ["Secured 100% refund of venue security deposit", "Established permanent alumni portfolio showcase website"],
            tasks: [
              { title: "Compile employer feedback survey results into annual report", assignee: "Diana Prince", priority: "low", deadline: daysOffset(-50) },
            ],
            risks: [],
          },
          {
            title: "Agency Sponsor Judging Panel Alignment",
            date: daysOffset(7),
            completed: false, // PENDING
            summary: "Aligning scoring rubrics with creative directors from local digital agencies.",
            transcript: `Grace Hopper: 6 design agencies confirmed judges for the final showcase.
Clara Oswald: I will send them the Figma preview links and scoring spreadsheets on Monday.`,
            decisions: [],
            tasks: [],
            risks: [],
          },
          {
            title: "Exhibition Floorplan & Spatial Acoustic Review",
            date: daysOffset(10),
            completed: false, // PENDING
            summary: "Testing audio reflections and visitor walking paths in the Art Architecture atrium.",
            transcript: `Victor Stone: We need to space the interactive touchscreens at least 4 meters apart to avoid audio bleed.
Fiona Gallagher: I will mark the floor positions with removable tape on Wednesday morning.`,
            decisions: [],
            tasks: [],
            risks: [],
          },
        ],
      },
      {
        name: "Competitive Coding & Algorithms Club",
        description: "Rigorous algorithmic problem solving, graph theory masterclasses, and national ICPC collegiate competitive programming training.",
        volunteers: [
          { name: "Kunal Sharma", email: "kunal.cp@clubops.org", team: "Problem Setting", skills: ["Graph Theory", "Dynamic Programming", "Test Case Gen"] },
          { name: "Amy Pond", email: "amy.cp@clubops.org", team: "Platform Admin", skills: ["DOMjudge", "Kattis", "Docker Sandboxing"] },
          { name: "George Clark", email: "george.cp@clubops.org", team: "Proctoring", skills: ["Anti-Cheat", "Screen Monitoring", "Audit Logs"] },
          { name: "Holly Martins", email: "holly.cp@clubops.org", team: "Logistics", skills: ["Desk Numbers", "Scratch Paper", "Pens"] },
          { name: "Peter Parker", email: "peter.cp@clubops.org", team: "Balloon Operations", skills: ["Helium Tank", "Color Coding", "Rapid Delivery"] },
          { name: "Rachel Green", email: "rachel.cp@clubops.org", team: "Hospitality", skills: ["Pizza Delivery", "Energy Drinks", "Coffee"] },
          { name: "Ross Geller", email: "ross.cp@clubops.org", team: "Rules & Arbitration", skills: ["ICPC Rulebook", "Score Appeals"] },
          { name: "Monica Geller", email: "monica.cp@clubops.org", team: "Schedule Coordinator", skills: ["Timer Precision", "Opening Ceremony"] },
          { name: "Chandler Bing", email: "chandler.cp@clubops.org", team: "Scoreboard Visuals", skills: ["Live Stream Overlay", "Scoreboard Freeze"] },
          { name: "Joey Tribbiani", email: "joey.cp@clubops.org", team: "Check-in Desk", skills: ["ID Check", "Team Seating Assignment"] },
          { name: "Phoebe Buffay", email: "phoebe.cp@clubops.org", team: "Trophy & Swag", skills: ["Trophy Engraving", "Medals", "Certificates"] },
          { name: "Mike Hannigan", email: "mike.cp@clubops.org", team: "Network Ops", skills: ["Local LAN Server", "Firewall Isolation"] },
        ],
        events: [
          {
            name: "Inter-Collegiate ICPC Regionals Qualifier",
            description: "5-hour high-stakes team programming contest solving 12 algorithmic challenges under strict time and memory constraints.",
            venue: "Central Computing Facility, Main Campus",
            status: "planning", // PENDING
            startDate: daysOffset(22),
            endDate: daysOffset(23),
            expectedParticipants: 180,
            expectedVolunteers: 15,
          },
          {
            name: "Spring Code Clash 2026",
            description: "Fast-paced individual competitive programming sprint with rapid rating updates, division ladders, and instant scoreboard.",
            venue: "Engineering Terminal Annex 204",
            status: "ongoing", // ONGOING
            startDate: daysOffset(-1),
            endDate: daysOffset(1),
            expectedParticipants: 140,
            expectedVolunteers: 12,
          },
          {
            name: "Autumn Algorithms Invitational 2025",
            description: "Collegiate algorithmic tournament featuring mathematical optimization, segment trees, and flow network challenges.",
            venue: "Science Hall Auditorium",
            status: "completed", // COMPLETED
            startDate: daysOffset(-70),
            endDate: daysOffset(-69),
            expectedParticipants: 120,
            expectedVolunteers: 10,
          },
        ],
        meetings: [
          {
            title: "DOMjudge Contest Platform Stress Test & LAN Isolation",
            date: daysOffset(4),
            completed: true,
            summary: "Validating judge compiler sandboxes, local LAN network isolation, and testcase verification for ICPC Qualifier.",
            transcript: `Kunal Sharma: All 12 problem statements and hidden test suites have been verified with reference C++ and Python solutions.
Amy Pond: We ran a stress test simulating 180 concurrent code submissions on DOMjudge. Memory usage peaked at 42% on our dual-socket server.
Mike Hannigan: The local contest LAN is physically isolated from the internet. Contestants can only reach the internal judge IP.
George Clark: Anti-cheating proctoring software will monitor background processes and USB storage insertion.
Peter Parker: We have 12 balloon colors matched to problem tags ready for helium inflation on contest morning.`,
            decisions: ["Contest arena completely isolated from internet access with internal DNS", "Color-coded balloon runners deployed immediately upon first-accepted submission"],
            tasks: [
              { title: "Deploy DOMjudge image with isolated sandbox compilers", assignee: "Amy Pond", priority: "critical", deadline: daysOffset(7) },
              { title: "Set up helium tank and 12-color balloon sorting station", assignee: "Peter Parker", priority: "medium", deadline: daysOffset(9) },
              { title: "Verify local network firewall blocks all external gateway traffic", assignee: "Mike Hannigan", priority: "critical", deadline: daysOffset(6) },
            ],
            risks: [
              { title: "C++ Compiler Stack Overflow on Deep Recursion", severity: "high", description: "Default Linux ulimit stack size must be expanded to prevent premature SIGSEGV on tree DFS." },
            ],
          },
          {
            title: "Code Clash Day-1 Scoreboard Freeze & Balloon Logistics",
            date: daysOffset(0),
            completed: true,
            summary: "Executing the final hour scoreboard freeze and resolving contested compiler time-limit verdicts.",
            transcript: `Monica Geller: Scoreboard freeze initiated at the 4-hour mark. 84 teams are actively coding.
Ross Geller: We had one appeal on Problem D regarding time limit on Python 3. We re-tested with PyPy and the verdict stood as correct TLE.
Chandler Bing: The live stream overlay has 420 concurrent spectators watching the frozen standings.
Rachel Green: Pizza and caffeinated drinks will be rolled into the lobby during the final 30 minutes.`,
            decisions: ["Upheld judge verdict on Problem D following independent jury arbitration", "Initiated 60-minute scoreboard freeze per standard ICPC rules"],
            tasks: [
              { title: "Prepare unfreeze animation sequence for closing ceremony", assignee: "Chandler Bing", priority: "high", deadline: daysOffset(0) },
              { title: "Coordinate post-contest trophy presentation on main stage", assignee: "Phoebe Buffay", priority: "high", deadline: daysOffset(1) },
            ],
            risks: [],
          },
          {
            title: "Autumn Invitational Post-Contest Review & Problem Archival",
            date: daysOffset(-65),
            completed: true,
            summary: "Post-mortem analysis of problem difficulty curves and editorial publishing.",
            transcript: `Kunal Sharma: Problem B had a 94% solve rate while Problem L was solved by only 2 teams, which provided a flawless difficulty curve.
Amy Pond: The online judge processed 1,420 total submissions with zero server crashes or unhandled exceptions.
Sarah Chen: All trophies and book vouchers have been distributed to regional winners.`,
            decisions: ["Published official problem editorials and test generators to GitHub archive"],
            tasks: [
              { title: "Publish problem analysis and official solution editorials", assignee: "Kunal Sharma", priority: "low", deadline: daysOffset(-60) },
            ],
            risks: [],
          },
          {
            title: "Contest Problem Set Blind Review & Peer Verification",
            date: daysOffset(6),
            completed: false, // PENDING
            summary: "Peer testing of upcoming regional problems under blind contest conditions.",
            transcript: `Kunal Sharma: Two former regional finalists will blind-solve our problem set on Saturday.
Amy Pond: We will record their solving time to fine-tune problem time limits.`,
            decisions: [],
            tasks: [],
            risks: [],
          },
          {
            title: "Helium Logistics & Volunteer Proctoring Briefing",
            date: daysOffset(12),
            completed: false, // PENDING
            summary: "Safety training on handling pressurized helium cylinders and proctoring protocols.",
            transcript: `Peter Parker: The helium tank supplier confirmed delivery for next Thursday.
George Clark: I will run a 20-minute proctoring guidelines session for all 15 volunteers on Friday afternoon.`,
            decisions: [],
            tasks: [],
            risks: [],
          },
        ],
      },
    ];

    let totalClubs = 0;
    let totalEvents = 0;
    let totalVolunteers = 0;
    let totalMeetings = 0;
    let totalTasks = 0;
    let totalRisks = 0;

    for (const spec of clubSpecs) {
      console.log(`\n======================================================`);
      console.log(`Creating Club: "${spec.name}"...`);

      // 1. Create volunteers as users
      const volunteerUserIds = [];
      const createdVolunteerUsers = [];

      for (const vol of spec.volunteers) {
        const u = await User.create({
          name: vol.name,
          email: vol.email,
          passwordHash,
          role: "member",
          skills: vol.skills,
          availability: "available",
        });
        volunteerUserIds.push(u._id);
        createdVolunteerUsers.push(u);
      }

      // 2. Club member list: Includes Sarah (admin), Krish (organizer), Rahul (organizer) + 12 volunteers!
      const clubMemberIds = [
        sarahAdmin._id,
        krishOrganizer._id,
        rahulOrganizer._id,
        ...volunteerUserIds,
      ];

      const club = await Club.create({
        name: spec.name,
        description: spec.description,
        adminId: sarahAdmin._id,
        members: clubMemberIds,
      });
      totalClubs++;

      // Update volunteer users with clubId
      await User.updateMany({ _id: { $in: volunteerUserIds } }, { clubId: club._id });

      // Ensure Krish's primary club is the first club, but he has access to ALL clubs
      if (totalClubs === 1) {
        await User.findByIdAndUpdate(krishOrganizer._id, { clubId: club._id });
        await User.findByIdAndUpdate(sarahAdmin._id, { clubId: club._id });
        await User.findByIdAndUpdate(rahulOrganizer._id, { clubId: club._id });
      }

      console.log(`✓ Club created: "${spec.name}" with ${clubMemberIds.length} members (including Krish & Sarah).`);

      // 3. Create 3 Events (1 planning/pending, 1 ongoing, 1 completed)
      const createdEvents = [];
      for (const evtSpec of spec.events) {
        const evt = await Event.create({
          clubId: club._id,
          name: evtSpec.name,
          description: evtSpec.description,
          venue: evtSpec.venue,
          status: evtSpec.status,
          startDate: evtSpec.startDate,
          endDate: evtSpec.endDate,
          expectedParticipants: evtSpec.expectedParticipants,
          expectedVolunteers: evtSpec.expectedVolunteers,
          createdBy: krishOrganizer._id,
        });
        createdEvents.push(evt);
        totalEvents++;
      }

      console.log(`✓ Created 3 events: [pending: "${createdEvents[0].name}", ongoing: "${createdEvents[1].name}", completed: "${createdEvents[2].name}"]`);

      // 4. Create 10-12 Volunteer records for the ongoing event (and cross-link to others)
      const ongoingEvent = createdEvents[1];
      const pendingEvent = createdEvents[0];
      const completedEvent = createdEvents[2];

      for (let i = 0; i < createdVolunteerUsers.length; i++) {
        const volUser = createdVolunteerUsers[i];
        const specVol = spec.volunteers[i];

        await Volunteer.create({
          eventId: ongoingEvent._id,
          userId: volUser._id,
          team: specVol.team,
          skills: specVol.skills,
          availability: i % 4 === 0 ? "busy" : "available",
          assignedTasks: [],
        });
        totalVolunteers++;

        // Also register half for pending event
        if (i % 2 === 0) {
          await Volunteer.create({
            eventId: pendingEvent._id,
            userId: volUser._id,
            team: specVol.team,
            skills: specVol.skills,
            availability: "available",
            assignedTasks: [],
          });
          totalVolunteers++;
        }
      }

      console.log(`✓ Created ${createdVolunteerUsers.length} event volunteers.`);

      // 5. Create 5 Meetings in this Club (across ongoing and planning events)
      for (let mIdx = 0; mIdx < spec.meetings.length; mIdx++) {
        const mSpec = spec.meetings[mIdx];
        // Distribute meetings between ongoing (first 3) and planning (last 2)
        const targetEvent = mIdx < 3 ? ongoingEvent : pendingEvent;

        // Select participants from club volunteers
        const participantSlice = createdVolunteerUsers.slice(mIdx, mIdx + 4).map((u) => u._id);
        participantSlice.push(krishOrganizer._id);

        const meeting = await Meeting.create({
          eventId: targetEvent._id,
          title: mSpec.title,
          date: mSpec.date,
          participants: participantSlice,
          transcript: mSpec.transcript,
          summary: mSpec.summary,
          processedByAI: mSpec.completed,
        });
        totalMeetings++;

        // If meeting is marked completed, create AIAnalysis, Tasks, and Risks!
        if (mSpec.completed) {
          const createdTasksForMeeting = [];
          for (const tSpec of mSpec.tasks) {
            // Find matched volunteer
            const matchedUser = createdVolunteerUsers.find((u) => u.name === tSpec.assignee) || krishOrganizer;
            const task = await Task.create({
              eventId: targetEvent._id,
              title: tSpec.title,
              description: `Generated from meeting "${mSpec.title}".`,
              assignedTo: matchedUser._id,
              createdBy: krishOrganizer._id,
              priority: tSpec.priority || "medium",
              status: targetEvent.status === "completed" ? "completed" : "pending",
              deadline: tSpec.deadline,
              source: "ai_meeting",
              aiGenerated: true,
            });
            createdTasksForMeeting.push(task);
            totalTasks++;

            // Link to volunteer
            await Volunteer.updateOne(
              { eventId: targetEvent._id, userId: matchedUser._id },
              { $addToSet: { assignedTasks: task._id } }
            );
          }

          const createdRisksForMeeting = [];
          for (const rSpec of mSpec.risks) {
            const risk = await Risk.create({
              eventId: targetEvent._id,
              title: rSpec.title,
              description: rSpec.description,
              severity: rSpec.severity,
              probability: "medium",
              status: "open",
              detectedBy: "ai",
            });
            createdRisksForMeeting.push(risk);
            totalRisks++;
          }

          await AIAnalysis.create({
            meetingId: meeting._id,
            eventId: targetEvent._id,
            summary: mSpec.summary,
            tasks: createdTasksForMeeting.map((t) => ({
              title: t.title,
              ownerId: t.assignedTo,
              deadline: t.deadline,
              priority: t.priority,
            })),
            risks: createdRisksForMeeting.map((r) => ({
              title: r.title,
              severity: r.severity,
              description: r.description,
            })),
            decisions: mSpec.decisions,
            actionItems: createdTasksForMeeting.map((t) => t.title),
          });
        }
      }

      console.log(`✓ Seeded 5 meetings with transcripts (3 AI processed with tasks & risks, 2 pending live analysis).`);
    }

    // =========================================================================
    // 6. Summary of Seed Operation
    // =========================================================================
    console.log("\n==========================================================");
    console.log("🎉 SEEDING COMPLETED SUCCESSFULLY!");
    console.log("==========================================================");
    console.log(`Total Clubs:              ${totalClubs} (AIRS, ACM, GDSC, Design, CP)`);
    console.log(`Total Events:             ${totalEvents} (3 per club: 1 pending, 1 ongoing, 1 completed)`);
    console.log(`Total Volunteers Linked:  ${totalVolunteers} (12-18 volunteers per club)`);
    console.log(`Total Meetings:           ${totalMeetings} (5 transcripts per club)`);
    console.log(`Total Tasks Seeded:       ${totalTasks} (Auto-distributed to volunteers)`);
    console.log(`Total Risks Seeded:       ${totalRisks}`);
    console.log("==========================================================");
    console.log("Organizer Login:          organizer@clubops.org / password123");
    console.log("Admin Login:              admin@clubops.org / password123");
    console.log("==========================================================\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  }
}

seed();
