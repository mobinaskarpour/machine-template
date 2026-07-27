import type { IndustryPack } from "../industry-pack-schema.js";

export const legalPack = {
  "schemaVersion": "1.0",
  "id": "legal",
  "name": "Legal Practice",
  "description": "Law firm and legal ops pack covering matters, billing, conflict checks, and human-review constraints.",
  "aliases": [
    "legal",
    "law firm",
    "attorney",
    "litigation",
    "حقوقی",
    "وکالت",
    "دعاوی"
  ],
  "ceoConcerns": [
    {
      "id": "cc-utilization",
      "title": "Lawyer utilization",
      "description": "Keeping billable utilization on target.",
      "priority": "HIGH"
    },
    {
      "id": "cc-collections",
      "title": "Collections & WIP",
      "description": "Converting WIP and AR to cash.",
      "priority": "HIGH"
    },
    {
      "id": "cc-conflicts",
      "title": "Conflict risk",
      "description": "Preventing conflicted representations.",
      "priority": "HIGH"
    },
    {
      "id": "cc-deadlines",
      "title": "Matter deadlines",
      "description": "Avoiding missed court or filing deadlines.",
      "priority": "HIGH"
    },
    {
      "id": "cc-realization",
      "title": "Rate realization",
      "description": "Billed versus standard rates.",
      "priority": "MEDIUM"
    },
    {
      "id": "cc-ethics",
      "title": "Ethics & review",
      "description": "Ensuring human review on advice and filings.",
      "priority": "HIGH"
    }
  ],
  "kpis": [
    {
      "id": "kpi-utilization",
      "name": "Billable utilization",
      "description": "Billable hours versus available.",
      "unit": "PERCENT",
      "direction": "TARGET",
      "department": "practice"
    },
    {
      "id": "kpi-realization",
      "name": "Realization rate",
      "description": "Billed versus standard value.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "finance"
    },
    {
      "id": "kpi-collection",
      "name": "Collection rate",
      "description": "Collected versus billed.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "finance"
    },
    {
      "id": "kpi-dso",
      "name": "AR DSO",
      "description": "Days sales outstanding.",
      "unit": "DURATION",
      "direction": "LOWER_IS_BETTER",
      "department": "finance"
    },
    {
      "id": "kpi-wip",
      "name": "WIP aging",
      "description": "Unbilled WIP value.",
      "unit": "CURRENCY",
      "direction": "LOWER_IS_BETTER",
      "department": "finance"
    },
    {
      "id": "kpi-matter-cycle",
      "name": "Matter cycle time",
      "description": "Open to close duration.",
      "unit": "DURATION",
      "direction": "LOWER_IS_BETTER",
      "department": "practice"
    },
    {
      "id": "kpi-deadline-breach",
      "name": "Deadline breaches",
      "description": "Missed deadlines count.",
      "unit": "NUMBER",
      "direction": "LOWER_IS_BETTER",
      "department": "practice"
    },
    {
      "id": "kpi-conflict-flags",
      "name": "Open conflict flags",
      "description": "Unresolved conflict checks.",
      "unit": "NUMBER",
      "direction": "LOWER_IS_BETTER",
      "department": "risk"
    },
    {
      "id": "kpi-leverage",
      "name": "Leverage ratio",
      "description": "Associates versus partners.",
      "unit": "RATE",
      "direction": "TARGET",
      "department": "practice"
    },
    {
      "id": "kpi-nps",
      "name": "Client NPS",
      "description": "Client satisfaction score.",
      "unit": "SCORE",
      "direction": "HIGHER_IS_BETTER",
      "department": "client"
    }
  ],
  "departments": [
    {
      "id": "dept-practice",
      "name": "Practice",
      "description": "Matter delivery.",
      "core": true
    },
    {
      "id": "dept-finance",
      "name": "Finance",
      "description": "Time, billing, collections.",
      "core": true
    },
    {
      "id": "dept-risk",
      "name": "Risk & Conflicts",
      "description": "Conflicts and ethics.",
      "core": true
    },
    {
      "id": "dept-bd",
      "name": "Business Development",
      "description": "Origination and pursuits.",
      "core": false
    },
    {
      "id": "dept-ops",
      "name": "Legal Ops",
      "description": "Process and knowledge.",
      "core": false
    },
    {
      "id": "dept-client",
      "name": "Client Success",
      "description": "Relationship health.",
      "core": false
    }
  ],
  "roles": [
    {
      "id": "role-partner",
      "title": "Partner",
      "departmentId": "dept-practice",
      "description": "Owns matters and client relationships."
    },
    {
      "id": "role-associate",
      "title": "Associate",
      "departmentId": "dept-practice",
      "description": "Owns drafting and research under supervision."
    },
    {
      "id": "role-billing",
      "title": "Billing Manager",
      "departmentId": "dept-finance",
      "description": "Owns invoices and WIP."
    },
    {
      "id": "role-conflicts",
      "title": "Conflicts Counsel",
      "departmentId": "dept-risk",
      "description": "Owns conflict checks."
    },
    {
      "id": "role-bd",
      "title": "BD Lead",
      "departmentId": "dept-bd",
      "description": "Owns pursuits."
    },
    {
      "id": "role-ops",
      "title": "Legal Ops Manager",
      "departmentId": "dept-ops",
      "description": "Owns workflows and knowledge."
    }
  ],
  "workflowBlueprints": [
    {
      "id": "wf-intake",
      "name": "Matter intake",
      "department": "practice",
      "purpose": "Open a matter after conflict clearance.",
      "trigger": "New engagement request",
      "stages": [
        "Capture facts",
        "Conflict check",
        "Engagement letter",
        "Open matter"
      ],
      "outputs": [
        "Matter",
        "Engagement letter"
      ]
    },
    {
      "id": "wf-conflict",
      "name": "Conflict check",
      "department": "risk",
      "purpose": "Screen parties for conflicts.",
      "trigger": "Intake or new party",
      "stages": [
        "Identify parties",
        "Search",
        "Flag",
        "Human clearance"
      ],
      "outputs": [
        "Conflict report",
        "Clearance"
      ]
    },
    {
      "id": "wf-time-entry",
      "name": "Time entry & review",
      "department": "finance",
      "purpose": "Capture and approve time.",
      "trigger": "Daily time",
      "stages": [
        "Enter",
        "Review",
        "Approve",
        "Post to WIP"
      ],
      "outputs": [
        "Approved time"
      ]
    },
    {
      "id": "wf-billing",
      "name": "Billing cycle",
      "department": "finance",
      "purpose": "Bill WIP and collect.",
      "trigger": "Billing period",
      "stages": [
        "Prebill",
        "Partner edit",
        "Invoice",
        "Collect"
      ],
      "outputs": [
        "Invoice",
        "Payment"
      ]
    },
    {
      "id": "wf-deadline",
      "name": "Deadline management",
      "department": "practice",
      "purpose": "Track and complete deadlines.",
      "trigger": "Deadline created",
      "stages": [
        "Calendar",
        "Assign",
        "Prepare",
        "File/confirm"
      ],
      "outputs": [
        "Deadline closure"
      ]
    },
    {
      "id": "wf-research",
      "name": "Research & draft review",
      "department": "practice",
      "purpose": "Produce work product with human review.",
      "trigger": "Task assigned",
      "stages": [
        "Research",
        "Draft",
        "Human review",
        "Finalize"
      ],
      "outputs": [
        "Work product"
      ]
    }
  ],
  "dashboardBlueprints": [
    {
      "id": "dash-ceo",
      "name": "Firm Command",
      "audience": [
        "Managing Partner"
      ],
      "purpose": "Utilization, collections, risk.",
      "kpiIds": [
        "kpi-utilization",
        "kpi-collection",
        "kpi-conflict-flags",
        "kpi-deadline-breach"
      ],
      "sections": [
        "Productivity",
        "Cash",
        "Risk"
      ]
    },
    {
      "id": "dash-finance",
      "name": "Billing & Collections",
      "audience": [
        "Billing Manager"
      ],
      "purpose": "WIP, realization, DSO.",
      "kpiIds": [
        "kpi-wip",
        "kpi-realization",
        "kpi-dso",
        "kpi-collection"
      ],
      "sections": [
        "WIP",
        "AR"
      ]
    },
    {
      "id": "dash-practice",
      "name": "Matter Performance",
      "audience": [
        "Partners"
      ],
      "purpose": "Cycle time and deadlines.",
      "kpiIds": [
        "kpi-matter-cycle",
        "kpi-deadline-breach",
        "kpi-utilization"
      ],
      "sections": [
        "Matters",
        "Deadlines"
      ]
    },
    {
      "id": "dash-risk",
      "name": "Conflicts & Ethics",
      "audience": [
        "Conflicts Counsel"
      ],
      "purpose": "Open conflict flags.",
      "kpiIds": [
        "kpi-conflict-flags"
      ],
      "sections": [
        "Flags",
        "Clearances"
      ]
    },
    {
      "id": "dash-client",
      "name": "Client Health",
      "audience": [
        "BD",
        "Partners"
      ],
      "purpose": "NPS and leverage context.",
      "kpiIds": [
        "kpi-nps",
        "kpi-leverage"
      ],
      "sections": [
        "NPS",
        "Coverage"
      ]
    }
  ],
  "aiAgentRoster": [
    {
      "id": "agent-intake",
      "name": "Intake Structuring Agent",
      "mission": "Planning record: structure intake facts for conflict screening; no engagement decisions.",
      "permissions": "SUGGEST",
      "inputs": [
        "Intake form"
      ],
      "outputs": [
        "Structured intake"
      ],
      "department": "practice"
    },
    {
      "id": "agent-conflict",
      "name": "Conflict Screening Agent",
      "mission": "Planning record: suggest potential conflicts for human clearance only.",
      "permissions": "APPROVAL_REQUIRED",
      "inputs": [
        "Parties",
        "Matter DB"
      ],
      "outputs": [
        "Conflict candidates"
      ],
      "department": "risk"
    },
    {
      "id": "agent-research",
      "name": "Research Assistant Agent",
      "mission": "Planning record: draft research memos requiring human attorney review before client use.",
      "permissions": "APPROVAL_REQUIRED",
      "inputs": [
        "Matter facts",
        "Authorities"
      ],
      "outputs": [
        "Draft memo"
      ],
      "department": "practice"
    },
    {
      "id": "agent-billing",
      "name": "Billing Advisor Agent",
      "mission": "Planning record: flag WIP aging and suggest prebill focus.",
      "permissions": "SUGGEST",
      "inputs": [
        "WIP",
        "Time"
      ],
      "outputs": [
        "Prebill focus"
      ],
      "department": "finance"
    },
    {
      "id": "agent-deadline",
      "name": "Deadline Monitor Agent",
      "mission": "Planning record: surface upcoming deadlines; no autonomous filings.",
      "permissions": "READ_ONLY",
      "inputs": [
        "Calendar"
      ],
      "outputs": [
        "Deadline alerts"
      ],
      "department": "practice"
    }
  ],
  "mockSchema": {
    "entities": [
      {
        "id": "ent-client",
        "name": "Client",
        "description": "Client entity.",
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
          }
        ]
      },
      {
        "id": "ent-matter",
        "name": "Matter",
        "description": "Legal matter.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "clientId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-client"
          },
          {
            "name": "title",
            "type": "STRING",
            "required": true
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "INTAKE",
              "OPEN",
              "CLOSED"
            ]
          },
          {
            "name": "openedAt",
            "type": "DATE",
            "required": true
          }
        ]
      },
      {
        "id": "ent-party",
        "name": "Party",
        "description": "Related party for conflicts.",
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
            "name": "role",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "CLIENT",
              "ADVERSE",
              "RELATED"
            ]
          }
        ]
      },
      {
        "id": "ent-conflict-check",
        "name": "ConflictCheck",
        "description": "Conflict screening record.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "matterId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-matter"
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "PENDING",
              "CLEARED",
              "BLOCKED"
            ]
          },
          {
            "name": "reviewedAt",
            "type": "DATETIME",
            "required": false
          }
        ]
      },
      {
        "id": "ent-time-entry",
        "name": "TimeEntry",
        "description": "Billable time.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "matterId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-matter"
          },
          {
            "name": "hours",
            "type": "NUMBER",
            "required": true
          },
          {
            "name": "workedOn",
            "type": "DATE",
            "required": true
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "DRAFT",
              "APPROVED",
              "BILLED"
            ]
          }
        ]
      },
      {
        "id": "ent-invoice",
        "name": "Invoice",
        "description": "Client invoice.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "matterId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-matter"
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
              "SENT",
              "PAID",
              "OVERDUE"
            ]
          }
        ]
      },
      {
        "id": "ent-deadline",
        "name": "Deadline",
        "description": "Matter deadline.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "matterId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-matter"
          },
          {
            "name": "dueAt",
            "type": "DATETIME",
            "required": true
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "OPEN",
              "DONE",
              "MISSED"
            ]
          }
        ]
      }
    ],
    "relationships": [
      {
        "fromEntityId": "ent-client",
        "toEntityId": "ent-matter",
        "type": "ONE_TO_MANY",
        "description": "Client has matters."
      },
      {
        "fromEntityId": "ent-matter",
        "toEntityId": "ent-conflict-check",
        "type": "ONE_TO_MANY",
        "description": "Matter has conflict checks."
      },
      {
        "fromEntityId": "ent-matter",
        "toEntityId": "ent-time-entry",
        "type": "ONE_TO_MANY",
        "description": "Matter has time entries."
      },
      {
        "fromEntityId": "ent-matter",
        "toEntityId": "ent-invoice",
        "type": "ONE_TO_MANY",
        "description": "Matter has invoices."
      },
      {
        "fromEntityId": "ent-matter",
        "toEntityId": "ent-deadline",
        "type": "ONE_TO_MANY",
        "description": "Matter has deadlines."
      }
    ]
  },
  "terminology": {
    "WIP": [
      "Work in Progress"
    ],
    "Realization": [
      "Rate realization"
    ],
    "Conflict": [
      "Conflict of interest",
      "تعارض منافع"
    ],
    "Matter": [
      "Legal matter",
      "پرونده"
    ]
  },
  "risks": [
    "Conflicted representation creates ethical and malpractice exposure.",
    "AI outputs are planning records only and require human attorney review before client delivery.",
    "Autonomous filings or legal advice without APPROVAL_REQUIRED human review are prohibited.",
    "Missed deadlines can cause case-dispositive harm."
  ],
  "recommendedIntegrations": [
    {
      "name": "Practice management",
      "category": "core",
      "purpose": "Matters, time, billing."
    },
    {
      "name": "Document management",
      "category": "practice",
      "purpose": "Work product and versions."
    },
    {
      "name": "Conflicts database",
      "category": "risk",
      "purpose": "Party and matter screening."
    },
    {
      "name": "Court / calendar",
      "category": "practice",
      "purpose": "Deadlines and dockets."
    }
  ]
} satisfies IndustryPack;
