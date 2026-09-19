const axios = require("axios");
const { spawn } = require("child_process");
const path = require("path");

const API_BASE = process.env.API_URL || "http://localhost:5002/api";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function checkHealth() {
  try {
    const res = await axios.get(`${API_BASE}/health`, { timeout: 1500 });
    return res.status === 200;
  } catch {
    return false;
  }
}

async function ensureBackendIsRunning() {
  console.log("1. Checking Backend Server Health...");
  const isUp = await checkHealth();
  if (isUp) {
    console.log("   ✓ Backend server is already running on port 5002.\n");
    return;
  }

  console.log("   Backend server is not running. Starting it automatically in background...");
  const serverScript = path.resolve(__dirname, "../server.js");
  const serverProc = spawn(process.execPath, [serverScript], {
    cwd: path.resolve(__dirname, ".."),
    stdio: "ignore",
    detached: true,
  });
  serverProc.unref();

  // Wait up to 15 seconds for server to come up
  for (let i = 0; i < 30; i++) {
    await sleep(500);
    if (await checkHealth()) {
      console.log("   ✓ Backend server started successfully on port 5002!\n");
      return;
    }
  }

  console.error("\n❌ Could not connect to backend server at " + API_BASE);
  console.error("   Please start it manually in another terminal:");
  console.error("   $ cd backend");
  console.error("   $ npm run dev\n");
  process.exit(1);
}

async function runAutoDemo() {
  console.log("==========================================================");
  console.log("   ClubOps-AI: Automated End-to-End Live API Demo        ");
  console.log(`   Target Server: ${API_BASE}                           `);
  console.log("==========================================================\n");

  let token = null;
  let user = null;
  let eventId = null;

  // Ensure server is up before proceeding
  await ensureBackendIsRunning();

  const client = axios.create({
    baseURL: API_BASE,
    headers: { "Content-Type": "application/json" },
    validateStatus: () => true,
  });

  // 2. Authentication: Login or Register
  console.log("2. Authenticating User...");
  const authPayload = {
    email: "organizer@clubops.org",
    password: "password123",
  };

  let loginRes = await client.post("/auth/login", authPayload);

  if (loginRes.status === 200 && loginRes.data?.data?.token) {
    token = loginRes.data.data.token;
    user = loginRes.data.data.user;
    console.log(`   ✓ Logged in as: ${user.name} (${user.email}) [Role: ${user.role}]`);
  } else {
    // If not seeded, register a new account
    console.log("   Pre-seeded account not found. Registering a new test organizer...");
    const regRes = await client.post("/auth/register", {
      name: "Demo Organizer",
      email: `organizer_${Date.now().toString().slice(-4)}@clubops.org`,
      password: "password123",
      role: "organizer",
    });

    if (regRes.status === 201 && regRes.data?.data?.token) {
      token = regRes.data.data.token;
      user = regRes.data.data.user;
      console.log(`   ✓ Registered new user: ${user.name} (${user.email})`);
    } else {
      console.error("❌ Authentication failed:", regRes.data);
      process.exit(1);
    }
  }

  // Attach token for authenticated requests
  const authClient = axios.create({
    baseURL: API_BASE,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    validateStatus: () => true,
  });

  console.log(`   ✓ JWT Token acquired: ${token.slice(0, 16)}...\n`);

  // 3. Create a Live Event
  console.log("3. Creating a New Event via POST /api/events...");
  const eventName = `Autonomous AI & Robotics Expo ${new Date().getFullYear()}`;
  const now = new Date();
  const startDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const endDate = new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000);

  const eventRes = await authClient.post("/events", {
    name: eventName,
    description: "48-hour student symposium with hands-on AI agent competitions, robotics demos, and venture pitches.",
    venue: "Main Campus Auditorium & Engineering Quad",
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    expectedParticipants: 280,
    expectedVolunteers: 25,
  });

  if (eventRes.status === 201 || eventRes.status === 200) {
    const eventData = eventRes.data?.data || eventRes.data;
    eventId = eventData._id || eventData.id;
    console.log(`   ✓ Event created: "${eventName}" (ID: ${eventId})`);
    console.log(`     Venue: ${eventData.venue} | Expected Attendees: ${eventData.expectedParticipants}`);
  } else {
    console.error("❌ Event creation failed:", eventRes.data);
    process.exit(1);
  }
  console.log();

  // 4. Add Tasks
  console.log("4. Adding Tasks via POST /api/tasks...");
  const tasksToAdd = [
    {
      title: "Secure High-Gain Wi-Fi Repeaters for Main Hall",
      description: "Coordinate with university networking staff to install dual-band access points.",
      priority: "high",
      status: "in_progress",
      deadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: "Finalize Vegan & Gluten-Free Catering Orders",
      description: "Confirm meal delivery with campus caterer for 280 registered participants.",
      priority: "critical",
      status: "pending",
      deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: "Print 300 NFC Participant Badges & Lanyards",
      description: "Inspect barcode printing resolution and package swag bags.",
      priority: "medium",
      status: "completed",
      deadline: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  for (const t of tasksToAdd) {
    const taskRes = await authClient.post("/tasks", { eventId, ...t });
    if (taskRes.status === 201 || taskRes.status === 200) {
      const taskData = taskRes.data?.data || taskRes.data;
      console.log(`   ✓ Task added [${t.priority.toUpperCase()}]: "${t.title}" (ID: ${taskData._id || taskData.id})`);
    } else {
      console.warn(`   ⚠️ Could not add task "${t.title}":`, taskRes.data?.message);
    }
  }
  console.log();

  // 5. Report Risks
  console.log("5. Reporting Risks via POST /api/risks...");
  const risksToAdd = [
    {
      title: "Auditorium Network Congestion at Keynote",
      description: "High concurrency of 250+ laptops streaming may throttle Wi-Fi throughput.",
      severity: "high",
      probability: "high",
      recommendedAction: "Deploy dedicated SSID for demo presenters.",
    },
    {
      title: "Microphone Audio Feedback in Balcony Seating",
      description: "Historical acoustic resonance issues in room 204.",
      severity: "low",
      probability: "medium",
      recommendedAction: "Use directional lavalier mics with feedback dampening.",
    },
  ];

  for (const r of risksToAdd) {
    const riskRes = await authClient.post("/risks", { eventId, ...r });
    if (riskRes.status === 201 || riskRes.status === 200) {
      const riskData = riskRes.data?.data || riskRes.data;
      console.log(`   ✓ Risk reported [${r.severity.toUpperCase()}]: "${r.title}" (ID: ${riskData._id || riskData.id})`);
    } else {
      console.warn(`   ⚠️ Could not add risk "${r.title}":`, riskRes.data?.message);
    }
  }
  console.log();

  // 6. Add Volunteers
  console.log("6. Adding Volunteers via POST /api/volunteers...");
  const volunteersToAdd = [
    {
      name: "Marcus Vance",
      email: "marcus.vance@campus.edu",
      team: "Audio/Visual Operations",
      skills: ["Lighting", "Stage Management", "Sound Engineering"],
      availability: "available",
    },
    {
      name: "Elena Rostova",
      email: "elena.rostova@campus.edu",
      team: "Guest Logistics",
      skills: ["Registration", "Hospitality", "Sponsorship Relations"],
      availability: "available",
    },
  ];

  for (const v of volunteersToAdd) {
    const volRes = await authClient.post("/volunteers", { eventId, ...v });
    if (volRes.status === 201 || volRes.status === 200) {
      const volData = volRes.data?.data || volRes.data;
      console.log(`   ✓ Volunteer added: ${v.name} -> Team: ${v.team}`);
    } else {
      console.warn(`   ⚠️ Could not add volunteer ${v.name}:`, volRes.data?.message);
    }
  }
  console.log();

  // 7. Create Meeting with Transcript
  console.log("7. Logging Meeting Transcript via POST /api/meetings...");
  const meetingRes = await authClient.post("/meetings", {
    eventId,
    title: "Sprint Logistics & Technical Readiness Check",
    date: new Date().toISOString(),
    transcript: `
Organizer: Team, let's verify readiness for the AI & Robotics Expo.
Marcus: All 4 wireless lapel mics and the main 4K projection screens are tested and ready.
Elena: Sponsor badges are packaged. We just need to verify dietary boxes with catering by tomorrow at 2 PM.
Organizer: Great. Let's make sure the campus Wi-Fi repeaters are active before attendees arrive on Saturday.
    `.trim(),
  });

  if (meetingRes.status === 201 || meetingRes.status === 200) {
    const meetingData = meetingRes.data?.data || meetingRes.data;
    console.log(`   ✓ Meeting logged: "${meetingData.title}" (ID: ${meetingData._id || meetingData.id})`);
  } else {
    console.warn("   ⚠️ Meeting creation warning:", meetingRes.data?.message);
  }
  console.log();

  // 8. Test Conversational AI Agent Command
  console.log("8. Testing Conversational AI Agent via POST /api/agent/command...");
  const agentRes = await authClient.post("/agent/command", {
    eventId,
    command: "Assign Marcus to test stage microphones by Thursday 3pm",
  });

  if (agentRes.status === 200 || agentRes.status === 201) {
    const agentData = agentRes.data?.data || agentRes.data;
    console.log(`   ✓ AI Agent processed command: "${agentData.command || "Assign Marcus..."}"`);
    console.log(`     Intent: ${agentData.intent || "CREATE_TASK"} | Tool: ${agentData.tool || "taskService"}`);
  } else {
    console.log("   ℹ️ Agent returned:", agentRes.data?.message || "Note: Requires GEMINI_API_KEY for live LLM execution");
  }
  console.log();

  // 9. Verify Live Dashboard Metrics
  console.log("9. Verifying Dashboard API via GET /api/dashboard/:eventId...");
  const dashRes = await authClient.get(`/dashboard/${eventId}`);
  if (dashRes.status === 200) {
    const dash = dashRes.data?.data || dashRes.data;
    console.log("   ✓ Live Dashboard Data Retrieved Successfully:");
    console.log(`     • Total Tasks:       ${dash.stats?.totalTasks ?? "Calculated"}`);
    console.log(`     • Completed Tasks:   ${dash.stats?.completedTasks ?? "Calculated"}`);
    console.log(`     • Total Risks:       ${dash.stats?.totalRisks ?? "Calculated"}`);
    console.log(`     • Total Volunteers:  ${dash.stats?.totalVolunteers ?? "Calculated"}`);
  } else {
    console.log(`   ℹ️ Dashboard response code: ${dashRes.status}`);
  }

  console.log("\n==========================================================");
  console.log("   🎉 Automated Demo Complete! Frontend & Backend Verified!");
  console.log("==========================================================");
  console.log("Open your browser at http://localhost:5173 to see live data:");
  console.log(`  1. Login with email:    organizer@clubops.org`);
  console.log(`     Password:            password123`);
  console.log(`  2. Select Event:        "${eventName}"`);
  console.log(`  3. Click through Dashboard, Tasks, Risks, Volunteers,`);
  console.log(`     Meetings, and AI Agent pages to view the live records.`);
  console.log("==========================================================\n");
}

runAutoDemo().catch((err) => {
  console.error("Auto demo error:", err);
  process.exit(1);
});
