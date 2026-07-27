import type { IndustryPack } from "../industry-pack-schema.js";

export const constructionPack = {
  "schemaVersion": "1.0",
  "id": "construction",
  "name": "Construction",
  "description": "Project-based construction with contractors, HSE, progress billing, and site coordination.",
  "aliases": [
    "construction",
    "contractor",
    "building",
    "civil",
    "پروژه عمرانی",
    "ساخت‌وساز",
    "پیمانکاری"
  ],
  "ceoConcerns": [
    {
      "id": "cc-schedule",
      "title": "Schedule slippage",
      "description": "Keeping critical-path milestones on time.",
      "priority": "HIGH"
    },
    {
      "id": "cc-cost",
      "title": "Cost overrun",
      "description": "Controlling budget versus earned value.",
      "priority": "HIGH"
    },
    {
      "id": "cc-hse",
      "title": "HSE incidents",
      "description": "Preventing injuries and HSE findings.",
      "priority": "HIGH"
    },
    {
      "id": "cc-cash",
      "title": "Cash flow & billing",
      "description": "Timely progress claims and collections.",
      "priority": "MEDIUM"
    },
    {
      "id": "cc-subs",
      "title": "Subcontractor performance",
      "description": "Quality and punctuality of subcontractors.",
      "priority": "MEDIUM"
    },
    {
      "id": "cc-claims",
      "title": "Claims & variations",
      "description": "Managing change orders without margin erosion.",
      "priority": "MEDIUM"
    }
  ],
  "kpis": [
    {
      "id": "kpi-spi",
      "name": "Schedule performance index",
      "description": "Earned versus planned schedule.",
      "unit": "RATE",
      "direction": "TARGET",
      "department": "projects"
    },
    {
      "id": "kpi-cpi",
      "name": "Cost performance index",
      "description": "Earned versus actual cost.",
      "unit": "RATE",
      "direction": "TARGET",
      "department": "projects"
    },
    {
      "id": "kpi-safety-trir",
      "name": "TRIR",
      "description": "Total recordable incident rate.",
      "unit": "RATE",
      "direction": "LOWER_IS_BETTER",
      "department": "hse"
    },
    {
      "id": "kpi-ncr",
      "name": "Open NCRs",
      "description": "Open quality nonconformances.",
      "unit": "NUMBER",
      "direction": "LOWER_IS_BETTER",
      "department": "quality"
    },
    {
      "id": "kpi-progress",
      "name": "Physical progress %",
      "description": "Percent complete versus plan.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "projects"
    },
    {
      "id": "kpi-billing",
      "name": "Billing accuracy",
      "description": "Approved claims versus submitted.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "finance"
    },
    {
      "id": "kpi-sub-otd",
      "name": "Subcontractor on-time",
      "description": "Sub packages completed on time.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "procurement"
    },
    {
      "id": "kpi-rfis",
      "name": "RFI cycle time",
      "description": "Average days to close RFIs.",
      "unit": "DURATION",
      "direction": "LOWER_IS_BETTER",
      "department": "projects"
    },
    {
      "id": "kpi-rework",
      "name": "Rework cost",
      "description": "Rework cost versus budget.",
      "unit": "PERCENT",
      "direction": "LOWER_IS_BETTER",
      "department": "quality"
    },
    {
      "id": "kpi-cash",
      "name": "Project cash position",
      "description": "Collections minus disbursements.",
      "unit": "CURRENCY",
      "direction": "HIGHER_IS_BETTER",
      "department": "finance"
    }
  ],
  "departments": [
    {
      "id": "dept-projects",
      "name": "Project Controls",
      "description": "Schedule, cost, reporting.",
      "core": true
    },
    {
      "id": "dept-site",
      "name": "Site Operations",
      "description": "Field execution.",
      "core": true
    },
    {
      "id": "dept-hse",
      "name": "HSE",
      "description": "Health, safety, environment.",
      "core": true
    },
    {
      "id": "dept-quality",
      "name": "Quality",
      "description": "Inspection and NCR.",
      "core": true
    },
    {
      "id": "dept-procurement",
      "name": "Procurement",
      "description": "Subs and materials.",
      "core": true
    },
    {
      "id": "dept-finance",
      "name": "Finance",
      "description": "Billing and cash.",
      "core": true
    },
    {
      "id": "dept-engineering",
      "name": "Engineering",
      "description": "Design and RFIs.",
      "core": false
    }
  ],
  "roles": [
    {
      "id": "role-pm",
      "title": "Project Manager",
      "departmentId": "dept-projects",
      "description": "Owns project delivery."
    },
    {
      "id": "role-site-mgr",
      "title": "Site Manager",
      "departmentId": "dept-site",
      "description": "Owns daily site execution."
    },
    {
      "id": "role-hse",
      "title": "HSE Officer",
      "departmentId": "dept-hse",
      "description": "Owns site safety compliance."
    },
    {
      "id": "role-qa",
      "title": "QA/QC Engineer",
      "departmentId": "dept-quality",
      "description": "Owns inspections and NCRs."
    },
    {
      "id": "role-buyer",
      "title": "Procurement Lead",
      "departmentId": "dept-procurement",
      "description": "Owns subcontracts and POs."
    },
    {
      "id": "role-qs",
      "title": "Quantity Surveyor",
      "departmentId": "dept-finance",
      "description": "Owns progress claims."
    },
    {
      "id": "role-engineer",
      "title": "Site Engineer",
      "departmentId": "dept-engineering",
      "description": "Owns RFIs and field engineering."
    }
  ],
  "workflowBlueprints": [
    {
      "id": "wf-project-setup",
      "name": "Project setup",
      "department": "projects",
      "purpose": "Baseline schedule, budget, and WBS.",
      "trigger": "Contract award",
      "stages": [
        "WBS",
        "Baseline schedule",
        "Budget",
        "Kickoff"
      ],
      "outputs": [
        "Baseline",
        "Kickoff pack"
      ]
    },
    {
      "id": "wf-daily-site",
      "name": "Daily site report",
      "department": "site",
      "purpose": "Capture progress, manpower, issues.",
      "trigger": "End of shift",
      "stages": [
        "Collect",
        "Review",
        "Publish",
        "Escalate"
      ],
      "outputs": [
        "Daily report"
      ]
    },
    {
      "id": "wf-hse-permit",
      "name": "HSE permit to work",
      "department": "hse",
      "purpose": "Authorize hazardous work safely.",
      "trigger": "High-risk activity",
      "stages": [
        "Request",
        "Risk assess",
        "Approve",
        "Close"
      ],
      "outputs": [
        "Permit",
        "Toolbox talk"
      ]
    },
    {
      "id": "wf-inspection",
      "name": "Inspection & NCR",
      "department": "quality",
      "purpose": "Inspect work and manage nonconformances.",
      "trigger": "Hold point or defect",
      "stages": [
        "Inspect",
        "Record",
        "NCR if fail",
        "Close"
      ],
      "outputs": [
        "Inspection record",
        "NCR"
      ]
    },
    {
      "id": "wf-sub-package",
      "name": "Subcontractor package",
      "department": "procurement",
      "purpose": "Award and manage a subcontract.",
      "trigger": "Package ready",
      "stages": [
        "Tender",
        "Award",
        "Mobilize",
        "Certify"
      ],
      "outputs": [
        "Subcontract",
        "Certificates"
      ]
    },
    {
      "id": "wf-progress-claim",
      "name": "Progress claim",
      "department": "finance",
      "purpose": "Submit and collect progress billing.",
      "trigger": "Billing period close",
      "stages": [
        "Measure",
        "Submit",
        "Approve",
        "Collect"
      ],
      "outputs": [
        "Claim",
        "Payment"
      ]
    },
    {
      "id": "wf-variation",
      "name": "Variation / change order",
      "department": "projects",
      "purpose": "Price and approve scope changes.",
      "trigger": "Change request",
      "stages": [
        "Describe",
        "Price",
        "Approve",
        "Update baseline"
      ],
      "outputs": [
        "Change order"
      ]
    },
    {
      "id": "wf-incident",
      "name": "HSE incident",
      "department": "hse",
      "purpose": "Respond to and investigate incidents.",
      "trigger": "Incident report",
      "stages": [
        "Secure",
        "Report",
        "Investigate",
        "Corrective actions"
      ],
      "outputs": [
        "Incident report",
        "Actions"
      ]
    }
  ],
  "dashboardBlueprints": [
    {
      "id": "dash-ceo",
      "name": "Portfolio Command",
      "audience": [
        "CEO",
        "PMO"
      ],
      "purpose": "Schedule, cost, and safety.",
      "kpiIds": [
        "kpi-spi",
        "kpi-cpi",
        "kpi-safety-trir",
        "kpi-cash"
      ],
      "sections": [
        "Portfolio",
        "HSE",
        "Cash"
      ]
    },
    {
      "id": "dash-project",
      "name": "Project Control",
      "audience": [
        "Project Manager"
      ],
      "purpose": "Earned value and risks.",
      "kpiIds": [
        "kpi-spi",
        "kpi-cpi",
        "kpi-progress",
        "kpi-rfis"
      ],
      "sections": [
        "Schedule",
        "Cost",
        "RFIs"
      ]
    },
    {
      "id": "dash-hse",
      "name": "HSE Dashboard",
      "audience": [
        "HSE Officer"
      ],
      "purpose": "Incidents and permits.",
      "kpiIds": [
        "kpi-safety-trir"
      ],
      "sections": [
        "Incidents",
        "Permits"
      ]
    },
    {
      "id": "dash-quality",
      "name": "Quality Dashboard",
      "audience": [
        "QA/QC"
      ],
      "purpose": "Inspections and NCRs.",
      "kpiIds": [
        "kpi-ncr",
        "kpi-rework"
      ],
      "sections": [
        "Open NCRs",
        "Rework"
      ]
    },
    {
      "id": "dash-commercial",
      "name": "Commercial / Billing",
      "audience": [
        "QS",
        "Finance"
      ],
      "purpose": "Claims and cash.",
      "kpiIds": [
        "kpi-billing",
        "kpi-cash",
        "kpi-sub-otd"
      ],
      "sections": [
        "Claims",
        "Subs",
        "Cash"
      ]
    }
  ],
  "aiAgentRoster": [
    {
      "id": "agent-pmo",
      "name": "PMO Briefing Agent",
      "mission": "Planning record: summarize portfolio risks and schedule slips.",
      "permissions": "SUGGEST",
      "inputs": [
        "SPI/CPI",
        "Milestones"
      ],
      "outputs": [
        "Brief"
      ]
    },
    {
      "id": "agent-schedule",
      "name": "Schedule Risk Agent",
      "mission": "Planning record: flag critical-path delay risks.",
      "permissions": "SUGGEST",
      "inputs": [
        "Schedule",
        "Daily reports"
      ],
      "outputs": [
        "Risk list"
      ],
      "department": "projects"
    },
    {
      "id": "agent-hse",
      "name": "HSE Advisor Agent",
      "mission": "Planning record: suggest permit follow-ups; no autonomous safety clearance.",
      "permissions": "APPROVAL_REQUIRED",
      "inputs": [
        "Permits",
        "Incidents"
      ],
      "outputs": [
        "HSE suggestions"
      ],
      "department": "hse"
    },
    {
      "id": "agent-commercial",
      "name": "Commercial Agent",
      "mission": "Planning record: draft claim checklists for QS review.",
      "permissions": "SUGGEST",
      "inputs": [
        "Progress",
        "Variations"
      ],
      "outputs": [
        "Claim notes"
      ],
      "department": "finance"
    },
    {
      "id": "agent-quality",
      "name": "Quality Triage Agent",
      "mission": "Planning record: cluster NCRs and suggest dispositions.",
      "permissions": "SUGGEST",
      "inputs": [
        "NCRs"
      ],
      "outputs": [
        "Triage notes"
      ],
      "department": "quality"
    }
  ],
  "mockSchema": {
    "entities": [
      {
        "id": "ent-project",
        "name": "Project",
        "description": "Construction project.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "name",
            "type": "STRING",
            "required": true
          },
          {
            "name": "budget",
            "type": "CURRENCY",
            "required": true
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "PLANNING",
              "ACTIVE",
              "COMPLETE",
              "ON_HOLD"
            ]
          }
        ]
      },
      {
        "id": "ent-wbs",
        "name": "WbsItem",
        "description": "WBS item.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "projectId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-project"
          },
          {
            "name": "code",
            "type": "STRING",
            "required": true
          },
          {
            "name": "name",
            "type": "STRING",
            "required": true
          }
        ]
      },
      {
        "id": "ent-subcontractor",
        "name": "Subcontractor",
        "description": "Specialist contractor.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "name",
            "type": "STRING",
            "required": true
          },
          {
            "name": "trade",
            "type": "STRING",
            "required": true
          }
        ]
      },
      {
        "id": "ent-package",
        "name": "WorkPackage",
        "description": "Subcontracted package.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "projectId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-project"
          },
          {
            "name": "subcontractorId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-subcontractor"
          },
          {
            "name": "value",
            "type": "CURRENCY",
            "required": true
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "TENDER",
              "AWARDED",
              "ACTIVE",
              "CLOSED"
            ]
          }
        ]
      },
      {
        "id": "ent-daily",
        "name": "DailyReport",
        "description": "Site daily report.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "projectId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-project"
          },
          {
            "name": "reportDate",
            "type": "DATE",
            "required": true
          },
          {
            "name": "manpower",
            "type": "NUMBER",
            "required": true
          }
        ]
      },
      {
        "id": "ent-incident",
        "name": "HseIncident",
        "description": "Safety incident.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "projectId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-project"
          },
          {
            "name": "occurredAt",
            "type": "DATETIME",
            "required": true
          },
          {
            "name": "severity",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "LOW",
              "MEDIUM",
              "HIGH",
              "CRITICAL"
            ]
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "OPEN",
              "CLOSED"
            ]
          }
        ]
      },
      {
        "id": "ent-ncr",
        "name": "Ncr",
        "description": "Quality nonconformance.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "projectId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-project"
          },
          {
            "name": "openedAt",
            "type": "DATE",
            "required": true
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "OPEN",
              "CLOSED"
            ]
          }
        ]
      },
      {
        "id": "ent-claim",
        "name": "ProgressClaim",
        "description": "Progress billing claim.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "projectId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-project"
          },
          {
            "name": "periodEnd",
            "type": "DATE",
            "required": true
          },
          {
            "name": "amount",
            "type": "CURRENCY",
            "required": true
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "DRAFT",
              "SUBMITTED",
              "APPROVED",
              "PAID"
            ]
          }
        ]
      }
    ],
    "relationships": [
      {
        "fromEntityId": "ent-project",
        "toEntityId": "ent-wbs",
        "type": "ONE_TO_MANY",
        "description": "Project has WBS."
      },
      {
        "fromEntityId": "ent-project",
        "toEntityId": "ent-package",
        "type": "ONE_TO_MANY",
        "description": "Project has packages."
      },
      {
        "fromEntityId": "ent-subcontractor",
        "toEntityId": "ent-package",
        "type": "ONE_TO_MANY",
        "description": "Subcontractor holds packages."
      },
      {
        "fromEntityId": "ent-project",
        "toEntityId": "ent-daily",
        "type": "ONE_TO_MANY",
        "description": "Project has daily reports."
      },
      {
        "fromEntityId": "ent-project",
        "toEntityId": "ent-incident",
        "type": "ONE_TO_MANY",
        "description": "Project has incidents."
      },
      {
        "fromEntityId": "ent-project",
        "toEntityId": "ent-ncr",
        "type": "ONE_TO_MANY",
        "description": "Project has NCRs."
      },
      {
        "fromEntityId": "ent-project",
        "toEntityId": "ent-claim",
        "type": "ONE_TO_MANY",
        "description": "Project has claims."
      }
    ]
  },
  "terminology": {
    "SPI": [
      "Schedule Performance Index"
    ],
    "CPI": [
      "Cost Performance Index"
    ],
    "TRIR": [
      "Total Recordable Incident Rate"
    ],
    "RFI": [
      "Request for Information"
    ],
    "HSE": [
      "Health Safety Environment",
      "ایمنی"
    ],
    "WBS": [
      "Work Breakdown Structure"
    ]
  },
  "risks": [
    "HSE failures can stop work and create liability.",
    "Unapproved variations erode margin.",
    "Subcontractor insolvency delays critical path.",
    "AI must not approve permits or safety clearances."
  ],
  "recommendedIntegrations": [
    {
      "name": "Project controls",
      "category": "projects",
      "purpose": "Schedule and earned value."
    },
    {
      "name": "Document control",
      "category": "engineering",
      "purpose": "Drawings, RFIs, submittals."
    },
    {
      "name": "HSE system",
      "category": "hse",
      "purpose": "Permits, incidents, observations."
    },
    {
      "name": "ERP / job costing",
      "category": "finance",
      "purpose": "Costs, claims, AP."
    }
  ]
} satisfies IndustryPack;
