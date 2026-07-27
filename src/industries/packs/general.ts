import type { IndustryPack } from "../industry-pack-schema.js";

export const generalPack = {
  "schemaVersion": "1.0",
  "id": "general",
  "name": "General SMB Operations",
  "description": "Generic small-to-medium business operations covering sales, delivery, finance, people, and customer support.",
  "aliases": [
    "general",
    "smb",
    "small business",
    "operations",
    "generic",
    "کسب‌وکار",
    "عمومی",
    "عملیات"
  ],
  "ceoConcerns": [
    {
      "id": "cc-revenue",
      "title": "Revenue predictability",
      "description": "Stabilizing pipeline conversion and recurring revenue.",
      "priority": "HIGH"
    },
    {
      "id": "cc-cash",
      "title": "Cash collection",
      "description": "Keeping DSO under control.",
      "priority": "HIGH"
    },
    {
      "id": "cc-delivery",
      "title": "On-time delivery",
      "description": "Meeting customer commitments.",
      "priority": "MEDIUM"
    },
    {
      "id": "cc-cost",
      "title": "Operating cost discipline",
      "description": "Controlling OpEx versus budget.",
      "priority": "MEDIUM"
    },
    {
      "id": "cc-retention",
      "title": "Customer retention",
      "description": "Reducing churn and improving satisfaction.",
      "priority": "HIGH"
    },
    {
      "id": "cc-people",
      "title": "Team capacity",
      "description": "Avoiding burnout and key-person dependency.",
      "priority": "MEDIUM"
    }
  ],
  "kpis": [
    {
      "id": "kpi-revenue",
      "name": "Monthly revenue",
      "description": "Recognized revenue in period.",
      "unit": "CURRENCY",
      "direction": "HIGHER_IS_BETTER",
      "department": "finance"
    },
    {
      "id": "kpi-gross-margin",
      "name": "Gross margin",
      "description": "Gross profit percent.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "finance"
    },
    {
      "id": "kpi-dso",
      "name": "DSO",
      "description": "Days sales outstanding.",
      "unit": "DURATION",
      "direction": "LOWER_IS_BETTER",
      "department": "finance"
    },
    {
      "id": "kpi-pipeline",
      "name": "Pipeline coverage",
      "description": "Pipeline value versus quota.",
      "unit": "RATE",
      "direction": "HIGHER_IS_BETTER",
      "department": "sales"
    },
    {
      "id": "kpi-win-rate",
      "name": "Win rate",
      "description": "Won versus closed deals.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "sales"
    },
    {
      "id": "kpi-otd",
      "name": "On-time delivery",
      "description": "Orders delivered on time.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "operations"
    },
    {
      "id": "kpi-nps",
      "name": "NPS",
      "description": "Net promoter score.",
      "unit": "SCORE",
      "direction": "HIGHER_IS_BETTER",
      "department": "support"
    },
    {
      "id": "kpi-churn",
      "name": "Churn rate",
      "description": "Customers lost in period.",
      "unit": "PERCENT",
      "direction": "LOWER_IS_BETTER",
      "department": "support"
    },
    {
      "id": "kpi-ticket-sla",
      "name": "Ticket SLA",
      "description": "Tickets resolved within SLA.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "support"
    },
    {
      "id": "kpi-utilization",
      "name": "Staff utilization",
      "description": "Productive versus available hours.",
      "unit": "PERCENT",
      "direction": "TARGET",
      "department": "people"
    }
  ],
  "departments": [
    {
      "id": "dept-sales",
      "name": "Sales",
      "description": "Pipeline and closing.",
      "core": true
    },
    {
      "id": "dept-operations",
      "name": "Operations",
      "description": "Delivery and fulfillment.",
      "core": true
    },
    {
      "id": "dept-finance",
      "name": "Finance",
      "description": "Billing and collections.",
      "core": true
    },
    {
      "id": "dept-support",
      "name": "Customer Support",
      "description": "Tickets and retention.",
      "core": true
    },
    {
      "id": "dept-people",
      "name": "People",
      "description": "Hiring and capacity.",
      "core": false
    },
    {
      "id": "dept-marketing",
      "name": "Marketing",
      "description": "Demand generation.",
      "core": false
    }
  ],
  "roles": [
    {
      "id": "role-ceo",
      "title": "Owner / CEO",
      "departmentId": "dept-sales",
      "description": "Sets priorities and closes key deals."
    },
    {
      "id": "role-ops-lead",
      "title": "Operations Lead",
      "departmentId": "dept-operations",
      "description": "Owns delivery commitments."
    },
    {
      "id": "role-accountant",
      "title": "Accountant",
      "departmentId": "dept-finance",
      "description": "Owns books and AR."
    },
    {
      "id": "role-support",
      "title": "Support Lead",
      "departmentId": "dept-support",
      "description": "Owns ticket queue."
    },
    {
      "id": "role-hr",
      "title": "People Ops",
      "departmentId": "dept-people",
      "description": "Owns hiring and scheduling."
    },
    {
      "id": "role-marketer",
      "title": "Marketing Lead",
      "departmentId": "dept-marketing",
      "description": "Owns campaigns and leads."
    }
  ],
  "workflowBlueprints": [
    {
      "id": "wf-lead-to-order",
      "name": "Lead to order",
      "department": "sales",
      "purpose": "Convert leads into confirmed orders.",
      "trigger": "New lead",
      "stages": [
        "Qualify",
        "Propose",
        "Negotiate",
        "Close"
      ],
      "outputs": [
        "Order",
        "Contract"
      ]
    },
    {
      "id": "wf-order-fulfill",
      "name": "Order fulfillment",
      "department": "operations",
      "purpose": "Deliver sold work or goods.",
      "trigger": "Order confirmed",
      "stages": [
        "Plan",
        "Execute",
        "QA",
        "Deliver"
      ],
      "outputs": [
        "Delivery record",
        "Sign-off"
      ]
    },
    {
      "id": "wf-invoice-collect",
      "name": "Invoice and collect",
      "department": "finance",
      "purpose": "Bill and collect payment.",
      "trigger": "Delivery complete",
      "stages": [
        "Invoice",
        "Send",
        "Follow up",
        "Reconcile"
      ],
      "outputs": [
        "Invoice",
        "Payment"
      ]
    },
    {
      "id": "wf-support-ticket",
      "name": "Support ticket",
      "department": "support",
      "purpose": "Resolve issues within SLA.",
      "trigger": "Ticket created",
      "stages": [
        "Triage",
        "Investigate",
        "Resolve",
        "Confirm"
      ],
      "outputs": [
        "Resolved ticket",
        "CSAT"
      ]
    },
    {
      "id": "wf-hire",
      "name": "Hiring",
      "department": "people",
      "purpose": "Fill open roles.",
      "trigger": "Approved req",
      "stages": [
        "Post",
        "Screen",
        "Interview",
        "Offer"
      ],
      "outputs": [
        "Hire",
        "Onboarding plan"
      ]
    },
    {
      "id": "wf-campaign",
      "name": "Campaign to lead",
      "department": "marketing",
      "purpose": "Generate qualified leads.",
      "trigger": "Campaign launch",
      "stages": [
        "Launch",
        "Capture",
        "Score",
        "Hand off"
      ],
      "outputs": [
        "Leads",
        "Attribution"
      ]
    }
  ],
  "dashboardBlueprints": [
    {
      "id": "dash-ceo",
      "name": "CEO Ops Overview",
      "audience": [
        "CEO"
      ],
      "purpose": "Revenue, delivery, and cash.",
      "kpiIds": [
        "kpi-revenue",
        "kpi-gross-margin",
        "kpi-dso",
        "kpi-otd",
        "kpi-churn"
      ],
      "sections": [
        "Revenue",
        "Delivery",
        "Cash",
        "Retention"
      ]
    },
    {
      "id": "dash-sales",
      "name": "Sales Pipeline",
      "audience": [
        "Sales"
      ],
      "purpose": "Pipeline and wins.",
      "kpiIds": [
        "kpi-pipeline",
        "kpi-win-rate",
        "kpi-revenue"
      ],
      "sections": [
        "Pipeline",
        "Wins"
      ]
    },
    {
      "id": "dash-ops",
      "name": "Operations Delivery",
      "audience": [
        "Operations Lead"
      ],
      "purpose": "Delivery and utilization.",
      "kpiIds": [
        "kpi-otd",
        "kpi-utilization"
      ],
      "sections": [
        "Commitments",
        "Capacity"
      ]
    },
    {
      "id": "dash-finance",
      "name": "Finance Pulse",
      "audience": [
        "Accountant"
      ],
      "purpose": "Margin and collections.",
      "kpiIds": [
        "kpi-gross-margin",
        "kpi-dso",
        "kpi-revenue"
      ],
      "sections": [
        "P&L",
        "AR"
      ]
    },
    {
      "id": "dash-support",
      "name": "Support Health",
      "audience": [
        "Support Lead"
      ],
      "purpose": "SLA and satisfaction.",
      "kpiIds": [
        "kpi-ticket-sla",
        "kpi-nps",
        "kpi-churn"
      ],
      "sections": [
        "Queue",
        "SLA"
      ]
    }
  ],
  "aiAgentRoster": [
    {
      "id": "agent-ceo",
      "name": "CEO Briefing Agent",
      "mission": "Planning record: weekly business brief with suggested priorities.",
      "permissions": "SUGGEST",
      "inputs": [
        "KPIs",
        "Risks"
      ],
      "outputs": [
        "Brief"
      ]
    },
    {
      "id": "agent-sales",
      "name": "Sales Coach Agent",
      "mission": "Planning record: suggest next-best actions on deals.",
      "permissions": "SUGGEST",
      "inputs": [
        "Pipeline"
      ],
      "outputs": [
        "Action list"
      ],
      "department": "sales"
    },
    {
      "id": "agent-ops",
      "name": "Ops Planning Agent",
      "mission": "Planning record: propose delivery sequencing.",
      "permissions": "SUGGEST",
      "inputs": [
        "Orders",
        "Capacity"
      ],
      "outputs": [
        "Schedule draft"
      ],
      "department": "operations"
    },
    {
      "id": "agent-finance",
      "name": "Collections Agent",
      "mission": "Planning record: prioritize overdue invoices.",
      "permissions": "SUGGEST",
      "inputs": [
        "AR aging"
      ],
      "outputs": [
        "Collection list"
      ],
      "department": "finance"
    },
    {
      "id": "agent-support",
      "name": "Support Triage Agent",
      "mission": "Planning record: classify tickets and suggest routing.",
      "permissions": "READ_ONLY",
      "inputs": [
        "Tickets"
      ],
      "outputs": [
        "Triage tags"
      ],
      "department": "support"
    }
  ],
  "mockSchema": {
    "entities": [
      {
        "id": "ent-customer",
        "name": "Customer",
        "description": "SMB customer.",
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
            "name": "segment",
            "type": "STRING",
            "required": false
          }
        ]
      },
      {
        "id": "ent-lead",
        "name": "Lead",
        "description": "Sales lead.",
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
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "NEW",
              "QUALIFIED",
              "LOST",
              "WON"
            ]
          },
          {
            "name": "customerId",
            "type": "REFERENCE",
            "required": false,
            "referenceEntityId": "ent-customer"
          }
        ]
      },
      {
        "id": "ent-order",
        "name": "Order",
        "description": "Customer order.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "customerId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-customer"
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
              "OPEN",
              "FULFILLED",
              "CANCELLED"
            ]
          },
          {
            "name": "dueDate",
            "type": "DATE",
            "required": false
          }
        ]
      },
      {
        "id": "ent-invoice",
        "name": "Invoice",
        "description": "Customer invoice.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "orderId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-order"
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
              "OPEN",
              "PAID",
              "OVERDUE"
            ]
          },
          {
            "name": "dueDate",
            "type": "DATE",
            "required": true
          }
        ]
      },
      {
        "id": "ent-ticket",
        "name": "SupportTicket",
        "description": "Support ticket.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "customerId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-customer"
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "OPEN",
              "PENDING",
              "CLOSED"
            ]
          },
          {
            "name": "openedAt",
            "type": "DATETIME",
            "required": true
          }
        ]
      },
      {
        "id": "ent-employee",
        "name": "Employee",
        "description": "Team member.",
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
            "name": "roleTitle",
            "type": "STRING",
            "required": true
          },
          {
            "name": "active",
            "type": "BOOLEAN",
            "required": true
          }
        ]
      }
    ],
    "relationships": [
      {
        "fromEntityId": "ent-customer",
        "toEntityId": "ent-order",
        "type": "ONE_TO_MANY",
        "description": "Customer has orders."
      },
      {
        "fromEntityId": "ent-order",
        "toEntityId": "ent-invoice",
        "type": "ONE_TO_MANY",
        "description": "Order has invoices."
      },
      {
        "fromEntityId": "ent-customer",
        "toEntityId": "ent-ticket",
        "type": "ONE_TO_MANY",
        "description": "Customer has tickets."
      },
      {
        "fromEntityId": "ent-customer",
        "toEntityId": "ent-lead",
        "type": "ONE_TO_MANY",
        "description": "Customer linked to leads."
      }
    ]
  },
  "terminology": {
    "DSO": [
      "Days Sales Outstanding"
    ],
    "NPS": [
      "Net Promoter Score"
    ],
    "SLA": [
      "Service Level Agreement",
      "سطح خدمات"
    ],
    "Pipeline": [
      "Sales pipeline",
      "قیف فروش"
    ]
  },
  "risks": [
    "Cash gaps from slow collections.",
    "Delivery delays damaging retention.",
    "Key-person dependency.",
    "AI must not auto-commit commercial or financial actions."
  ],
  "recommendedIntegrations": [
    {
      "name": "CRM",
      "category": "sales",
      "purpose": "Pipeline and customers."
    },
    {
      "name": "Accounting",
      "category": "finance",
      "purpose": "Invoicing and AR."
    },
    {
      "name": "Helpdesk",
      "category": "support",
      "purpose": "Ticket management."
    },
    {
      "name": "Email / calendar",
      "category": "productivity",
      "purpose": "Scheduling and outreach."
    }
  ]
} satisfies IndustryPack;
