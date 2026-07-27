import type { IndustryPack } from "../industry-pack-schema.js";

export const steelPack = {
  "schemaVersion": "1.0",
  "id": "steel",
  "name": "Steel Manufacturing",
  "description": "Steel mill pack covering melt shop, rolling, energy intensity, quality, and logistics.",
  "aliases": [
    "steel",
    "steel mill",
    "melt shop",
    "rolling mill",
    "فولاد",
    "ذوب",
    "نورد"
  ],
  "ceoConcerns": [
    {
      "id": "cc-throughput",
      "title": "Mill throughput",
      "description": "Meeting melt and rolling tonnage plans.",
      "priority": "HIGH"
    },
    {
      "id": "cc-energy",
      "title": "Energy intensity",
      "description": "Reducing energy per ton produced.",
      "priority": "HIGH"
    },
    {
      "id": "cc-yield",
      "title": "Yield & scrap",
      "description": "Improving metallic yield and scrap control.",
      "priority": "HIGH"
    },
    {
      "id": "cc-quality",
      "title": "Product quality",
      "description": "Reducing defects and customer claims.",
      "priority": "HIGH"
    },
    {
      "id": "cc-furnace",
      "title": "Furnace availability",
      "description": "Keeping EAF/BOF and casters available.",
      "priority": "HIGH"
    },
    {
      "id": "cc-margin",
      "title": "Contribution margin",
      "description": "Protecting margin against energy and scrap prices.",
      "priority": "MEDIUM"
    }
  ],
  "kpis": [
    {
      "id": "kpi-melt-tons",
      "name": "Melt shop tons",
      "description": "Tons melted in period.",
      "unit": "QUANTITY",
      "direction": "HIGHER_IS_BETTER",
      "department": "melt-shop"
    },
    {
      "id": "kpi-roll-tons",
      "name": "Rolling tons",
      "description": "Tons rolled in period.",
      "unit": "QUANTITY",
      "direction": "HIGHER_IS_BETTER",
      "department": "rolling"
    },
    {
      "id": "kpi-oee",
      "name": "Line OEE",
      "description": "Rolling line OEE.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "rolling"
    },
    {
      "id": "kpi-energy-intensity",
      "name": "Energy intensity",
      "description": "Energy per ton produced.",
      "unit": "RATE",
      "direction": "LOWER_IS_BETTER",
      "department": "energy"
    },
    {
      "id": "kpi-yield",
      "name": "Metallic yield",
      "description": "Finished tons versus metallic input.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "melt-shop"
    },
    {
      "id": "kpi-scrap-rate",
      "name": "Scrap rate",
      "description": "Scrap percent of output.",
      "unit": "PERCENT",
      "direction": "LOWER_IS_BETTER",
      "department": "quality"
    },
    {
      "id": "kpi-defect",
      "name": "Defect rate",
      "description": "Defects per ton.",
      "unit": "RATE",
      "direction": "LOWER_IS_BETTER",
      "department": "quality"
    },
    {
      "id": "kpi-furnace-util",
      "name": "Furnace utilization",
      "description": "Furnace operating versus available.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "melt-shop"
    },
    {
      "id": "kpi-caster-uptime",
      "name": "Caster uptime",
      "description": "Caster available time percent.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "melt-shop"
    },
    {
      "id": "kpi-otd",
      "name": "On-time delivery",
      "description": "Orders delivered on time.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "logistics"
    },
    {
      "id": "kpi-inventory",
      "name": "Slab/coil inventory days",
      "description": "Days of inventory.",
      "unit": "DURATION",
      "direction": "TARGET",
      "department": "logistics"
    },
    {
      "id": "kpi-margin",
      "name": "Contribution margin",
      "description": "Margin per ton.",
      "unit": "CURRENCY",
      "direction": "HIGHER_IS_BETTER",
      "department": "finance"
    },
    {
      "id": "kpi-heats-plan",
      "name": "Heats plan attainment",
      "description": "Heats completed versus planned.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "melt-shop"
    },
    {
      "id": "kpi-rework",
      "name": "Rework tons",
      "description": "Tons requiring rework.",
      "unit": "QUANTITY",
      "direction": "LOWER_IS_BETTER",
      "department": "quality"
    }
  ],
  "departments": [
    {
      "id": "dept-melt-shop",
      "name": "Melt Shop",
      "description": "Melting and casting.",
      "core": true
    },
    {
      "id": "dept-rolling",
      "name": "Rolling",
      "description": "Hot/cold rolling operations.",
      "core": true
    },
    {
      "id": "dept-quality",
      "name": "Quality",
      "description": "Metallurgy and inspection.",
      "core": true
    },
    {
      "id": "dept-energy",
      "name": "Energy",
      "description": "Power, gas, and utilities.",
      "core": true
    },
    {
      "id": "dept-logistics",
      "name": "Logistics",
      "description": "Yard, shipping, inventory.",
      "core": true
    },
    {
      "id": "dept-maintenance",
      "name": "Maintenance",
      "description": "Furnace and mill maintenance.",
      "core": true
    },
    {
      "id": "dept-finance",
      "name": "Finance",
      "description": "Cost and margin.",
      "core": false
    }
  ],
  "roles": [
    {
      "id": "role-melt",
      "title": "Melt Shop Manager",
      "departmentId": "dept-melt-shop",
      "description": "Owns heats and casting."
    },
    {
      "id": "role-roll",
      "title": "Rolling Manager",
      "departmentId": "dept-rolling",
      "description": "Owns rolling schedule."
    },
    {
      "id": "role-met",
      "title": "Metallurgist",
      "departmentId": "dept-quality",
      "description": "Owns grade quality."
    },
    {
      "id": "role-energy",
      "title": "Energy Manager",
      "departmentId": "dept-energy",
      "description": "Owns energy intensity."
    },
    {
      "id": "role-logistics",
      "title": "Yard / Logistics Lead",
      "departmentId": "dept-logistics",
      "description": "Owns inventory and shipments."
    },
    {
      "id": "role-maint",
      "title": "Maintenance Manager",
      "departmentId": "dept-maintenance",
      "description": "Owns furnace/mill reliability."
    },
    {
      "id": "role-cost",
      "title": "Cost Analyst",
      "departmentId": "dept-finance",
      "description": "Owns margin per ton."
    }
  ],
  "workflowBlueprints": [
    {
      "id": "wf-heat",
      "name": "Heat planning & melting",
      "department": "melt-shop",
      "purpose": "Plan and execute furnace heats.",
      "trigger": "Daily heat plan",
      "stages": [
        "Plan heats",
        "Charge",
        "Melt",
        "Tap",
        "Record"
      ],
      "outputs": [
        "Heat log"
      ]
    },
    {
      "id": "wf-cast",
      "name": "Casting",
      "department": "melt-shop",
      "purpose": "Cast heats into slabs/billets.",
      "trigger": "Heat ready",
      "stages": [
        "Prepare caster",
        "Cast",
        "Cut",
        "Stamp"
      ],
      "outputs": [
        "Cast report"
      ]
    },
    {
      "id": "wf-roll-schedule",
      "name": "Rolling schedule",
      "department": "rolling",
      "purpose": "Sequence coils/bars on mills.",
      "trigger": "Order book update",
      "stages": [
        "Prioritize",
        "Sequence",
        "Release",
        "Confirm"
      ],
      "outputs": [
        "Rolling schedule"
      ]
    },
    {
      "id": "wf-roll-exec",
      "name": "Rolling execution",
      "department": "rolling",
      "purpose": "Roll and finish product.",
      "trigger": "Schedule release",
      "stages": [
        "Heat/reheat",
        "Roll",
        "Finish",
        "Inspect"
      ],
      "outputs": [
        "Coil/bar record"
      ]
    },
    {
      "id": "wf-quality",
      "name": "Metallurgical QC",
      "department": "quality",
      "purpose": "Test and release product.",
      "trigger": "Sample available",
      "stages": [
        "Sample",
        "Test",
        "Disposition",
        "Release/hold"
      ],
      "outputs": [
        "QC certificate"
      ]
    },
    {
      "id": "wf-energy",
      "name": "Energy monitoring",
      "department": "energy",
      "purpose": "Track and reduce energy intensity.",
      "trigger": "Shift close",
      "stages": [
        "Collect meters",
        "Normalize per ton",
        "Flag outliers",
        "Actions"
      ],
      "outputs": [
        "Energy report"
      ]
    },
    {
      "id": "wf-ship",
      "name": "Shipment & logistics",
      "department": "logistics",
      "purpose": "Allocate and ship finished steel.",
      "trigger": "Order ready",
      "stages": [
        "Allocate",
        "Load",
        "Ship",
        "POD"
      ],
      "outputs": [
        "Shipment"
      ]
    },
    {
      "id": "wf-furnace-maint",
      "name": "Furnace maintenance",
      "department": "maintenance",
      "purpose": "Maintain critical melt assets.",
      "trigger": "PM due or failure",
      "stages": [
        "Diagnose",
        "Repair",
        "Verify",
        "Restart"
      ],
      "outputs": [
        "WO close"
      ]
    }
  ],
  "dashboardBlueprints": [
    {
      "id": "dash-ceo",
      "name": "Mill Command Center",
      "audience": [
        "CEO",
        "Plant Manager"
      ],
      "purpose": "Tons, energy, quality, margin.",
      "kpiIds": [
        "kpi-melt-tons",
        "kpi-roll-tons",
        "kpi-energy-intensity",
        "kpi-yield",
        "kpi-margin"
      ],
      "sections": [
        "Throughput",
        "Energy",
        "Margin"
      ]
    },
    {
      "id": "dash-melt",
      "name": "Melt Shop",
      "audience": [
        "Melt Shop Manager"
      ],
      "purpose": "Heats, furnace util, caster.",
      "kpiIds": [
        "kpi-melt-tons",
        "kpi-heats-plan",
        "kpi-furnace-util",
        "kpi-caster-uptime",
        "kpi-yield"
      ],
      "sections": [
        "Heats",
        "Assets"
      ]
    },
    {
      "id": "dash-rolling",
      "name": "Rolling Mill",
      "audience": [
        "Rolling Manager"
      ],
      "purpose": "Tons, OEE, defects.",
      "kpiIds": [
        "kpi-roll-tons",
        "kpi-oee",
        "kpi-defect",
        "kpi-rework"
      ],
      "sections": [
        "Schedule",
        "Quality"
      ]
    },
    {
      "id": "dash-energy",
      "name": "Energy Intensity",
      "audience": [
        "Energy Manager"
      ],
      "purpose": "Energy per ton trends.",
      "kpiIds": [
        "kpi-energy-intensity"
      ],
      "sections": [
        "Intensity",
        "Utilities"
      ]
    },
    {
      "id": "dash-quality",
      "name": "Quality & Metallurgy",
      "audience": [
        "Metallurgist"
      ],
      "purpose": "Defects, scrap, rework.",
      "kpiIds": [
        "kpi-defect",
        "kpi-scrap-rate",
        "kpi-rework",
        "kpi-yield"
      ],
      "sections": [
        "Holds",
        "Claims"
      ]
    },
    {
      "id": "dash-logistics",
      "name": "Yard & Logistics",
      "audience": [
        "Logistics Lead"
      ],
      "purpose": "Inventory days and OTD.",
      "kpiIds": [
        "kpi-inventory",
        "kpi-otd"
      ],
      "sections": [
        "Yard",
        "Shipments"
      ]
    }
  ],
  "aiAgentRoster": [
    {
      "id": "agent-melt",
      "name": "Heat Planning Agent",
      "mission": "Planning record: propose heat sequences for planner approval.",
      "permissions": "SUGGEST",
      "inputs": [
        "Order book",
        "Furnace status"
      ],
      "outputs": [
        "Heat plan draft"
      ],
      "department": "melt-shop"
    },
    {
      "id": "agent-roll",
      "name": "Rolling Schedule Agent",
      "mission": "Planning record: suggest rolling sequences and changeovers.",
      "permissions": "SUGGEST",
      "inputs": [
        "Orders",
        "Mill constraints"
      ],
      "outputs": [
        "Schedule draft"
      ],
      "department": "rolling"
    },
    {
      "id": "agent-energy",
      "name": "Energy Advisor",
      "mission": "Planning record: flag energy-intensity outliers and suggest actions.",
      "permissions": "SUGGEST",
      "inputs": [
        "Meter data",
        "Tons"
      ],
      "outputs": [
        "Energy actions"
      ],
      "department": "energy"
    },
    {
      "id": "agent-quality",
      "name": "Quality Triage Agent",
      "mission": "Planning record: cluster defects and suggest holds for metallurgist review.",
      "permissions": "APPROVAL_REQUIRED",
      "inputs": [
        "QC results"
      ],
      "outputs": [
        "Hold suggestions"
      ],
      "department": "quality"
    },
    {
      "id": "agent-brief",
      "name": "Mill Briefing Agent",
      "mission": "Planning record: shift KPI brief.",
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
        "id": "ent-grade",
        "name": "SteelGrade",
        "description": "Steel grade specification.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "code",
            "type": "STRING",
            "required": true
          },
          {
            "name": "description",
            "type": "STRING",
            "required": true
          }
        ]
      },
      {
        "id": "ent-heat",
        "name": "Heat",
        "description": "Furnace heat.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "heatNumber",
            "type": "STRING",
            "required": true
          },
          {
            "name": "gradeId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-grade"
          },
          {
            "name": "tappedAt",
            "type": "DATETIME",
            "required": false
          },
          {
            "name": "tons",
            "type": "NUMBER",
            "required": true
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "PLANNED",
              "MELTING",
              "TAPPED",
              "CAST"
            ]
          }
        ]
      },
      {
        "id": "ent-slab",
        "name": "SlabOrBillet",
        "description": "Cast product.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "heatId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-heat"
          },
          {
            "name": "weightTons",
            "type": "NUMBER",
            "required": true
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "AVAILABLE",
              "ALLOCATED",
              "ROLLED"
            ]
          }
        ]
      },
      {
        "id": "ent-coil",
        "name": "CoilOrBar",
        "description": "Rolled finished product.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "slabId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-slab"
          },
          {
            "name": "gradeId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-grade"
          },
          {
            "name": "weightTons",
            "type": "NUMBER",
            "required": true
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "PRODUCED",
              "HOLD",
              "SHIPPED"
            ]
          }
        ]
      },
      {
        "id": "ent-energy",
        "name": "EnergyReading",
        "description": "Energy meter reading.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "area",
            "type": "STRING",
            "required": true
          },
          {
            "name": "readingAt",
            "type": "DATETIME",
            "required": true
          },
          {
            "name": "kwh",
            "type": "NUMBER",
            "required": true
          },
          {
            "name": "tonsBasis",
            "type": "NUMBER",
            "required": false
          }
        ]
      },
      {
        "id": "ent-qc",
        "name": "QcTest",
        "description": "Metallurgical QC test.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "coilId",
            "type": "REFERENCE",
            "required": false,
            "referenceEntityId": "ent-coil"
          },
          {
            "name": "heatId",
            "type": "REFERENCE",
            "required": false,
            "referenceEntityId": "ent-heat"
          },
          {
            "name": "result",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "PASS",
              "FAIL",
              "CONDITIONAL"
            ]
          },
          {
            "name": "testedAt",
            "type": "DATETIME",
            "required": true
          }
        ]
      },
      {
        "id": "ent-shipment",
        "name": "Shipment",
        "description": "Outbound shipment.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "coilId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-coil"
          },
          {
            "name": "shippedAt",
            "type": "DATETIME",
            "required": false
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "PLANNED",
              "SHIPPED",
              "DELIVERED"
            ]
          }
        ]
      }
    ],
    "relationships": [
      {
        "fromEntityId": "ent-grade",
        "toEntityId": "ent-heat",
        "type": "ONE_TO_MANY",
        "description": "Grade used by heats."
      },
      {
        "fromEntityId": "ent-heat",
        "toEntityId": "ent-slab",
        "type": "ONE_TO_MANY",
        "description": "Heat casts slabs/billets."
      },
      {
        "fromEntityId": "ent-slab",
        "toEntityId": "ent-coil",
        "type": "ONE_TO_MANY",
        "description": "Slab rolls into coils/bars."
      },
      {
        "fromEntityId": "ent-coil",
        "toEntityId": "ent-qc",
        "type": "ONE_TO_MANY",
        "description": "Coil has QC tests."
      },
      {
        "fromEntityId": "ent-coil",
        "toEntityId": "ent-shipment",
        "type": "ONE_TO_MANY",
        "description": "Coil has shipments."
      }
    ]
  },
  "terminology": {
    "EAF": [
      "Electric Arc Furnace"
    ],
    "BOF": [
      "Basic Oxygen Furnace"
    ],
    "Heat": [
      "Furnace heat",
      "ذوب"
    ],
    "OEE": [
      "Overall Equipment Effectiveness"
    ],
    "EnergyIntensity": [
      "Energy per ton",
      "شدت انرژی"
    ]
  },
  "risks": [
    "Furnace downtime cascades into rolling starvation.",
    "Energy price spikes destroy margins.",
    "Quality escapes create customer claims and rework.",
    "AI suggestions must not auto-release metallurgical holds."
  ],
  "recommendedIntegrations": [
    {
      "name": "MES / Level 2",
      "category": "operations",
      "purpose": "Heats, casting, rolling confirmations."
    },
    {
      "name": "Energy management",
      "category": "energy",
      "purpose": "Meters and intensity."
    },
    {
      "name": "LIMS / QMS",
      "category": "quality",
      "purpose": "Metallurgical tests and holds."
    },
    {
      "name": "ERP",
      "category": "core",
      "purpose": "Orders, inventory, costing."
    }
  ]
} satisfies IndustryPack;
