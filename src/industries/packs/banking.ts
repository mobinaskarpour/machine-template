import type { IndustryPack } from "../industry-pack-schema.js";

export const bankingPack = {
  "schemaVersion": "1.0",
  "id": "banking",
  "name": "Banking",
  "description": "Deposits and lending operations with compliance, audit, and approval constraints.",
  "aliases": [
    "banking",
    "bank",
    "lending",
    "deposits",
    "retail bank",
    "بانک",
    "اعتبارات",
    "سپرده"
  ],
  "ceoConcerns": [
    {
      "id": "cc-npl",
      "title": "Credit quality / NPL",
      "description": "Containing non-performing loans.",
      "priority": "HIGH"
    },
    {
      "id": "cc-liquidity",
      "title": "Liquidity & deposits",
      "description": "Maintaining stable deposit funding.",
      "priority": "HIGH"
    },
    {
      "id": "cc-compliance",
      "title": "Compliance & AML",
      "description": "Preventing AML/KYC and conduct breaches.",
      "priority": "HIGH"
    },
    {
      "id": "cc-ops",
      "title": "Operational resilience",
      "description": "Keeping payment and channel uptime.",
      "priority": "MEDIUM"
    },
    {
      "id": "cc-margin",
      "title": "Net interest margin",
      "description": "Protecting NIM amid rate moves.",
      "priority": "MEDIUM"
    },
    {
      "id": "cc-audit",
      "title": "Audit readiness",
      "description": "Evidence for regulators and internal audit.",
      "priority": "HIGH"
    }
  ],
  "kpis": [
    {
      "id": "kpi-npl",
      "name": "NPL ratio",
      "description": "Non-performing loans versus book.",
      "unit": "PERCENT",
      "direction": "LOWER_IS_BETTER",
      "department": "credit"
    },
    {
      "id": "kpi-delinquency",
      "name": "Delinquency rate",
      "description": "Past-due loans percent.",
      "unit": "PERCENT",
      "direction": "LOWER_IS_BETTER",
      "department": "credit"
    },
    {
      "id": "kpi-deposit-growth",
      "name": "Deposit growth",
      "description": "Period deposit balance growth.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "deposits"
    },
    {
      "id": "kpi-nim",
      "name": "Net interest margin",
      "description": "NIM percent.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "finance"
    },
    {
      "id": "kpi-cir",
      "name": "Cost-income ratio",
      "description": "Operating cost versus income.",
      "unit": "PERCENT",
      "direction": "LOWER_IS_BETTER",
      "department": "finance"
    },
    {
      "id": "kpi-kyc-backlog",
      "name": "KYC backlog",
      "description": "Open KYC/refresh cases.",
      "unit": "NUMBER",
      "direction": "LOWER_IS_BETTER",
      "department": "compliance"
    },
    {
      "id": "kpi-sar",
      "name": "AML alerts aging",
      "description": "Open AML alerts beyond SLA.",
      "unit": "NUMBER",
      "direction": "LOWER_IS_BETTER",
      "department": "compliance"
    },
    {
      "id": "kpi-stp",
      "name": "STP rate",
      "description": "Straight-through processing percent.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "operations"
    },
    {
      "id": "kpi-uptime",
      "name": "Channel uptime",
      "description": "Digital channel availability.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "operations"
    },
    {
      "id": "kpi-loan-approval-tat",
      "name": "Loan approval TAT",
      "description": "Median approval turnaround.",
      "unit": "DURATION",
      "direction": "LOWER_IS_BETTER",
      "department": "credit"
    },
    {
      "id": "kpi-audit-findings",
      "name": "Open audit findings",
      "description": "Open audit/compliance findings.",
      "unit": "NUMBER",
      "direction": "LOWER_IS_BETTER",
      "department": "compliance"
    },
    {
      "id": "kpi-provision",
      "name": "Provision coverage",
      "description": "Provisions versus NPL.",
      "unit": "PERCENT",
      "direction": "TARGET",
      "department": "credit"
    }
  ],
  "departments": [
    {
      "id": "dept-credit",
      "name": "Credit / Lending",
      "description": "Underwriting and portfolio quality.",
      "core": true
    },
    {
      "id": "dept-deposits",
      "name": "Deposits",
      "description": "Deposit products and funding.",
      "core": true
    },
    {
      "id": "dept-compliance",
      "name": "Compliance",
      "description": "AML, KYC, conduct, audit liaison.",
      "core": true
    },
    {
      "id": "dept-operations",
      "name": "Operations",
      "description": "Payments and processing.",
      "core": true
    },
    {
      "id": "dept-finance",
      "name": "Finance",
      "description": "NIM, ALM, reporting.",
      "core": true
    },
    {
      "id": "dept-risk",
      "name": "Risk",
      "description": "Credit and operational risk.",
      "core": true
    },
    {
      "id": "dept-channels",
      "name": "Channels",
      "description": "Branch and digital channels.",
      "core": false
    }
  ],
  "roles": [
    {
      "id": "role-credit",
      "title": "Credit Manager",
      "departmentId": "dept-credit",
      "description": "Owns lending decisions and NPL."
    },
    {
      "id": "role-deposits",
      "title": "Deposits Product Lead",
      "departmentId": "dept-deposits",
      "description": "Owns deposit book growth."
    },
    {
      "id": "role-aml",
      "title": "AML Officer",
      "departmentId": "dept-compliance",
      "description": "Owns AML alert disposition."
    },
    {
      "id": "role-ops",
      "title": "Operations Manager",
      "departmentId": "dept-operations",
      "description": "Owns STP and payments."
    },
    {
      "id": "role-cfo",
      "title": "Finance Controller",
      "departmentId": "dept-finance",
      "description": "Owns NIM and reporting."
    },
    {
      "id": "role-risk",
      "title": "Risk Officer",
      "departmentId": "dept-risk",
      "description": "Owns risk appetite monitoring."
    },
    {
      "id": "role-auditor",
      "title": "Internal Auditor",
      "departmentId": "dept-compliance",
      "description": "Owns audit findings tracking."
    }
  ],
  "workflowBlueprints": [
    {
      "id": "wf-kyc",
      "name": "KYC onboarding",
      "department": "compliance",
      "purpose": "Identify and verify customers.",
      "trigger": "New customer application",
      "stages": [
        "Collect data",
        "Verify",
        "Risk rate",
        "Approve/reject"
      ],
      "outputs": [
        "KYC profile"
      ]
    },
    {
      "id": "wf-loan",
      "name": "Loan origination",
      "department": "credit",
      "purpose": "Underwrite and book loans with approvals.",
      "trigger": "Loan application",
      "stages": [
        "Intake",
        "Credit analysis",
        "Approval chain",
        "Disburse"
      ],
      "outputs": [
        "Loan account"
      ]
    },
    {
      "id": "wf-collection",
      "name": "Collections",
      "department": "credit",
      "purpose": "Manage delinquent accounts.",
      "trigger": "Days past due threshold",
      "stages": [
        "Segment",
        "Contact",
        "Restructure options",
        "Escalate"
      ],
      "outputs": [
        "Collection case"
      ]
    },
    {
      "id": "wf-aml",
      "name": "AML alert handling",
      "department": "compliance",
      "purpose": "Investigate AML alerts with audit trail.",
      "trigger": "Alert generated",
      "stages": [
        "Triage",
        "Investigate",
        "Escalate/SAR",
        "Close"
      ],
      "outputs": [
        "Alert case",
        "Audit log"
      ]
    },
    {
      "id": "wf-deposit",
      "name": "Deposit account opening",
      "department": "deposits",
      "purpose": "Open deposit accounts post-KYC.",
      "trigger": "KYC cleared",
      "stages": [
        "Select product",
        "Open account",
        "Fund",
        "Activate"
      ],
      "outputs": [
        "Deposit account"
      ]
    },
    {
      "id": "wf-payment",
      "name": "Payment processing",
      "department": "operations",
      "purpose": "Process payments with exception handling.",
      "trigger": "Payment instruction",
      "stages": [
        "Validate",
        "STP/exception",
        "Settle",
        "Reconcile"
      ],
      "outputs": [
        "Payment status"
      ]
    },
    {
      "id": "wf-audit",
      "name": "Audit finding remediation",
      "department": "compliance",
      "purpose": "Remediate audit findings.",
      "trigger": "Finding opened",
      "stages": [
        "Assign",
        "Remediate",
        "Evidence",
        "Close"
      ],
      "outputs": [
        "Closed finding"
      ]
    }
  ],
  "dashboardBlueprints": [
    {
      "id": "dash-ceo",
      "name": "Bank Command Center",
      "audience": [
        "CEO",
        "CRO"
      ],
      "purpose": "NPL, deposits, compliance, NIM.",
      "kpiIds": [
        "kpi-npl",
        "kpi-deposit-growth",
        "kpi-kyc-backlog",
        "kpi-nim",
        "kpi-audit-findings"
      ],
      "sections": [
        "Credit",
        "Funding",
        "Compliance",
        "Earnings"
      ]
    },
    {
      "id": "dash-credit",
      "name": "Credit Risk",
      "audience": [
        "Credit Manager"
      ],
      "purpose": "NPL, delinquency, TAT.",
      "kpiIds": [
        "kpi-npl",
        "kpi-delinquency",
        "kpi-loan-approval-tat",
        "kpi-provision"
      ],
      "sections": [
        "Portfolio",
        "Origination"
      ]
    },
    {
      "id": "dash-compliance",
      "name": "Compliance & AML",
      "audience": [
        "AML Officer",
        "Auditor"
      ],
      "purpose": "KYC backlog, alerts, findings.",
      "kpiIds": [
        "kpi-kyc-backlog",
        "kpi-sar",
        "kpi-audit-findings"
      ],
      "sections": [
        "KYC",
        "AML",
        "Audit"
      ]
    },
    {
      "id": "dash-ops",
      "name": "Operations Resilience",
      "audience": [
        "Operations Manager"
      ],
      "purpose": "STP and uptime.",
      "kpiIds": [
        "kpi-stp",
        "kpi-uptime"
      ],
      "sections": [
        "Payments",
        "Channels"
      ]
    },
    {
      "id": "dash-finance",
      "name": "NIM & Efficiency",
      "audience": [
        "Finance"
      ],
      "purpose": "NIM and cost-income.",
      "kpiIds": [
        "kpi-nim",
        "kpi-cir",
        "kpi-deposit-growth"
      ],
      "sections": [
        "Margin",
        "Costs"
      ]
    }
  ],
  "aiAgentRoster": [
    {
      "id": "agent-credit",
      "name": "Credit Memo Agent",
      "mission": "Planning record: draft credit memos for human approval chains; never auto-approve credit.",
      "permissions": "APPROVAL_REQUIRED",
      "inputs": [
        "Application",
        "Bureau"
      ],
      "outputs": [
        "Draft credit memo"
      ],
      "department": "credit"
    },
    {
      "id": "agent-aml",
      "name": "AML Triage Agent",
      "mission": "Planning record: prioritize AML alerts; disposition requires human compliance approval.",
      "permissions": "APPROVAL_REQUIRED",
      "inputs": [
        "Alerts",
        "Customer profile"
      ],
      "outputs": [
        "Triage ranking"
      ],
      "department": "compliance"
    },
    {
      "id": "agent-collections",
      "name": "Collections Advisor",
      "mission": "Planning record: suggest collection strategies within policy.",
      "permissions": "SUGGEST",
      "inputs": [
        "Delinquency",
        "History"
      ],
      "outputs": [
        "Strategy suggestions"
      ],
      "department": "credit"
    },
    {
      "id": "agent-ops",
      "name": "Payments Exception Agent",
      "mission": "Planning record: classify payment exceptions for ops review.",
      "permissions": "SUGGEST",
      "inputs": [
        "Exceptions"
      ],
      "outputs": [
        "Exception classes"
      ],
      "department": "operations"
    },
    {
      "id": "agent-audit",
      "name": "Audit Evidence Agent",
      "mission": "Planning record: map controls to evidence; read-only summaries.",
      "permissions": "READ_ONLY",
      "inputs": [
        "Findings",
        "Controls"
      ],
      "outputs": [
        "Evidence map"
      ],
      "department": "compliance"
    },
    {
      "id": "agent-brief",
      "name": "Risk Briefing Agent",
      "mission": "Planning record: executive risk/compliance brief.",
      "permissions": "READ_ONLY",
      "inputs": [
        "KPIs"
      ],
      "outputs": [
        "Brief"
      ],
      "department": "risk"
    }
  ],
  "mockSchema": {
    "entities": [
      {
        "id": "ent-customer",
        "name": "Customer",
        "description": "Bank customer.",
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
            "name": "kycStatus",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "PENDING",
              "CLEARED",
              "REJECTED",
              "REFRESH_DUE"
            ]
          }
        ]
      },
      {
        "id": "ent-deposit",
        "name": "DepositAccount",
        "description": "Deposit account.",
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
            "name": "balance",
            "type": "CURRENCY",
            "required": true
          },
          {
            "name": "product",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "SAVINGS",
              "CURRENT",
              "TERM"
            ]
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "ACTIVE",
              "CLOSED",
              "FROZEN"
            ]
          }
        ]
      },
      {
        "id": "ent-loan",
        "name": "LoanAccount",
        "description": "Loan account.",
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
            "name": "principal",
            "type": "CURRENCY",
            "required": true
          },
          {
            "name": "outstanding",
            "type": "CURRENCY",
            "required": true
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "APPLICATION",
              "ACTIVE",
              "DELINQUENT",
              "NPL",
              "CLOSED"
            ]
          },
          {
            "name": "daysPastDue",
            "type": "NUMBER",
            "required": false
          }
        ]
      },
      {
        "id": "ent-application",
        "name": "LoanApplication",
        "description": "Loan application.",
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
            "name": "requestedAmount",
            "type": "CURRENCY",
            "required": true
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "INTAKE",
              "ANALYSIS",
              "APPROVED",
              "REJECTED",
              "DISBURSED"
            ]
          }
        ]
      },
      {
        "id": "ent-aml-alert",
        "name": "AmlAlert",
        "description": "AML monitoring alert.",
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
            "name": "raisedAt",
            "type": "DATETIME",
            "required": true
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "OPEN",
              "ESCALATED",
              "CLOSED"
            ]
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
          }
        ]
      },
      {
        "id": "ent-payment",
        "name": "Payment",
        "description": "Payment instruction.",
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
              "RECEIVED",
              "STP",
              "EXCEPTION",
              "SETTLED",
              "REJECTED"
            ]
          },
          {
            "name": "createdAt",
            "type": "DATETIME",
            "required": true
          }
        ]
      },
      {
        "id": "ent-audit-finding",
        "name": "AuditFinding",
        "description": "Audit or compliance finding.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
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
              "OPEN",
              "REMEDIATING",
              "CLOSED"
            ]
          },
          {
            "name": "openedAt",
            "type": "DATE",
            "required": true
          }
        ]
      }
    ],
    "relationships": [
      {
        "fromEntityId": "ent-customer",
        "toEntityId": "ent-deposit",
        "type": "ONE_TO_MANY",
        "description": "Customer has deposit accounts."
      },
      {
        "fromEntityId": "ent-customer",
        "toEntityId": "ent-loan",
        "type": "ONE_TO_MANY",
        "description": "Customer has loans."
      },
      {
        "fromEntityId": "ent-customer",
        "toEntityId": "ent-application",
        "type": "ONE_TO_MANY",
        "description": "Customer has loan applications."
      },
      {
        "fromEntityId": "ent-customer",
        "toEntityId": "ent-aml-alert",
        "type": "ONE_TO_MANY",
        "description": "Customer has AML alerts."
      },
      {
        "fromEntityId": "ent-customer",
        "toEntityId": "ent-payment",
        "type": "ONE_TO_MANY",
        "description": "Customer has payments."
      }
    ]
  },
  "terminology": {
    "NPL": [
      "Non-Performing Loan"
    ],
    "KYC": [
      "Know Your Customer"
    ],
    "AML": [
      "Anti-Money Laundering"
    ],
    "NIM": [
      "Net Interest Margin"
    ],
    "STP": [
      "Straight-Through Processing"
    ],
    "SAR": [
      "Suspicious Activity Report",
      "گزارش مشکوک"
    ]
  },
  "risks": [
    "Credit decisions and AML dispositions require human APPROVAL_REQUIRED controls.",
    "AI agents are planning records only and must leave auditable trails.",
    "KYC/AML failures create regulatory and reputational harm.",
    "Unauthorized automated disbursements or account freezes are prohibited.",
    "Audit findings must be evidenced before closure."
  ],
  "recommendedIntegrations": [
    {
      "name": "Core banking",
      "category": "core",
      "purpose": "Accounts, ledgers, products."
    },
    {
      "name": "Loan origination",
      "category": "credit",
      "purpose": "Applications and underwriting."
    },
    {
      "name": "AML / transaction monitoring",
      "category": "compliance",
      "purpose": "Alerts and case management."
    },
    {
      "name": "Payments switch",
      "category": "operations",
      "purpose": "Payment rails and exceptions."
    },
    {
      "name": "GRC / audit",
      "category": "compliance",
      "purpose": "Findings and evidence."
    }
  ]
} satisfies IndustryPack;
