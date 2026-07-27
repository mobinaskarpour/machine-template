import type { IndustryPack } from "../industry-pack-schema.js";

export const medicalPack = {
  "schemaVersion": "1.0",
  "id": "medical",
  "name": "Medical & Clinical Operations",
  "description": "Clinical operations pack for clinics and hospitals covering appointments, care pathways, privacy, and audit constraints.",
  "aliases": [
    "medical",
    "healthcare",
    "clinic",
    "hospital",
    "clinical",
    "پزشکی",
    "درمانگاه",
    "بیمارستان",
    "سلامت"
  ],
  "ceoConcerns": [
    {
      "id": "cc-access",
      "title": "Patient access & wait times",
      "description": "Reducing appointment backlogs and ED boarding.",
      "priority": "HIGH"
    },
    {
      "id": "cc-quality",
      "title": "Clinical quality & safety",
      "description": "Preventing adverse events and improving outcomes.",
      "priority": "HIGH"
    },
    {
      "id": "cc-privacy",
      "title": "Privacy & audit readiness",
      "description": "Protecting PHI and maintaining audit trails.",
      "priority": "HIGH"
    },
    {
      "id": "cc-revenue",
      "title": "Revenue cycle integrity",
      "description": "Clean claims, denials, and collections.",
      "priority": "MEDIUM"
    },
    {
      "id": "cc-staffing",
      "title": "Clinical staffing",
      "description": "Matching roster capacity to demand.",
      "priority": "HIGH"
    },
    {
      "id": "cc-compliance",
      "title": "Regulatory compliance",
      "description": "Licensure, protocols, and documentation completeness.",
      "priority": "HIGH"
    }
  ],
  "kpis": [
    {
      "id": "kpi-wait",
      "name": "Appointment wait time",
      "description": "Days to next available appointment.",
      "unit": "DURATION",
      "direction": "LOWER_IS_BETTER",
      "department": "access"
    },
    {
      "id": "kpi-no-show",
      "name": "No-show rate",
      "description": "Missed appointments percent.",
      "unit": "PERCENT",
      "direction": "LOWER_IS_BETTER",
      "department": "access"
    },
    {
      "id": "kpi-los",
      "name": "Average LOS",
      "description": "Average length of stay.",
      "unit": "DURATION",
      "direction": "TARGET",
      "department": "clinical"
    },
    {
      "id": "kpi-readmit",
      "name": "Readmission rate",
      "description": "30-day readmissions.",
      "unit": "PERCENT",
      "direction": "LOWER_IS_BETTER",
      "department": "clinical"
    },
    {
      "id": "kpi-ae",
      "name": "Adverse event rate",
      "description": "Adverse events per 1000 encounters.",
      "unit": "RATE",
      "direction": "LOWER_IS_BETTER",
      "department": "quality"
    },
    {
      "id": "kpi-doc-complete",
      "name": "Documentation completeness",
      "description": "Charts meeting documentation standards.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "clinical"
    },
    {
      "id": "kpi-claim-clean",
      "name": "Clean claim rate",
      "description": "Claims accepted first pass.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "revenue"
    },
    {
      "id": "kpi-denial",
      "name": "Denial rate",
      "description": "Denied claims percent.",
      "unit": "PERCENT",
      "direction": "LOWER_IS_BETTER",
      "department": "revenue"
    },
    {
      "id": "kpi-staffing",
      "name": "Staffing fill rate",
      "description": "Shifts filled versus required.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "workforce"
    },
    {
      "id": "kpi-csat",
      "name": "Patient satisfaction",
      "description": "Patient experience score.",
      "unit": "SCORE",
      "direction": "HIGHER_IS_BETTER",
      "department": "experience"
    },
    {
      "id": "kpi-audit-findings",
      "name": "Open audit findings",
      "description": "Open privacy/compliance findings.",
      "unit": "NUMBER",
      "direction": "LOWER_IS_BETTER",
      "department": "compliance"
    },
    {
      "id": "kpi-turnaround",
      "name": "Lab turnaround",
      "description": "Median lab result turnaround.",
      "unit": "DURATION",
      "direction": "LOWER_IS_BETTER",
      "department": "clinical"
    }
  ],
  "departments": [
    {
      "id": "dept-access",
      "name": "Patient Access",
      "description": "Scheduling and registration.",
      "core": true
    },
    {
      "id": "dept-clinical",
      "name": "Clinical Care",
      "description": "Encounters and care pathways.",
      "core": true
    },
    {
      "id": "dept-quality",
      "name": "Quality & Safety",
      "description": "Clinical quality and incidents.",
      "core": true
    },
    {
      "id": "dept-revenue",
      "name": "Revenue Cycle",
      "description": "Coding, claims, collections.",
      "core": true
    },
    {
      "id": "dept-workforce",
      "name": "Workforce",
      "description": "Clinical staffing.",
      "core": true
    },
    {
      "id": "dept-compliance",
      "name": "Compliance & Privacy",
      "description": "Privacy, audit, regulatory.",
      "core": true
    },
    {
      "id": "dept-experience",
      "name": "Patient Experience",
      "description": "Feedback and service recovery.",
      "core": false
    }
  ],
  "roles": [
    {
      "id": "role-coo",
      "title": "Clinical Operations Lead",
      "departmentId": "dept-clinical",
      "description": "Owns care pathway throughput."
    },
    {
      "id": "role-scheduler",
      "title": "Access Manager",
      "departmentId": "dept-access",
      "description": "Owns scheduling templates."
    },
    {
      "id": "role-cmo",
      "title": "Quality Officer",
      "departmentId": "dept-quality",
      "description": "Owns safety event review."
    },
    {
      "id": "role-rcm",
      "title": "Revenue Cycle Manager",
      "departmentId": "dept-revenue",
      "description": "Owns claims and denials."
    },
    {
      "id": "role-nurse-mgr",
      "title": "Nurse Manager",
      "departmentId": "dept-workforce",
      "description": "Owns rostering."
    },
    {
      "id": "role-privacy",
      "title": "Privacy Officer",
      "departmentId": "dept-compliance",
      "description": "Owns PHI access and audits."
    },
    {
      "id": "role-px",
      "title": "Patient Experience Lead",
      "departmentId": "dept-experience",
      "description": "Owns CSAT and complaints."
    }
  ],
  "workflowBlueprints": [
    {
      "id": "wf-appointment",
      "name": "Appointment scheduling",
      "department": "access",
      "purpose": "Book and confirm appointments.",
      "trigger": "Patient request",
      "stages": [
        "Request",
        "Match slot",
        "Confirm",
        "Remind"
      ],
      "outputs": [
        "Appointment",
        "Reminder"
      ]
    },
    {
      "id": "wf-encounter",
      "name": "Clinical encounter",
      "department": "clinical",
      "purpose": "Document and complete an encounter.",
      "trigger": "Patient check-in",
      "stages": [
        "Check-in",
        "Triage",
        "Encounter",
        "Orders",
        "Checkout"
      ],
      "outputs": [
        "Encounter note",
        "Orders"
      ]
    },
    {
      "id": "wf-care-pathway",
      "name": "Care pathway",
      "department": "clinical",
      "purpose": "Execute a protocolized pathway.",
      "trigger": "Pathway enrollment",
      "stages": [
        "Enroll",
        "Milestones",
        "Escalate variances",
        "Complete"
      ],
      "outputs": [
        "Pathway status"
      ]
    },
    {
      "id": "wf-incident",
      "name": "Safety incident review",
      "department": "quality",
      "purpose": "Investigate clinical safety events.",
      "trigger": "Incident report",
      "stages": [
        "Report",
        "Triage",
        "Investigate",
        "Actions"
      ],
      "outputs": [
        "Incident case",
        "Actions"
      ]
    },
    {
      "id": "wf-claim",
      "name": "Claim submission",
      "department": "revenue",
      "purpose": "Code and submit claims.",
      "trigger": "Encounter closed",
      "stages": [
        "Code",
        "Scrub",
        "Submit",
        "Post payment"
      ],
      "outputs": [
        "Claim",
        "Remittance"
      ]
    },
    {
      "id": "wf-privacy-access",
      "name": "Privacy access request",
      "department": "compliance",
      "purpose": "Handle PHI access with audit.",
      "trigger": "Access request",
      "stages": [
        "Authenticate",
        "Authorize",
        "Log access",
        "Review"
      ],
      "outputs": [
        "Access log",
        "Decision"
      ]
    },
    {
      "id": "wf-roster",
      "name": "Clinical rostering",
      "department": "workforce",
      "purpose": "Fill shifts against demand.",
      "trigger": "Roster cycle",
      "stages": [
        "Forecast demand",
        "Assign",
        "Approve",
        "Publish"
      ],
      "outputs": [
        "Roster"
      ]
    }
  ],
  "dashboardBlueprints": [
    {
      "id": "dash-ceo",
      "name": "Clinical Command",
      "audience": [
        "CEO",
        "COO"
      ],
      "purpose": "Access, quality, revenue, staffing.",
      "kpiIds": [
        "kpi-wait",
        "kpi-ae",
        "kpi-claim-clean",
        "kpi-staffing",
        "kpi-csat"
      ],
      "sections": [
        "Access",
        "Quality",
        "Revenue",
        "Workforce"
      ]
    },
    {
      "id": "dash-access",
      "name": "Access & Scheduling",
      "audience": [
        "Access Manager"
      ],
      "purpose": "Waits and no-shows.",
      "kpiIds": [
        "kpi-wait",
        "kpi-no-show"
      ],
      "sections": [
        "Slots",
        "No-shows"
      ]
    },
    {
      "id": "dash-quality",
      "name": "Quality & Safety",
      "audience": [
        "Quality Officer"
      ],
      "purpose": "Adverse events and documentation.",
      "kpiIds": [
        "kpi-ae",
        "kpi-readmit",
        "kpi-doc-complete"
      ],
      "sections": [
        "Events",
        "Outcomes"
      ]
    },
    {
      "id": "dash-revenue",
      "name": "Revenue Cycle",
      "audience": [
        "RCM"
      ],
      "purpose": "Clean claims and denials.",
      "kpiIds": [
        "kpi-claim-clean",
        "kpi-denial"
      ],
      "sections": [
        "Claims",
        "Denials"
      ]
    },
    {
      "id": "dash-compliance",
      "name": "Privacy & Audit",
      "audience": [
        "Privacy Officer"
      ],
      "purpose": "Audit findings and access controls.",
      "kpiIds": [
        "kpi-audit-findings"
      ],
      "sections": [
        "Findings",
        "Access reviews"
      ]
    },
    {
      "id": "dash-workforce",
      "name": "Workforce",
      "audience": [
        "Nurse Manager"
      ],
      "purpose": "Staffing fill and LOS context.",
      "kpiIds": [
        "kpi-staffing",
        "kpi-los",
        "kpi-turnaround"
      ],
      "sections": [
        "Roster",
        "Throughput"
      ]
    }
  ],
  "aiAgentRoster": [
    {
      "id": "agent-ops",
      "name": "Clinical Ops Briefing Agent",
      "mission": "Planning record: summarize access and quality KPIs for leadership.",
      "permissions": "SUGGEST",
      "inputs": [
        "KPIs"
      ],
      "outputs": [
        "Brief"
      ],
      "department": "clinical"
    },
    {
      "id": "agent-schedule",
      "name": "Scheduling Advisor",
      "mission": "Planning record: propose slot templates; no auto-booking of clinical care.",
      "permissions": "SUGGEST",
      "inputs": [
        "Demand",
        "Templates"
      ],
      "outputs": [
        "Template suggestions"
      ],
      "department": "access"
    },
    {
      "id": "agent-quality",
      "name": "Safety Triage Agent",
      "mission": "Planning record: cluster safety events for human review with APPROVAL_REQUIRED.",
      "permissions": "APPROVAL_REQUIRED",
      "inputs": [
        "Incidents"
      ],
      "outputs": [
        "Triage notes"
      ],
      "department": "quality"
    },
    {
      "id": "agent-privacy",
      "name": "Privacy Audit Agent",
      "mission": "Planning record: flag unusual PHI access patterns; never disclose PHI in outputs beyond need-to-know summaries.",
      "permissions": "APPROVAL_REQUIRED",
      "inputs": [
        "Access logs"
      ],
      "outputs": [
        "Audit flags"
      ],
      "department": "compliance"
    },
    {
      "id": "agent-rcm",
      "name": "Denial Analysis Agent",
      "mission": "Planning record: suggest denial root causes for RCM staff.",
      "permissions": "SUGGEST",
      "inputs": [
        "Denials"
      ],
      "outputs": [
        "Root-cause list"
      ],
      "department": "revenue"
    },
    {
      "id": "agent-roster",
      "name": "Roster Planning Agent",
      "mission": "Planning record: propose shift fills for manager approval.",
      "permissions": "APPROVAL_REQUIRED",
      "inputs": [
        "Demand",
        "Credentials"
      ],
      "outputs": [
        "Roster draft"
      ],
      "department": "workforce"
    }
  ],
  "mockSchema": {
    "entities": [
      {
        "id": "ent-patient",
        "name": "Patient",
        "description": "Patient demographic record (mock).",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "mrn",
            "type": "STRING",
            "required": true
          },
          {
            "name": "displayName",
            "type": "STRING",
            "required": true
          }
        ]
      },
      {
        "id": "ent-appointment",
        "name": "Appointment",
        "description": "Scheduled appointment.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "patientId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-patient"
          },
          {
            "name": "scheduledAt",
            "type": "DATETIME",
            "required": true
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "BOOKED",
              "CHECKED_IN",
              "COMPLETED",
              "NO_SHOW",
              "CANCELLED"
            ]
          }
        ]
      },
      {
        "id": "ent-encounter",
        "name": "Encounter",
        "description": "Clinical encounter.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "patientId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-patient"
          },
          {
            "name": "appointmentId",
            "type": "REFERENCE",
            "required": false,
            "referenceEntityId": "ent-appointment"
          },
          {
            "name": "startedAt",
            "type": "DATETIME",
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
        "id": "ent-order",
        "name": "ClinicalOrder",
        "description": "Lab/imaging/med order.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "encounterId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-encounter"
          },
          {
            "name": "orderType",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "LAB",
              "IMAGING",
              "MED"
            ]
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "ORDERED",
              "IN_PROGRESS",
              "RESULTED",
              "CANCELLED"
            ]
          }
        ]
      },
      {
        "id": "ent-claim",
        "name": "Claim",
        "description": "Insurance claim.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "encounterId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-encounter"
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
              "PAID",
              "DENIED"
            ]
          }
        ]
      },
      {
        "id": "ent-incident",
        "name": "SafetyIncident",
        "description": "Clinical safety incident.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "encounterId",
            "type": "REFERENCE",
            "required": false,
            "referenceEntityId": "ent-encounter"
          },
          {
            "name": "reportedAt",
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
              "HIGH"
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
        "id": "ent-access-log",
        "name": "PhiAccessLog",
        "description": "PHI access audit log.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "patientId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-patient"
          },
          {
            "name": "actorId",
            "type": "STRING",
            "required": true
          },
          {
            "name": "accessedAt",
            "type": "DATETIME",
            "required": true
          },
          {
            "name": "purpose",
            "type": "STRING",
            "required": true
          }
        ]
      }
    ],
    "relationships": [
      {
        "fromEntityId": "ent-patient",
        "toEntityId": "ent-appointment",
        "type": "ONE_TO_MANY",
        "description": "Patient has appointments."
      },
      {
        "fromEntityId": "ent-patient",
        "toEntityId": "ent-encounter",
        "type": "ONE_TO_MANY",
        "description": "Patient has encounters."
      },
      {
        "fromEntityId": "ent-encounter",
        "toEntityId": "ent-order",
        "type": "ONE_TO_MANY",
        "description": "Encounter has orders."
      },
      {
        "fromEntityId": "ent-encounter",
        "toEntityId": "ent-claim",
        "type": "ONE_TO_MANY",
        "description": "Encounter has claims."
      },
      {
        "fromEntityId": "ent-patient",
        "toEntityId": "ent-access-log",
        "type": "ONE_TO_MANY",
        "description": "Patient has PHI access logs."
      }
    ]
  },
  "terminology": {
    "PHI": [
      "Protected Health Information"
    ],
    "LOS": [
      "Length of Stay"
    ],
    "RCM": [
      "Revenue Cycle Management"
    ],
    "MRN": [
      "Medical Record Number",
      "شماره پرونده"
    ]
  },
  "risks": [
    "PHI leakage and privacy violations carry legal and regulatory penalties.",
    "AI agents require APPROVAL_REQUIRED for clinical, privacy, and rostering actions.",
    "All AI outputs are planning records only and must remain auditable.",
    "Documentation gaps increase denial and safety risk.",
    "Unsafe autonomous clinical decision-making is prohibited."
  ],
  "recommendedIntegrations": [
    {
      "name": "EHR",
      "category": "clinical",
      "purpose": "Encounters, orders, documentation."
    },
    {
      "name": "Scheduling system",
      "category": "access",
      "purpose": "Appointments and templates."
    },
    {
      "name": "RCM / billing",
      "category": "revenue",
      "purpose": "Claims and remittances."
    },
    {
      "name": "Identity & audit",
      "category": "compliance",
      "purpose": "Access control and audit logs."
    }
  ]
} satisfies IndustryPack;
