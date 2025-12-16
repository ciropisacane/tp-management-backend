// Database Seed Script
import {
  PrismaClient,
  UserRole,
  DeliverableType,
  ProjectStatus,
  Priority,
} from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data (optional - comment out if you want to preserve data)
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.timeEntry.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.document.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectWorkflow.deleteMany();
  await prisma.projectTeam.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.workflowTemplate.deleteMany();
  await prisma.user.deleteMany();

  console.log("✨ Cleared existing data");

  // Hash password for all demo users
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create Users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "admin@tpmanager.com",
        passwordHash: hashedPassword,
        firstName: "Admin",
        lastName: "User",
        role: UserRole.admin,
        hourlyRate: 250,
      },
    }),
    prisma.user.create({
      data: {
        email: "partner@tpmanager.com",
        passwordHash: hashedPassword,
        firstName: "Sarah",
        lastName: "Partner",
        role: UserRole.partner,
        hourlyRate: 300,
      },
    }),
    prisma.user.create({
      data: {
        email: "manager@tpmanager.com",
        passwordHash: hashedPassword,
        firstName: "John",
        lastName: "Manager",
        role: UserRole.manager,
        hourlyRate: 200,
      },
    }),
    prisma.user.create({
      data: {
        email: "senior@tpmanager.com",
        passwordHash: hashedPassword,
        firstName: "Mike",
        lastName: "Senior",
        role: UserRole.senior,
        hourlyRate: 150,
      },
    }),
    prisma.user.create({
      data: {
        email: "consultant@tpmanager.com",
        passwordHash: hashedPassword,
        firstName: "Jane",
        lastName: "Consultant",
        role: UserRole.consultant,
        hourlyRate: 100,
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create Workflow Templates for Local File
  const localFileSteps = [
    {
      name: "Project Intake",
      description: "Gather client info, entity details, fiscal year",
      estimatedHours: 4,
      requiredInputs: ["client_info", "entity_details", "fiscal_year"],
    },
    {
      name: "Data Gathering",
      description: "Collect financial statements, contracts, questionnaires",
      estimatedHours: 16,
      requiredInputs: ["financial_statements", "contracts", "questionnaire"],
    },
    {
      name: "Functional Analysis",
      description: "Perform FAR analysis",
      estimatedHours: 24,
      outputs: ["FAR_analysis_report"],
    },
    {
      name: "Comparability Analysis",
      description: "Conduct benchmark study",
      estimatedHours: 32,
      outputs: ["benchmark_study", "arms_length_range"],
    },
    {
      name: "Drafting",
      description: "Draft Local File document",
      estimatedHours: 40,
      outputs: ["local_file_draft"],
    },
    {
      name: "Internal Review",
      description: "Internal quality review",
      estimatedHours: 8,
      outputs: ["reviewed_draft"],
    },
    {
      name: "Client Review",
      description: "Send to client for feedback",
      estimatedHours: 4,
      requiredInputs: ["client_feedback"],
    },
    {
      name: "Finalization",
      description: "Finalize and sign document",
      estimatedHours: 8,
      outputs: ["signed_local_file"],
    },
    {
      name: "Post-Delivery",
      description: "Archive documentation",
      estimatedHours: 2,
      outputs: ["archived_docs"],
    },
  ];

  for (let i = 0; i < localFileSteps.length; i++) {
    await prisma.workflowTemplate.create({
      data: {
        deliverableType: DeliverableType.LOCAL_FILE.toString(),
        stepSequence: i + 1,
        stepName: localFileSteps[i].name,
        stepDescription: localFileSteps[i].description,
        estimatedDurationHours: localFileSteps[i].estimatedHours,
        requiredInputs: localFileSteps[i].requiredInputs || [],
        outputs: localFileSteps[i].outputs || [],
      },
    });
  }

  // Create Workflow Templates for Benchmark Analysis
  const benchmarkSteps = [
    { name: "Project Scoping", estimatedHours: 4 },
    { name: "Search Strategy", estimatedHours: 8 },
    { name: "Database Search", estimatedHours: 16 },
    { name: "Qualitative Analysis", estimatedHours: 24 },
    { name: "Financial Analysis", estimatedHours: 20 },
    { name: "Comparability Adjustments", estimatedHours: 12 },
    { name: "Benchmarking Report", estimatedHours: 16 },
    { name: "Quality Assurance", estimatedHours: 8 },
    { name: "Delivery", estimatedHours: 4 },
  ];

  for (let i = 0; i < benchmarkSteps.length; i++) {
    await prisma.workflowTemplate.create({
      data: {
        deliverableType: DeliverableType.BENCHMARK_ANALYSIS.toString(),
        stepSequence: i + 1,
        stepName: benchmarkSteps[i].name,
        estimatedDurationHours: benchmarkSteps[i].estimatedHours,
      },
    });
  }

  console.log("✅ Created workflow templates");

  // Create Clients
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: "Acme Corporation",
        industry: "Manufacturing",
        country: "United States",
        contactName: "Robert Johnson",
        contactEmail: "robert.j@acme.com",
        contactPhone: "+1-555-0101",
      },
    }),
    prisma.client.create({
      data: {
        name: "TechStart Global",
        industry: "Technology",
        country: "United Kingdom",
        contactName: "Emma Wilson",
        contactEmail: "emma.w@techstart.com",
        contactPhone: "+44-20-7123-4567",
      },
    }),
    prisma.client.create({
      data: {
        name: "Global Pharma Inc",
        industry: "Pharmaceuticals",
        country: "Germany",
        contactName: "Klaus Schmidt",
        contactEmail: "k.schmidt@globalpharma.de",
        contactPhone: "+49-30-12345678",
      },
    }),
  ]);

  console.log(`✅ Created ${clients.length} clients`);

  // Create Projects
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        clientId: clients[0].id,
        projectName: "FY2024 Local File",
        deliverableType: DeliverableType.LOCAL_FILE,
        status: ProjectStatus.ANALYSIS,
        priority: Priority.high,
        startDate: new Date("2024-01-15"),
        deadline: new Date("2024-03-31"),
        estimatedHours: 140,
        actualHours: 78,
        budget: 28000,
        actualCost: 15600,
        projectManagerId: users[2].id, // Manager
        description:
          "Preparation of Local File documentation for FY2024 transfer pricing compliance",
        riskLevel: "medium",
      },
    }),
    prisma.project.create({
      data: {
        clientId: clients[1].id,
        projectName: "IP Transfer Benchmark Study",
        deliverableType: DeliverableType.BENCHMARK_ANALYSIS,
        status: ProjectStatus.DRAFTING,
        priority: Priority.urgent,
        startDate: new Date("2024-02-01"),
        deadline: new Date("2024-02-28"),
        estimatedHours: 112,
        actualHours: 94,
        budget: 22400,
        actualCost: 18800,
        projectManagerId: users[2].id,
        description: "Benchmark analysis for IP licensing agreement",
        riskLevel: "high",
      },
    }),
    prisma.project.create({
      data: {
        clientId: clients[2].id,
        projectName: "Transfer Pricing Policy Update",
        deliverableType: DeliverableType.TP_POLICY,
        status: ProjectStatus.PLANNING,
        priority: Priority.medium,
        startDate: new Date("2024-03-01"),
        deadline: new Date("2024-06-30"),
        estimatedHours: 200,
        actualHours: 32,
        budget: 40000,
        actualCost: 6400,
        projectManagerId: users[1].id, // Partner
        description: "Comprehensive update of group Transfer Pricing Policy",
        riskLevel: "medium",
      },
    }),
  ]);

  console.log(`✅ Created ${projects.length} projects`);

  // Create Project Teams
  await prisma.projectTeam.createMany({
    data: [
      {
        projectId: projects[0].id,
        userId: users[2].id,
        roleInProject: "project_manager",
        allocationPercentage: 30,
        assignedDate: new Date("2024-01-15"),
      },
      {
        projectId: projects[0].id,
        userId: users[3].id,
        roleInProject: "senior",
        allocationPercentage: 60,
        assignedDate: new Date("2024-01-15"),
      },
      {
        projectId: projects[0].id,
        userId: users[4].id,
        roleInProject: "consultant",
        allocationPercentage: 80,
        assignedDate: new Date("2024-01-15"),
      },

      {
        projectId: projects[1].id,
        userId: users[2].id,
        roleInProject: "project_manager",
        allocationPercentage: 25,
        assignedDate: new Date("2024-02-01"),
      },
      {
        projectId: projects[1].id,
        userId: users[3].id,
        roleInProject: "senior",
        allocationPercentage: 70,
        assignedDate: new Date("2024-02-01"),
      },

      {
        projectId: projects[2].id,
        userId: users[1].id,
        roleInProject: "project_manager",
        allocationPercentage: 20,
        assignedDate: new Date("2024-03-01"),
      },
      {
        projectId: projects[2].id,
        userId: users[3].id,
        roleInProject: "senior",
        allocationPercentage: 40,
        assignedDate: new Date("2024-03-01"),
      },
    ],
  });

  console.log("✅ Created project teams");

  // Create Tasks
  await prisma.task.createMany({
    data: [
      {
        projectId: projects[0].id,
        title: "Complete FAR Analysis",
        description:
          "Perform functional, asset, and risk analysis for Acme Corp",
        assignedTo: users[3].id,
        createdBy: users[2].id,
        status: "in_progress",
        priority: Priority.high,
        dueDate: new Date("2024-12-20"),
        estimatedHours: 24,
        actualHours: 18,
      },
      {
        projectId: projects[0].id,
        title: "Gather financial statements",
        description: "Collect FY2024 financial statements from client",
        assignedTo: users[4].id,
        createdBy: users[2].id,
        status: "completed",
        priority: Priority.medium,
        dueDate: new Date("2024-01-25"),
        estimatedHours: 4,
        actualHours: 3,
        completedAt: new Date("2024-01-24"),
      },
      {
        projectId: projects[1].id,
        title: "Database search for comparables",
        description:
          "Search Orbis database for comparable IP licensing transactions",
        assignedTo: users[3].id,
        createdBy: users[2].id,
        status: "in_progress",
        priority: Priority.urgent,
        dueDate: new Date("2024-12-18"),
        estimatedHours: 16,
        actualHours: 12,
      },
    ],
  });

  console.log("✅ Created tasks");

  // Create Milestones
  await prisma.milestone.createMany({
    data: [
      {
        projectId: projects[0].id,
        milestoneName: "Data Collection Complete",
        dueDate: new Date("2024-02-15"),
        status: "completed",
        completionDate: new Date("2024-02-14"),
      },
      {
        projectId: projects[0].id,
        milestoneName: "Draft Report Ready",
        dueDate: new Date("2024-03-15"),
        status: "pending",
      },
      {
        projectId: projects[1].id,
        milestoneName: "Benchmark Analysis Complete",
        dueDate: new Date("2024-02-25"),
        status: "pending",
      },
    ],
  });

  console.log("✅ Created milestones");

  // Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: users[3].id,
        projectId: projects[0].id,
        notificationType: "task_assigned",
        title: "New Task Assigned",
        message: "You have been assigned to complete FAR Analysis",
        linkUrl: "/tasks/1",
        read: false,
      },
      {
        userId: users[2].id,
        projectId: projects[1].id,
        notificationType: "deadline_approaching",
        title: "Deadline Approaching",
        message: "IP Transfer Benchmark Study deadline in 3 days",
        linkUrl: "/projects/2",
        read: false,
      },
    ],
  });

  console.log("✅ Created notifications");

  console.log("🎉 Seeding completed successfully!");
  console.log("\n📝 Demo Users:");
  console.log("Admin: admin@tpmanager.com / password123");
  console.log("Partner: partner@tpmanager.com / password123");
  console.log("Manager: manager@tpmanager.com / password123");
  console.log("Senior: senior@tpmanager.com / password123");
  console.log("Consultant: consultant@tpmanager.com / password123");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
