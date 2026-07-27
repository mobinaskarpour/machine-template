import type { IndustryPack } from "../industry-pack-schema.js";

export const oilGasPack = {
  "schemaVersion": "1.0",
  "id": "oil-gas",
  "name": "Oil & Gas",
  "description": "Upstream and midstream operations pack covering production, HSE, integrity, and logistics.",
  "aliases": [
    "oil and gas",
    "oil & gas",
    "upstream",
    "midstream",
    "petroleum",
    "نفت",
    "گاز",
    "پترولیوم"
  ],
  "ceoConcerns": [
    {
      "id": "cc-production",
      "title": "Production volume",
      "description": "Meeting daily production targets safely.",
      "priority": "HIGH"
    },
    {
      "id": "cc-hse",
      "title": "HSE & process safety",
      "description": "Preventing incidents and process-safety events.",
      "priority": "HIGH"
    },
    {
      "id": "cc-integrity",
      "title": "Asset integrity",
      "description": "Maintaining pipelines, wells, and facilities.",
      "priority": "HIGH"
    },
    {
      "id": "cc-deferment",
      "title": "Production deferment",
      "description": "Minimizing unplanned deferment.",
      "priority": "HIGH"
    },
    {
      "id": "cc-cost",
      "title": "Lifting cost",
      "description": "Controlling operating cost per barrel.",
      "priority": "MEDIUM"
    },
    {
      "id": "cc-logistics",
      "title": "Midstream logistics",
      "description": "Reliable offtake, storage, and transport.",
      "priority": "MEDIUM"
    }
  ],
  "kpis": [
    {
      "id": "kpi-production",
      "name": "Daily production",
      "description": "Oil/gas production volume.",
      "unit": "QUANTITY",
      "direction": "HIGHER_IS_BETTER",
      "department": "production"
    },
    {
      "id": "kpi-deferment",
      "name": "Deferment volume",
      "description": "Deferred production volume.",
      "unit": "QUANTITY",
      "direction": "LOWER_IS_BETTER",
      "department": "production"
    },
    {
      "id": "kpi-uptime",
      "name": "Facility uptime",
      "description": "Available versus calendar time.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "operations"
    },
    {
      "id": "kpi-trir",
      "name": "TRIR",
      "description": "Total recordable incident rate.",
      "unit": "RATE",
      "direction": "LOWER_IS_BETTER",
      "department": "hse"
    },
    {
      "id": "kpi-pse",
      "name": "Process safety events",
      "description": "Tier 1/2 process safety events.",
      "unit": "NUMBER",
      "direction": "LOWER_IS_BETTER",
      "department": "hse"
    },
    {
      "id": "kpi-flaring",
      "name": "Flaring intensity",
      "description": "Flared volume versus production.",
      "unit": "RATE",
      "direction": "LOWER_IS_BETTER",
      "department": "operations"
    },
    {
      "id": "kpi-integrity-backlog",
      "name": "Integrity backlog",
      "description": "Overdue integrity inspections.",
      "unit": "NUMBER",
      "direction": "LOWER_IS_BETTER",
      "department": "integrity"
    },
    {
      "id": "kpi-lifting-cost",
      "name": "Lifting cost",
      "description": "Opex per barrel equivalent.",
      "unit": "CURRENCY",
      "direction": "LOWER_IS_BETTER",
      "department": "finance"
    },
    {
      "id": "kpi-offtake",
      "name": "Offtake reliability",
      "description": "Nominations met on time.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "midstream"
    },
    {
      "id": "kpi-water-cut",
      "name": "Water cut",
      "description": "Water percent in production.",
      "unit": "PERCENT",
      "direction": "TARGET",
      "department": "production"
    },
    {
      "id": "kpi-well-uptime",
      "name": "Well uptime",
      "description": "Producing wells versus available.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "production"
    },
    {
      "id": "kpi-permit-compliance",
      "name": "Permit compliance",
      "description": "Permits closed without breach.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "hse"
    }
  ],
  "departments": [
    {
      "id": "dept-production",
      "name": "Production",
      "description": "Wells and facilities output.",
      "core": true
    },
    {
      "id": "dept-operations",
      "name": "Operations",
      "description": "Facility operations.",
      "core": true
    },
    {
      "id": "dept-hse",
      "name": "HSE",
      "description": "Health, safety, environment, process safety.",
      "core": true
    },
    {
      "id": "dept-integrity",
      "name": "Asset Integrity",
      "description": "Inspection and maintenance integrity.",
      "core": true
    },
    {
      "id": "dept-midstream",
      "name": "Midstream",
      "description": "Transport, storage, offtake.",
      "core": true
    },
    {
      "id": "dept-finance",
      "name": "Finance",
      "description": "Cost and commercial.",
      "core": true
    },
    {
      "id": "dept-maintenance",
      "name": "Maintenance",
      "description": "Turnarounds and corrective work.",
      "core": false
    }
  ],
  "roles": [
    {
      "id": "role-prod-mgr",
      "title": "Production Manager",
      "departmentId": "dept-production",
      "description": "Owns daily production."
    },
    {
      "id": "role-ops-sup",
      "title": "Operations Superintendent",
      "departmentId": "dept-operations",
      "description": "Owns facility operations."
    },
    {
      "id": "role-hse",
      "title": "HSE Manager",
      "departmentId": "dept-hse",
      "description": "Owns HSE and process safety."
    },
    {
      "id": "role-integrity",
      "title": "Integrity Engineer",
      "departmentId": "dept-integrity",
      "description": "Owns inspection programs."
    },
    {
      "id": "role-midstream",
      "title": "Midstream Coordinator",
      "departmentId": "dept-midstream",
      "description": "Owns offtake and logistics."
    },
    {
      "id": "role-finance",
      "title": "Cost Controller",
      "departmentId": "dept-finance",
      "description": "Owns lifting cost."
    },
    {
      "id": "role-maint",
      "title": "Maintenance Lead",
      "departmentId": "dept-maintenance",
      "description": "Owns turnaround planning."
    }
  ],
  "workflowBlueprints": [
    {
      "id": "wf-daily-prod",
      "name": "Daily production reporting",
      "department": "production",
      "purpose": "Capture and reconcile daily production.",
      "trigger": "End of day",
      "stages": [
        "Meter read",
        "Reconcile",
        "Allocate",
        "Publish"
      ],
      "outputs": [
        "Daily production report"
      ]
    },
    {
      "id": "wf-well-intervention",
      "name": "Well intervention",
      "department": "production",
      "purpose": "Plan and execute well work.",
      "trigger": "Well candidate",
      "stages": [
        "Candidate select",
        "Risk assess",
        "Execute",
        "Evaluate"
      ],
      "outputs": [
        "Intervention report"
      ]
    },
    {
      "id": "wf-permit",
      "name": "Permit to work",
      "department": "hse",
      "purpose": "Control hazardous work.",
      "trigger": "Work request",
      "stages": [
        "Request",
        "Isolate",
        "Approve",
        "Execute",
        "Close"
      ],
      "outputs": [
        "Permit"
      ]
    },
    {
      "id": "wf-incident",
      "name": "HSE incident",
      "department": "hse",
      "purpose": "Respond to incidents and near misses.",
      "trigger": "Incident",
      "stages": [
        "Secure",
        "Report",
        "Investigate",
        "Actions"
      ],
      "outputs": [
        "Incident case"
      ]
    },
    {
      "id": "wf-integrity",
      "name": "Integrity inspection",
      "department": "integrity",
      "purpose": "Inspect critical equipment and pipelines.",
      "trigger": "Inspection due",
      "stages": [
        "Plan",
        "Inspect",
        "Assess anomalies",
        "Remediate"
      ],
      "outputs": [
        "Inspection record"
      ]
    },
    {
      "id": "wf-offtake",
      "name": "Offtake nomination",
      "department": "midstream",
      "purpose": "Nominate and deliver offtake volumes.",
      "trigger": "Nomination cycle",
      "stages": [
        "Nominate",
        "Confirm",
        "Schedule",
        "Deliver"
      ],
      "outputs": [
        "Nomination",
        "Delivery ticket"
      ]
    },
    {
      "id": "wf-turnaround",
      "name": "Turnaround planning",
      "department": "maintenance",
      "purpose": "Plan facility turnaround.",
      "trigger": "TA window",
      "stages": [
        "Scope",
        "Plan",
        "Execute",
        "Startup"
      ],
      "outputs": [
        "TA plan",
        "Startup checklist"
      ]
    },
    {
      "id": "wf-deferment",
      "name": "Deferment management",
      "department": "operations",
      "purpose": "Record and recover deferred production.",
      "trigger": "Deferment event",
      "stages": [
        "Log",
        "Classify",
        "Recover plan",
        "Close"
      ],
      "outputs": [
        "Deferment record"
      ]
    }
  ],
  "dashboardBlueprints": [
    {
      "id": "dash-ceo",
      "name": "Upstream Command",
      "audience": [
        "CEO",
        "Asset Manager"
      ],
      "purpose": "Production, HSE, cost.",
      "kpiIds": [
        "kpi-production",
        "kpi-deferment",
        "kpi-trir",
        "kpi-lifting-cost"
      ],
      "sections": [
        "Production",
        "HSE",
        "Cost"
      ]
    },
    {
      "id": "dash-production",
      "name": "Production Control",
      "audience": [
        "Production Manager"
      ],
      "purpose": "Volume, uptime, water cut.",
      "kpiIds": [
        "kpi-production",
        "kpi-well-uptime",
        "kpi-water-cut",
        "kpi-deferment"
      ],
      "sections": [
        "Wells",
        "Deferment"
      ]
    },
    {
      "id": "dash-hse",
      "name": "HSE & Process Safety",
      "audience": [
        "HSE Manager"
      ],
      "purpose": "Incidents, PSE, permits.",
      "kpiIds": [
        "kpi-trir",
        "kpi-pse",
        "kpi-permit-compliance"
      ],
      "sections": [
        "Incidents",
        "PSE",
        "Permits"
      ]
    },
    {
      "id": "dash-integrity",
      "name": "Integrity",
      "audience": [
        "Integrity Engineer"
      ],
      "purpose": "Inspection backlog and uptime.",
      "kpiIds": [
        "kpi-integrity-backlog",
        "kpi-uptime"
      ],
      "sections": [
        "Backlog",
        "Anomalies"
      ]
    },
    {
      "id": "dash-midstream",
      "name": "Midstream Logistics",
      "audience": [
        "Midstream Coordinator"
      ],
      "purpose": "Offtake reliability and flaring.",
      "kpiIds": [
        "kpi-offtake",
        "kpi-flaring"
      ],
      "sections": [
        "Nominations",
        "Flaring"
      ]
    },
    {
      "id": "dash-finance",
      "name": "Lifting Cost",
      "audience": [
        "Cost Controller"
      ],
      "purpose": "Opex per boe.",
      "kpiIds": [
        "kpi-lifting-cost",
        "kpi-production"
      ],
      "sections": [
        "Cost bridge"
      ]
    }
  ],
  "aiAgentRoster": [
    {
      "id": "agent-prod",
      "name": "Production Advisor",
      "mission": "Planning record: suggest deferment recovery priorities.",
      "permissions": "SUGGEST",
      "inputs": [
        "Production",
        "Deferment"
      ],
      "outputs": [
        "Recovery suggestions"
      ],
      "department": "production"
    },
    {
      "id": "agent-hse",
      "name": "HSE Advisor",
      "mission": "Planning record: flag HSE/process-safety risks; no autonomous permit approval.",
      "permissions": "APPROVAL_REQUIRED",
      "inputs": [
        "Incidents",
        "Permits"
      ],
      "outputs": [
        "Risk flags"
      ],
      "department": "hse"
    },
    {
      "id": "agent-integrity",
      "name": "Integrity Planner",
      "mission": "Planning record: prioritize overdue inspections.",
      "permissions": "SUGGEST",
      "inputs": [
        "Inspection backlog"
      ],
      "outputs": [
        "Priority list"
      ],
      "department": "integrity"
    },
    {
      "id": "agent-midstream",
      "name": "Offtake Planner",
      "mission": "Planning record: propose nomination adjustments.",
      "permissions": "SUGGEST",
      "inputs": [
        "Nominations",
        "Inventory"
      ],
      "outputs": [
        "Nomination draft"
      ],
      "department": "midstream"
    },
    {
      "id": "agent-brief",
      "name": "Asset Briefing Agent",
      "mission": "Planning record: daily asset KPI brief.",
      "permissions": "READ_ONLY",
      "inputs": [
        "KPIs"
      ],
      "outputs": [
        "Brief"
      ]
    }
  ],
  "mockSchema": {
    "entities": [
      {
        "id": "ent-asset",
        "name": "Asset",
        "description": "Field or facility asset.",
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
            "name": "type",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "FIELD",
              "FACILITY",
              "PIPELINE"
            ]
          }
        ]
      },
      {
        "id": "ent-well",
        "name": "Well",
        "description": "Producing well.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "assetId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-asset"
          },
          {
            "name": "name",
            "type": "STRING",
            "required": true
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "PRODUCING",
              "SHUT_IN",
              "WORKOVER"
            ]
          }
        ]
      },
      {
        "id": "ent-prod-daily",
        "name": "DailyProduction",
        "description": "Daily production record.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "wellId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-well"
          },
          {
            "name": "prodDate",
            "type": "DATE",
            "required": true
          },
          {
            "name": "oilVolume",
            "type": "NUMBER",
            "required": true
          },
          {
            "name": "gasVolume",
            "type": "NUMBER",
            "required": true
          },
          {
            "name": "waterVolume",
            "type": "NUMBER",
            "required": true
          }
        ]
      },
      {
        "id": "ent-permit",
        "name": "PermitToWork",
        "description": "Work permit.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "assetId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-asset"
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "REQUESTED",
              "APPROVED",
              "CLOSED",
              "CANCELLED"
            ]
          },
          {
            "name": "workType",
            "type": "STRING",
            "required": true
          }
        ]
      },
      {
        "id": "ent-incident",
        "name": "HseIncident",
        "description": "HSE incident.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "assetId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-asset"
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
        "id": "ent-inspection",
        "name": "IntegrityInspection",
        "description": "Integrity inspection.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "assetId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-asset"
          },
          {
            "name": "dueDate",
            "type": "DATE",
            "required": true
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "PLANNED",
              "DONE",
              "OVERDUE"
            ]
          },
          {
            "name": "findings",
            "type": "STRING",
            "required": false
          }
        ]
      },
      {
        "id": "ent-nomination",
        "name": "OfftakeNomination",
        "description": "Midstream nomination.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "assetId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-asset"
          },
          {
            "name": "nomDate",
            "type": "DATE",
            "required": true
          },
          {
            "name": "volume",
            "type": "NUMBER",
            "required": true
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "DRAFT",
              "CONFIRMED",
              "DELIVERED"
            ]
          }
        ]
      }
    ],
    "relationships": [
      {
        "fromEntityId": "ent-asset",
        "toEntityId": "ent-well",
        "type": "ONE_TO_MANY",
        "description": "Asset has wells."
      },
      {
        "fromEntityId": "ent-well",
        "toEntityId": "ent-prod-daily",
        "type": "ONE_TO_MANY",
        "description": "Well has daily production."
      },
      {
        "fromEntityId": "ent-asset",
        "toEntityId": "ent-permit",
        "type": "ONE_TO_MANY",
        "description": "Asset has permits."
      },
      {
        "fromEntityId": "ent-asset",
        "toEntityId": "ent-incident",
        "type": "ONE_TO_MANY",
        "description": "Asset has incidents."
      },
      {
        "fromEntityId": "ent-asset",
        "toEntityId": "ent-inspection",
        "type": "ONE_TO_MANY",
        "description": "Asset has inspections."
      },
      {
        "fromEntityId": "ent-asset",
        "toEntityId": "ent-nomination",
        "type": "ONE_TO_MANY",
        "description": "Asset has nominations."
      }
    ]
  },
  "terminology": {
    "TRIR": [
      "Total Recordable Incident Rate"
    ],
    "Deferment": [
      "Deferred production"
    ],
    "PSE": [
      "Process Safety Event"
    ],
    "Offtake": [
      "Product offtake",
      "تحویل"
    ],
    "BOE": [
      "Barrel of Oil Equivalent"
    ]
  },
  "risks": [
    "Process-safety failures can cause catastrophic harm.",
    "AI must not approve permits or isolate states.",
    "Integrity backlog increases leak and failure risk.",
    "Production deferment compounds commercial losses."
  ],
  "recommendedIntegrations": [
    {
      "name": "Production accounting",
      "category": "production",
      "purpose": "Volumes and allocations."
    },
    {
      "name": "CMMS / integrity",
      "category": "integrity",
      "purpose": "Inspections and work orders."
    },
    {
      "name": "HSE / PTW",
      "category": "hse",
      "purpose": "Permits and incidents."
    },
    {
      "name": "SCADA / historian",
      "category": "operations",
      "purpose": "Facility telemetry."
    }
  ]
} satisfies IndustryPack;
