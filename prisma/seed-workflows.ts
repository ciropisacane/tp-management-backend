// backend/prisma/seed-workflows.ts
// Run this to create workflow templates

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedWorkflowTemplates() {
  console.log('🌱 Seeding workflow templates...');

  // Master File Workflow Template
  const masterFileTemplate = await prisma.workflowTemplate.upsert({
    where: { 
      deliverableType_name: {
        deliverableType: 'MASTER_FILE',
        name: 'Master File Standard Workflow',
      }
    },
    update: {},
    create: {
      name: 'Master File Standard Workflow',
      description: 'Standard workflow for Master File preparation',
      deliverableType: 'MASTER_FILE',
      isActive: true,
      steps: {
        create: [
          {
            stepName: 'Data Collection',
            description: 'Gather all required financial and operational data',
            order: 1,
            estimatedDays: 5,
            requiredRole: 'consultant',
          },
          {
            stepName: 'Functional Analysis',
            description: 'Analyze functions, risks, and assets',
            order: 2,
            estimatedDays: 7,
            requiredRole: 'senior',
          },
          {
            stepName: 'Comparability Analysis',
            description: 'Search and select comparable companies',
            order: 3,
            estimatedDays: 10,
            requiredRole: 'senior',
          },
          {
            stepName: 'Economic Analysis',
            description: 'Perform transfer pricing calculations',
            order: 4,
            estimatedDays: 7,
            requiredRole: 'senior',
          },
          {
            stepName: 'Benchmarking',
            description: 'Run statistical tests and validate results',
            order: 5,
            estimatedDays: 5,
            requiredRole: 'senior',
          },
          {
            stepName: 'Draft Preparation',
            description: 'Write Master File document',
            order: 6,
            estimatedDays: 10,
            requiredRole: 'consultant',
          },
          {
            stepName: 'Quality Review',
            description: 'Partner and technical review',
            order: 7,
            estimatedDays: 5,
            requiredRole: 'partner',
          },
          {
            stepName: 'Finalization',
            description: 'Address comments and finalize document',
            order: 8,
            estimatedDays: 3,
            requiredRole: 'consultant',
          },
        ],
      },
    },
  });

  // Local File Workflow Template
  const localFileTemplate = await prisma.workflowTemplate.upsert({
    where: {
      deliverableType_name: {
        deliverableType: 'LOCAL_FILE',
        name: 'Local File Standard Workflow',
      }
    },
    update: {},
    create: {
      name: 'Local File Standard Workflow',
      description: 'Standard workflow for Local File preparation',
      deliverableType: 'LOCAL_FILE',
      isActive: true,
      steps: {
        create: [
          {
            stepName: 'Data Collection',
            description: 'Gather local entity financial data',
            order: 1,
            estimatedDays: 3,
            requiredRole: 'consultant',
          },
          {
            stepName: 'Transaction Analysis',
            description: 'Analyze intercompany transactions',
            order: 2,
            estimatedDays: 5,
            requiredRole: 'senior',
          },
          {
            stepName: 'Transfer Pricing Policy',
            description: 'Document TP policies and methods',
            order: 3,
            estimatedDays: 7,
            requiredRole: 'senior',
          },
          {
            stepName: 'Draft Preparation',
            description: 'Write Local File document',
            order: 4,
            estimatedDays: 7,
            requiredRole: 'consultant',
          },
          {
            stepName: 'Review & Finalization',
            description: 'Review and finalize document',
            order: 5,
            estimatedDays: 3,
            requiredRole: 'manager',
          },
        ],
      },
    },
  });

  // Benchmarking Study Workflow Template
  const benchmarkingTemplate = await prisma.workflowTemplate.upsert({
    where: {
      deliverableType_name: {
        deliverableType: 'BENCHMARKING_STUDY',
        name: 'Benchmarking Study Workflow',
      }
    },
    update: {},
    create: {
      name: 'Benchmarking Study Workflow',
      description: 'Workflow for benchmarking studies',
      deliverableType: 'BENCHMARKING_STUDY',
      isActive: true,
      steps: {
        create: [
          {
            stepName: 'Scope Definition',
            description: 'Define tested party and transactions',
            order: 1,
            estimatedDays: 2,
            requiredRole: 'senior',
          },
          {
            stepName: 'Database Search',
            description: 'Search comparable companies in databases',
            order: 2,
            estimatedDays: 5,
            requiredRole: 'consultant',
          },
          {
            stepName: 'Screening',
            description: 'Apply screening criteria',
            order: 3,
            estimatedDays: 3,
            requiredRole: 'consultant',
          },
          {
            stepName: 'Financial Analysis',
            description: 'Calculate financial indicators',
            order: 4,
            estimatedDays: 5,
            requiredRole: 'senior',
          },
          {
            stepName: 'Statistical Testing',
            description: 'Perform statistical tests',
            order: 5,
            estimatedDays: 3,
            requiredRole: 'senior',
          },
          {
            stepName: 'Report Preparation',
            description: 'Prepare benchmarking report',
            order: 6,
            estimatedDays: 5,
            requiredRole: 'consultant',
          },
        ],
      },
    },
  });

  console.log('✅ Workflow templates created:');
  console.log(`  - ${masterFileTemplate.name}`);
  console.log(`  - ${localFileTemplate.name}`);
  console.log(`  - ${benchmarkingTemplate.name}`);
}

seedWorkflowTemplates()
  .catch((e) => {
    console.error('❌ Error seeding workflow templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
