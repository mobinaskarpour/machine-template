import type { IndustryPack } from "../industry-pack-schema.js";

export const realEstatePack = {
  "schemaVersion": "1.0",
  "id": "real-estate",
  "name": "Real Estate",
  "description": "Property portfolio operations covering leasing, occupancy, maintenance, and tenant relations.",
  "aliases": [
    "real estate",
    "property",
    "leasing",
    "realty",
    "املاک",
    "اجاره",
    "مستغلات"
  ],
  "ceoConcerns": [
    {
      "id": "cc-occupancy",
      "title": "Occupancy rate",
      "description": "Keeping units leased at target occupancy.",
      "priority": "HIGH"
    },
    {
      "id": "cc-rent",
      "title": "Rent collection",
      "description": "Reducing arrears and vacancy loss.",
      "priority": "HIGH"
    },
    {
      "id": "cc-capex",
      "title": "CapEx discipline",
      "description": "Prioritizing maintenance and renovations ROI.",
      "priority": "MEDIUM"
    },
    {
      "id": "cc-tenant",
      "title": "Tenant satisfaction",
      "description": "Retaining tenants and reducing churn.",
      "priority": "MEDIUM"
    },
    {
      "id": "cc-compliance",
      "title": "Regulatory compliance",
      "description": "Meeting property and lease regulations.",
      "priority": "HIGH"
    }
  ],
  "kpis": [
    {
      "id": "kpi-occupancy",
      "name": "Occupancy rate",
      "description": "Occupied versus total units.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "leasing"
    },
    {
      "id": "kpi-vacancy-loss",
      "name": "Vacancy loss",
      "description": "Lost rent from vacant units.",
      "unit": "CURRENCY",
      "direction": "LOWER_IS_BETTER",
      "department": "leasing"
    },
    {
      "id": "kpi-collection",
      "name": "Rent collection rate",
      "description": "Collected versus billed rent.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "finance"
    },
    {
      "id": "kpi-arrears",
      "name": "Arrears aging",
      "description": "Overdue rent balance.",
      "unit": "CURRENCY",
      "direction": "LOWER_IS_BETTER",
      "department": "finance"
    },
    {
      "id": "kpi-lease-renewal",
      "name": "Lease renewal rate",
      "description": "Renewals versus expiries.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "leasing"
    },
    {
      "id": "kpi-noi",
      "name": "NOI",
      "description": "Net operating income.",
      "unit": "CURRENCY",
      "direction": "HIGHER_IS_BETTER",
      "department": "finance"
    },
    {
      "id": "kpi-mttr",
      "name": "Maintenance MTTR",
      "description": "Mean time to repair.",
      "unit": "DURATION",
      "direction": "LOWER_IS_BETTER",
      "department": "facilities"
    },
    {
      "id": "kpi-wo-open",
      "name": "Open work orders",
      "description": "Open facility tickets.",
      "unit": "NUMBER",
      "direction": "LOWER_IS_BETTER",
      "department": "facilities"
    },
    {
      "id": "kpi-csat",
      "name": "Tenant CSAT",
      "description": "Tenant satisfaction score.",
      "unit": "SCORE",
      "direction": "HIGHER_IS_BETTER",
      "department": "tenant-success"
    },
    {
      "id": "kpi-time-to-lease",
      "name": "Time to lease",
      "description": "Days from vacancy to signed lease.",
      "unit": "DURATION",
      "direction": "LOWER_IS_BETTER",
      "department": "leasing"
    }
  ],
  "departments": [
    {
      "id": "dept-leasing",
      "name": "Leasing",
      "description": "Prospecting and lease deals.",
      "core": true
    },
    {
      "id": "dept-facilities",
      "name": "Facilities",
      "description": "Maintenance and CapEx.",
      "core": true
    },
    {
      "id": "dept-finance",
      "name": "Finance",
      "description": "Billing and collections.",
      "core": true
    },
    {
      "id": "dept-tenant-success",
      "name": "Tenant Success",
      "description": "Tenant relations.",
      "core": true
    },
    {
      "id": "dept-asset",
      "name": "Asset Management",
      "description": "Portfolio strategy.",
      "core": false
    },
    {
      "id": "dept-legal",
      "name": "Legal",
      "description": "Lease and compliance.",
      "core": false
    }
  ],
  "roles": [
    {
      "id": "role-leasing",
      "title": "Leasing Manager",
      "departmentId": "dept-leasing",
      "description": "Owns occupancy and deals."
    },
    {
      "id": "role-facility",
      "title": "Facilities Manager",
      "departmentId": "dept-facilities",
      "description": "Owns maintenance SLAs."
    },
    {
      "id": "role-ar",
      "title": "Rent Collector",
      "departmentId": "dept-finance",
      "description": "Owns rent billing and arrears."
    },
    {
      "id": "role-tenant",
      "title": "Tenant Relations",
      "departmentId": "dept-tenant-success",
      "description": "Owns tenant satisfaction."
    },
    {
      "id": "role-asset",
      "title": "Asset Manager",
      "departmentId": "dept-asset",
      "description": "Owns NOI and CapEx priorities."
    },
    {
      "id": "role-legal",
      "title": "Property Counsel",
      "departmentId": "dept-legal",
      "description": "Owns lease compliance."
    }
  ],
  "workflowBlueprints": [
    {
      "id": "wf-listing",
      "name": "Unit listing to lease",
      "department": "leasing",
      "purpose": "Fill vacant units.",
      "trigger": "Unit vacant",
      "stages": [
        "List",
        "Show",
        "Offer",
        "Sign"
      ],
      "outputs": [
        "Lease",
        "Occupied unit"
      ]
    },
    {
      "id": "wf-renewal",
      "name": "Lease renewal",
      "department": "leasing",
      "purpose": "Renew expiring leases.",
      "trigger": "90 days to expiry",
      "stages": [
        "Notify",
        "Negotiate",
        "Approve",
        "Execute"
      ],
      "outputs": [
        "Renewed lease"
      ]
    },
    {
      "id": "wf-rent-cycle",
      "name": "Rent billing cycle",
      "department": "finance",
      "purpose": "Bill and collect monthly rent.",
      "trigger": "Billing date",
      "stages": [
        "Generate",
        "Send",
        "Collect",
        "Escalate"
      ],
      "outputs": [
        "Invoices",
        "Receipts"
      ]
    },
    {
      "id": "wf-maintenance",
      "name": "Maintenance work order",
      "department": "facilities",
      "purpose": "Resolve facility issues.",
      "trigger": "Tenant request",
      "stages": [
        "Log",
        "Assign",
        "Repair",
        "Close"
      ],
      "outputs": [
        "Closed WO"
      ]
    },
    {
      "id": "wf-moveout",
      "name": "Move-out / turnover",
      "department": "facilities",
      "purpose": "Inspect, remediate, and re-list.",
      "trigger": "Lease end",
      "stages": [
        "Inspect",
        "Remediate",
        "Settle deposit",
        "Re-list"
      ],
      "outputs": [
        "Turnover report"
      ]
    },
    {
      "id": "wf-capex",
      "name": "CapEx approval",
      "department": "asset",
      "purpose": "Prioritize and approve capital works.",
      "trigger": "CapEx request",
      "stages": [
        "Scope",
        "Estimate",
        "Approve",
        "Execute"
      ],
      "outputs": [
        "Approved CapEx"
      ]
    }
  ],
  "dashboardBlueprints": [
    {
      "id": "dash-ceo",
      "name": "Portfolio NOI",
      "audience": [
        "CEO",
        "Asset Manager"
      ],
      "purpose": "Occupancy, NOI, arrears.",
      "kpiIds": [
        "kpi-occupancy",
        "kpi-noi",
        "kpi-collection",
        "kpi-arrears"
      ],
      "sections": [
        "Occupancy",
        "NOI",
        "Collections"
      ]
    },
    {
      "id": "dash-leasing",
      "name": "Leasing Pipeline",
      "audience": [
        "Leasing Manager"
      ],
      "purpose": "Vacancies and time-to-lease.",
      "kpiIds": [
        "kpi-occupancy",
        "kpi-time-to-lease",
        "kpi-lease-renewal",
        "kpi-vacancy-loss"
      ],
      "sections": [
        "Vacancies",
        "Pipeline"
      ]
    },
    {
      "id": "dash-facilities",
      "name": "Facilities Ops",
      "audience": [
        "Facilities Manager"
      ],
      "purpose": "Work-order backlog and MTTR.",
      "kpiIds": [
        "kpi-mttr",
        "kpi-wo-open"
      ],
      "sections": [
        "Open WOs",
        "SLA"
      ]
    },
    {
      "id": "dash-tenant",
      "name": "Tenant Experience",
      "audience": [
        "Tenant Relations"
      ],
      "purpose": "Satisfaction and renewals.",
      "kpiIds": [
        "kpi-csat",
        "kpi-lease-renewal"
      ],
      "sections": [
        "CSAT",
        "Renewals"
      ]
    },
    {
      "id": "dash-finance",
      "name": "Rent Collections",
      "audience": [
        "Finance"
      ],
      "purpose": "Billing and arrears.",
      "kpiIds": [
        "kpi-collection",
        "kpi-arrears",
        "kpi-noi"
      ],
      "sections": [
        "Aging",
        "Cash"
      ]
    }
  ],
  "aiAgentRoster": [
    {
      "id": "agent-leasing",
      "name": "Leasing Advisor",
      "mission": "Planning record: suggest pricing and prospect prioritization.",
      "permissions": "SUGGEST",
      "inputs": [
        "Vacancies",
        "Comps"
      ],
      "outputs": [
        "Pricing suggestions"
      ],
      "department": "leasing"
    },
    {
      "id": "agent-collections",
      "name": "Rent Collections Agent",
      "mission": "Planning record: prioritize arrears outreach.",
      "permissions": "SUGGEST",
      "inputs": [
        "Arrears"
      ],
      "outputs": [
        "Outreach queue"
      ],
      "department": "finance"
    },
    {
      "id": "agent-facilities",
      "name": "Facilities Triage Agent",
      "mission": "Planning record: classify and prioritize work orders.",
      "permissions": "SUGGEST",
      "inputs": [
        "Work orders"
      ],
      "outputs": [
        "Priority list"
      ],
      "department": "facilities"
    },
    {
      "id": "agent-asset",
      "name": "Asset Briefing Agent",
      "mission": "Planning record: NOI and CapEx brief.",
      "permissions": "READ_ONLY",
      "inputs": [
        "NOI",
        "CapEx"
      ],
      "outputs": [
        "Brief"
      ],
      "department": "asset"
    }
  ],
  "mockSchema": {
    "entities": [
      {
        "id": "ent-property",
        "name": "Property",
        "description": "Building or asset.",
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
            "name": "address",
            "type": "STRING",
            "required": true
          }
        ]
      },
      {
        "id": "ent-unit",
        "name": "Unit",
        "description": "Rentable unit.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "propertyId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-property"
          },
          {
            "name": "unitCode",
            "type": "STRING",
            "required": true
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "VACANT",
              "OCCUPIED",
              "MAINTENANCE"
            ]
          },
          {
            "name": "rentAmount",
            "type": "CURRENCY",
            "required": true
          }
        ]
      },
      {
        "id": "ent-tenant",
        "name": "Tenant",
        "description": "Lease holder.",
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
            "name": "contact",
            "type": "STRING",
            "required": false
          }
        ]
      },
      {
        "id": "ent-lease",
        "name": "Lease",
        "description": "Lease agreement.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "unitId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-unit"
          },
          {
            "name": "tenantId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-tenant"
          },
          {
            "name": "startDate",
            "type": "DATE",
            "required": true
          },
          {
            "name": "endDate",
            "type": "DATE",
            "required": true
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "ACTIVE",
              "EXPIRED",
              "TERMINATED"
            ]
          }
        ]
      },
      {
        "id": "ent-invoice",
        "name": "RentInvoice",
        "description": "Rent invoice.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "leaseId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-lease"
          },
          {
            "name": "amount",
            "type": "CURRENCY",
            "required": true
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
              "OPEN",
              "PAID",
              "OVERDUE"
            ]
          }
        ]
      },
      {
        "id": "ent-wo",
        "name": "WorkOrder",
        "description": "Facility work order.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "unitId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-unit"
          },
          {
            "name": "openedAt",
            "type": "DATETIME",
            "required": true
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "OPEN",
              "IN_PROGRESS",
              "CLOSED"
            ]
          },
          {
            "name": "priority",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "LOW",
              "MEDIUM",
              "HIGH"
            ]
          }
        ]
      }
    ],
    "relationships": [
      {
        "fromEntityId": "ent-property",
        "toEntityId": "ent-unit",
        "type": "ONE_TO_MANY",
        "description": "Property has units."
      },
      {
        "fromEntityId": "ent-unit",
        "toEntityId": "ent-lease",
        "type": "ONE_TO_MANY",
        "description": "Unit has leases."
      },
      {
        "fromEntityId": "ent-tenant",
        "toEntityId": "ent-lease",
        "type": "ONE_TO_MANY",
        "description": "Tenant has leases."
      },
      {
        "fromEntityId": "ent-lease",
        "toEntityId": "ent-invoice",
        "type": "ONE_TO_MANY",
        "description": "Lease has invoices."
      },
      {
        "fromEntityId": "ent-unit",
        "toEntityId": "ent-wo",
        "type": "ONE_TO_MANY",
        "description": "Unit has work orders."
      }
    ]
  },
  "terminology": {
    "NOI": [
      "Net Operating Income"
    ],
    "Occupancy": [
      "Occupancy rate",
      "نرخ اشغال"
    ],
    "Arrears": [
      "Overdue rent",
      "معوقات اجاره"
    ],
    "CapEx": [
      "Capital Expenditure"
    ]
  },
  "risks": [
    "Prolonged vacancy destroys NOI.",
    "Lease noncompliance creates legal exposure.",
    "Deferred maintenance increases CapEx shocks."
  ],
  "recommendedIntegrations": [
    {
      "name": "Property management system",
      "category": "core",
      "purpose": "Units, leases, billing."
    },
    {
      "name": "Accounting",
      "category": "finance",
      "purpose": "GL and collections."
    },
    {
      "name": "Maintenance CMMS",
      "category": "facilities",
      "purpose": "Work orders and vendors."
    }
  ]
} satisfies IndustryPack;
