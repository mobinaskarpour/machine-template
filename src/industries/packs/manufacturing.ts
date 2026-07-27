import type { IndustryPack } from "../industry-pack-schema.js";

export const manufacturingPack = {
  "schemaVersion": "1.0",
  "id": "manufacturing",
  "name": "Manufacturing & Food Production",
  "description": "Industry pack for discrete and process manufacturing plants, including food factories with pasta/semolina lines, packaging, quality control, warehouse, and distribution operations.",
  "aliases": [
    "manufacturing",
    "manufacturer",
    "factory",
    "industrial production",
    "food manufacturing",
    "food production",
    "pasta",
    "macaroni",
    "semolina",
    "packaging",
    "distribution",
    "quality control",
    "concrete",
    "precast",
    "تولید",
    "تولیدی",
    "کارخانه",
    "صنعتی",
    "صنایع غذایی",
    "پاستا",
    "ماکارون"
  ],
  "ceoConcerns": [
    {
      "id": "cc-throughput",
      "title": "Production throughput & plan attainment",
      "description": "Meeting production plans across extrusion, drying, and packaging lines.",
      "priority": "HIGH"
    },
    {
      "id": "cc-downtime",
      "title": "Unplanned downtime & equipment utilization",
      "description": "Reducing stoppages and improving OEE on critical assets.",
      "priority": "HIGH"
    },
    {
      "id": "cc-materials",
      "title": "Raw & packaging material availability",
      "description": "Preventing stockouts of flour/semolina, additives, and packaging.",
      "priority": "HIGH"
    },
    {
      "id": "cc-quality-safety",
      "title": "Quality consistency & food-safety compliance",
      "description": "Batch quality, allergen controls, sanitation, and regulatory standards.",
      "priority": "HIGH"
    },
    {
      "id": "cc-waste-freshness",
      "title": "Waste, scrap & inventory freshness",
      "description": "Controlling scrap/rework and expiry-risk inventory.",
      "priority": "MEDIUM"
    },
    {
      "id": "cc-fulfillment",
      "title": "Order fulfillment & distribution",
      "description": "On-time delivery, fill rate, transfers, and dispatch.",
      "priority": "HIGH"
    },
    {
      "id": "cc-finance",
      "title": "Receivables & gross margin",
      "description": "AR aging, DSO, and margin protection against yield loss.",
      "priority": "MEDIUM"
    },
    {
      "id": "cc-forecast-procure",
      "title": "Demand forecasting & procurement delays",
      "description": "Forecast accuracy and supplier lead-time risk.",
      "priority": "MEDIUM"
    }
  ],
  "kpis": [
    {
      "id": "kpi-oee",
      "name": "OEE",
      "description": "Overall equipment effectiveness.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "production"
    },
    {
      "id": "kpi-plan-attainment",
      "name": "Production plan attainment",
      "description": "Actual versus planned output.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "planning"
    },
    {
      "id": "kpi-unplanned-downtime",
      "name": "Unplanned downtime",
      "description": "Unexpected line stoppage hours.",
      "unit": "DURATION",
      "direction": "LOWER_IS_BETTER",
      "department": "maintenance"
    },
    {
      "id": "kpi-capacity-util",
      "name": "Capacity utilization",
      "description": "Used versus available capacity.",
      "unit": "PERCENT",
      "direction": "TARGET",
      "department": "production"
    },
    {
      "id": "kpi-scrap-rate",
      "name": "Scrap rate",
      "description": "Scrap as percent of input.",
      "unit": "PERCENT",
      "direction": "LOWER_IS_BETTER",
      "department": "production"
    },
    {
      "id": "kpi-rework",
      "name": "Rework rate",
      "description": "Reworked versus total produced.",
      "unit": "PERCENT",
      "direction": "LOWER_IS_BETTER",
      "department": "quality"
    },
    {
      "id": "kpi-fpy",
      "name": "First-pass yield",
      "description": "Pass without rework.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "quality"
    },
    {
      "id": "kpi-otd",
      "name": "On-time delivery",
      "description": "Orders delivered by promise date.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "distribution"
    },
    {
      "id": "kpi-inv-turnover",
      "name": "Inventory turnover",
      "description": "COGS / average inventory.",
      "unit": "RATE",
      "direction": "HIGHER_IS_BETTER",
      "department": "warehouse"
    },
    {
      "id": "kpi-stockout",
      "name": "Stockout rate",
      "description": "SKU-periods with zero stock.",
      "unit": "PERCENT",
      "direction": "LOWER_IS_BETTER",
      "department": "warehouse"
    },
    {
      "id": "kpi-ar-aging",
      "name": "AR aging",
      "description": "Receivables overdue beyond terms.",
      "unit": "CURRENCY",
      "direction": "LOWER_IS_BETTER",
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
      "id": "kpi-gross-margin",
      "name": "Gross margin",
      "description": "Gross profit percent.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "finance"
    },
    {
      "id": "kpi-prod-yield",
      "name": "Production yield",
      "description": "Output versus theoretical yield.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "production"
    },
    {
      "id": "kpi-line-eff",
      "name": "Line efficiency",
      "description": "Actual versus rated line speed.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "production"
    },
    {
      "id": "kpi-batch-pass",
      "name": "Batch quality pass rate",
      "description": "Batches released without hold/reject.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "quality"
    },
    {
      "id": "kpi-pack-defect",
      "name": "Packaging defect rate",
      "description": "Defective packs versus produced.",
      "unit": "PERCENT",
      "direction": "LOWER_IS_BETTER",
      "department": "production"
    },
    {
      "id": "kpi-waste-pct",
      "name": "Waste percentage",
      "description": "Waste versus input mass.",
      "unit": "PERCENT",
      "direction": "LOWER_IS_BETTER",
      "department": "production"
    },
    {
      "id": "kpi-rm-variance",
      "name": "Raw-material variance",
      "description": "Actual RM versus BOM standard.",
      "unit": "PERCENT",
      "direction": "LOWER_IS_BETTER",
      "department": "procurement"
    },
    {
      "id": "kpi-fg-availability",
      "name": "Finished-goods availability",
      "description": "FG SKUs available to promise.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "warehouse"
    },
    {
      "id": "kpi-fill-rate",
      "name": "Order fill rate",
      "description": "Lines shipped complete first attempt.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "sales"
    },
    {
      "id": "kpi-forecast-acc",
      "name": "Forecast accuracy",
      "description": "Forecast versus actual demand.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "planning"
    },
    {
      "id": "kpi-complaint-rate",
      "name": "Customer complaint rate",
      "description": "Complaints per thousand shipments.",
      "unit": "RATE",
      "direction": "LOWER_IS_BETTER",
      "department": "quality"
    },
    {
      "id": "kpi-quality-hold",
      "name": "Quality hold quantity",
      "description": "FG under quality hold.",
      "unit": "QUANTITY",
      "direction": "LOWER_IS_BETTER",
      "department": "quality"
    },
    {
      "id": "kpi-batch-release",
      "name": "Batch release time",
      "description": "Hours from production end to QA release.",
      "unit": "DURATION",
      "direction": "LOWER_IS_BETTER",
      "department": "quality"
    },
    {
      "id": "kpi-supplier-quality",
      "name": "Supplier quality",
      "description": "Accepted inbound lots versus inspected.",
      "unit": "PERCENT",
      "direction": "HIGHER_IS_BETTER",
      "department": "procurement"
    },
    {
      "id": "kpi-wh-aging",
      "name": "Warehouse aging",
      "description": "Average days of stock.",
      "unit": "DURATION",
      "direction": "TARGET",
      "department": "warehouse"
    },
    {
      "id": "kpi-expiry-risk",
      "name": "Expiry-risk inventory",
      "description": "FG value in expiry-risk window.",
      "unit": "CURRENCY",
      "direction": "LOWER_IS_BETTER",
      "department": "warehouse"
    }
  ],
  "departments": [
    {
      "id": "dept-production",
      "name": "Production",
      "description": "Batch and line manufacturing.",
      "core": true
    },
    {
      "id": "dept-planning",
      "name": "Production Planning",
      "description": "Demand planning, MRP, scheduling.",
      "core": true
    },
    {
      "id": "dept-quality",
      "name": "Quality",
      "description": "Incoming, in-process, and FG QC.",
      "core": true
    },
    {
      "id": "dept-food-safety",
      "name": "Food Safety",
      "description": "HACCP, sanitation, compliance.",
      "core": true
    },
    {
      "id": "dept-maintenance",
      "name": "Maintenance",
      "description": "Preventive and corrective care.",
      "core": true
    },
    {
      "id": "dept-warehouse",
      "name": "Warehouse",
      "description": "RM, packaging, and FG inventory.",
      "core": true
    },
    {
      "id": "dept-procurement",
      "name": "Procurement",
      "description": "Supplier management and purchasing.",
      "core": true
    },
    {
      "id": "dept-sales",
      "name": "Sales",
      "description": "Orders, allocations, customer service.",
      "core": true
    },
    {
      "id": "dept-distribution",
      "name": "Distribution",
      "description": "Dispatch and logistics.",
      "core": false
    },
    {
      "id": "dept-finance",
      "name": "Finance",
      "description": "Invoicing, collections, margin.",
      "core": true
    }
  ],
  "roles": [
    {
      "id": "role-plant-manager",
      "title": "Plant Manager",
      "departmentId": "dept-production",
      "description": "Owns plant throughput, safety, and cost."
    },
    {
      "id": "role-production-planner",
      "title": "Production Planner",
      "departmentId": "dept-planning",
      "description": "Builds schedules and MRP plans."
    },
    {
      "id": "role-qa-manager",
      "title": "QA Manager",
      "departmentId": "dept-quality",
      "description": "Owns batch release and NCR/CAPA."
    },
    {
      "id": "role-food-safety-officer",
      "title": "Food Safety Officer",
      "departmentId": "dept-food-safety",
      "description": "Owns HACCP and audits."
    },
    {
      "id": "role-maintenance-lead",
      "title": "Maintenance Lead",
      "departmentId": "dept-maintenance",
      "description": "Owns PM and downtime response."
    },
    {
      "id": "role-warehouse-supervisor",
      "title": "Warehouse Supervisor",
      "departmentId": "dept-warehouse",
      "description": "Owns inventory accuracy and FEFO."
    },
    {
      "id": "role-buyer",
      "title": "Procurement Buyer",
      "departmentId": "dept-procurement",
      "description": "Owns POs and supplier follow-up."
    },
    {
      "id": "role-sales-ops",
      "title": "Sales Operations",
      "departmentId": "dept-sales",
      "description": "Owns order entry and allocation."
    },
    {
      "id": "role-dispatch-coord",
      "title": "Dispatch Coordinator",
      "departmentId": "dept-distribution",
      "description": "Owns shipment planning and POD."
    },
    {
      "id": "role-ar-specialist",
      "title": "AR Specialist",
      "departmentId": "dept-finance",
      "description": "Owns invoicing and collections."
    }
  ],
  "workflowBlueprints": [
    {
      "id": "wf-demand-planning",
      "name": "Demand planning",
      "department": "planning",
      "purpose": "Convert forecasts and orders into a constrained demand plan.",
      "trigger": "Weekly planning cycle",
      "stages": [
        "Collect forecasts",
        "Reconcile orders",
        "Apply constraints",
        "Publish plan"
      ],
      "outputs": [
        "Demand plan",
        "Exception list"
      ]
    },
    {
      "id": "wf-so-to-production",
      "name": "Sales order to production",
      "department": "sales",
      "purpose": "Translate confirmed sales orders into production requirements.",
      "trigger": "Sales order confirmation",
      "stages": [
        "Validate order",
        "Check ATP",
        "Create production request",
        "Acknowledge"
      ],
      "outputs": [
        "Production request",
        "ATP confirmation"
      ]
    },
    {
      "id": "wf-production-scheduling",
      "name": "Production scheduling",
      "department": "planning",
      "purpose": "Sequence batches and lines against capacity.",
      "trigger": "Approved demand plan",
      "stages": [
        "Load capacity",
        "Sequence SKUs",
        "Assign lines",
        "Release schedule"
      ],
      "outputs": [
        "Line schedule",
        "Changeover plan"
      ]
    },
    {
      "id": "wf-mrp",
      "name": "MRP",
      "department": "planning",
      "purpose": "Explode BOM and generate material requirements.",
      "trigger": "Schedule publish",
      "stages": [
        "BOM explosion",
        "Net inventory",
        "Create planned orders",
        "Release proposals"
      ],
      "outputs": [
        "Planned POs",
        "Planned production orders"
      ]
    },
    {
      "id": "wf-rm-procurement",
      "name": "Raw-material procurement",
      "department": "procurement",
      "purpose": "Purchase critical raw and packaging materials.",
      "trigger": "MRP planned PO",
      "stages": [
        "Source supplier",
        "Create PO",
        "Confirm lead time",
        "Track delivery"
      ],
      "outputs": [
        "Purchase order",
        "Delivery ETA"
      ]
    },
    {
      "id": "wf-supplier-receiving",
      "name": "Supplier receiving",
      "department": "warehouse",
      "purpose": "Receive inbound materials into quarantine or stock.",
      "trigger": "ASN or truck arrival",
      "stages": [
        "Gate check",
        "Unload",
        "Record receipt",
        "Quarantine/stock"
      ],
      "outputs": [
        "Goods receipt",
        "Lot record"
      ]
    },
    {
      "id": "wf-incoming-qc",
      "name": "Incoming QC",
      "department": "quality",
      "purpose": "Inspect inbound lots before release to production.",
      "trigger": "Goods receipt in quarantine",
      "stages": [
        "Sample",
        "Test specs",
        "Accept/reject",
        "Release or return"
      ],
      "outputs": [
        "QC certificate",
        "Release decision"
      ]
    },
    {
      "id": "wf-batch-production",
      "name": "Batch production",
      "department": "production",
      "purpose": "Execute a production batch from weigh-up to bulk output.",
      "trigger": "Released production order",
      "stages": [
        "Issue materials",
        "Weigh-up",
        "Process/run",
        "Record yield",
        "Close batch"
      ],
      "outputs": [
        "Batch record",
        "Yield report"
      ]
    },
    {
      "id": "wf-inprocess-qc",
      "name": "In-process QC",
      "department": "quality",
      "purpose": "Monitor CCPs during the run.",
      "trigger": "Batch in progress",
      "stages": [
        "Sample at CCP",
        "Record results",
        "Adjust/hold",
        "Clear to continue"
      ],
      "outputs": [
        "In-process checklist",
        "Hold notice"
      ]
    },
    {
      "id": "wf-packaging",
      "name": "Packaging",
      "department": "production",
      "purpose": "Pack, label, and code finished product.",
      "trigger": "Bulk ready for pack",
      "stages": [
        "Issue packaging",
        "Pack/label",
        "Checkweigher",
        "Palletize"
      ],
      "outputs": [
        "Packed lots",
        "Packaging report"
      ]
    },
    {
      "id": "wf-fg-release",
      "name": "Finished-goods release",
      "department": "quality",
      "purpose": "Release packed lots after QA review.",
      "trigger": "Packaging complete",
      "stages": [
        "Review docs",
        "Lab results",
        "Approve/hold",
        "Post available"
      ],
      "outputs": [
        "Release certificate",
        "Hold list"
      ]
    },
    {
      "id": "wf-warehouse-transfer",
      "name": "Warehouse transfer",
      "department": "warehouse",
      "purpose": "Move inventory between locations under FEFO.",
      "trigger": "Transfer request",
      "stages": [
        "Create transfer",
        "Pick FEFO",
        "Confirm move",
        "Update locations"
      ],
      "outputs": [
        "Transfer order",
        "Stock positions"
      ]
    },
    {
      "id": "wf-order-allocation",
      "name": "Order allocation",
      "department": "sales",
      "purpose": "Allocate available FG to customer orders.",
      "trigger": "Order cut-off",
      "stages": [
        "Rank orders",
        "Allocate lots",
        "Backorder residuals",
        "Confirm"
      ],
      "outputs": [
        "Allocation plan",
        "Backorder list"
      ]
    },
    {
      "id": "wf-dispatch",
      "name": "Dispatch",
      "department": "distribution",
      "purpose": "Plan loads and ship allocated orders.",
      "trigger": "Allocation confirmed",
      "stages": [
        "Build load",
        "Pick/pack",
        "Ship",
        "Capture POD"
      ],
      "outputs": [
        "Shipment",
        "POD"
      ]
    },
    {
      "id": "wf-customer-complaint",
      "name": "Customer complaint",
      "department": "quality",
      "purpose": "Capture, investigate, and close complaints.",
      "trigger": "Complaint intake",
      "stages": [
        "Log",
        "Classify",
        "Investigate lot",
        "Respond and close"
      ],
      "outputs": [
        "Complaint case",
        "Root-cause summary"
      ]
    },
    {
      "id": "wf-ncr",
      "name": "NCR",
      "department": "quality",
      "purpose": "Document nonconformances from QC or production.",
      "trigger": "Failed inspection",
      "stages": [
        "Open NCR",
        "Containment",
        "Disposition",
        "Link CAPA"
      ],
      "outputs": [
        "NCR record",
        "Disposition"
      ]
    },
    {
      "id": "wf-capa",
      "name": "CAPA",
      "department": "quality",
      "purpose": "Correct and prevent systemic quality issues.",
      "trigger": "NCR escalation",
      "stages": [
        "Define problem",
        "Root cause",
        "Corrective actions",
        "Effectiveness check"
      ],
      "outputs": [
        "CAPA plan",
        "Effectiveness report"
      ]
    },
    {
      "id": "wf-pm",
      "name": "Preventive maintenance",
      "department": "maintenance",
      "purpose": "Execute scheduled PM on critical assets.",
      "trigger": "PM due date",
      "stages": [
        "Issue WO",
        "Lock out",
        "Perform PM",
        "Verify close"
      ],
      "outputs": [
        "Completed WO",
        "Parts usage"
      ]
    },
    {
      "id": "wf-downtime-incident",
      "name": "Downtime incident",
      "department": "maintenance",
      "purpose": "Respond to unplanned stoppages.",
      "trigger": "Line down event",
      "stages": [
        "Alert",
        "Diagnose",
        "Repair",
        "Restart and log"
      ],
      "outputs": [
        "Incident report",
        "Downtime minutes"
      ]
    },
    {
      "id": "wf-invoice-collection",
      "name": "Invoice and collection",
      "department": "finance",
      "purpose": "Invoice shipments and collect receivables.",
      "trigger": "Shipment confirmation",
      "stages": [
        "Generate invoice",
        "Send",
        "Track aging",
        "Collect"
      ],
      "outputs": [
        "Invoice",
        "Collection status"
      ]
    }
  ],
  "dashboardBlueprints": [
    {
      "id": "dash-ceo",
      "name": "CEO Command Center",
      "audience": [
        "CEO",
        "Plant Manager"
      ],
      "purpose": "Executive throughput, quality, margin, fulfillment.",
      "kpiIds": [
        "kpi-oee",
        "kpi-plan-attainment",
        "kpi-otd",
        "kpi-gross-margin",
        "kpi-fill-rate",
        "kpi-complaint-rate"
      ],
      "sections": [
        "Throughput",
        "Quality & safety",
        "Fulfillment",
        "Margin"
      ]
    },
    {
      "id": "dash-production",
      "name": "Production Control",
      "audience": [
        "Plant Manager",
        "Planner"
      ],
      "purpose": "Line performance and schedule adherence.",
      "kpiIds": [
        "kpi-oee",
        "kpi-plan-attainment",
        "kpi-line-eff",
        "kpi-prod-yield",
        "kpi-unplanned-downtime",
        "kpi-capacity-util",
        "kpi-scrap-rate",
        "kpi-waste-pct"
      ],
      "sections": [
        "Line status",
        "Yield & scrap",
        "Schedule"
      ]
    },
    {
      "id": "dash-sales-demand",
      "name": "Sales and Demand",
      "audience": [
        "Sales",
        "Planner"
      ],
      "purpose": "Demand signal and order fill.",
      "kpiIds": [
        "kpi-forecast-acc",
        "kpi-fill-rate",
        "kpi-otd",
        "kpi-fg-availability"
      ],
      "sections": [
        "Forecast",
        "Open orders",
        "ATP"
      ]
    },
    {
      "id": "dash-inventory",
      "name": "Inventory and Warehouse",
      "audience": [
        "Warehouse Supervisor"
      ],
      "purpose": "Stock health, aging, expiry risk.",
      "kpiIds": [
        "kpi-inv-turnover",
        "kpi-stockout",
        "kpi-fg-availability",
        "kpi-wh-aging",
        "kpi-expiry-risk"
      ],
      "sections": [
        "RM & packaging",
        "Finished goods",
        "FEFO"
      ]
    },
    {
      "id": "dash-procurement",
      "name": "Procurement",
      "audience": [
        "Buyer"
      ],
      "purpose": "Supplier delivery and inbound quality.",
      "kpiIds": [
        "kpi-supplier-quality",
        "kpi-rm-variance",
        "kpi-stockout"
      ],
      "sections": [
        "Open POs",
        "Supplier scorecards"
      ]
    },
    {
      "id": "dash-quality",
      "name": "Quality and Food Safety",
      "audience": [
        "QA Manager",
        "Food Safety Officer"
      ],
      "purpose": "Batch quality, holds, complaints.",
      "kpiIds": [
        "kpi-batch-pass",
        "kpi-fpy",
        "kpi-rework",
        "kpi-pack-defect",
        "kpi-quality-hold",
        "kpi-batch-release",
        "kpi-complaint-rate"
      ],
      "sections": [
        "Batch release",
        "Holds & NCR",
        "Complaints"
      ]
    },
    {
      "id": "dash-maintenance",
      "name": "Maintenance",
      "audience": [
        "Maintenance Lead"
      ],
      "purpose": "Downtime and PM readiness.",
      "kpiIds": [
        "kpi-unplanned-downtime",
        "kpi-oee",
        "kpi-capacity-util"
      ],
      "sections": [
        "Incidents",
        "PM schedule"
      ]
    },
    {
      "id": "dash-distribution",
      "name": "Distribution",
      "audience": [
        "Dispatch Coordinator"
      ],
      "purpose": "Outbound performance.",
      "kpiIds": [
        "kpi-otd",
        "kpi-fill-rate"
      ],
      "sections": [
        "Loads",
        "In-transit",
        "POD"
      ]
    },
    {
      "id": "dash-finance",
      "name": "Finance / Receivables",
      "audience": [
        "CFO",
        "AR Specialist"
      ],
      "purpose": "Margin and collections.",
      "kpiIds": [
        "kpi-gross-margin",
        "kpi-ar-aging",
        "kpi-dso"
      ],
      "sections": [
        "Margin",
        "AR aging"
      ]
    },
    {
      "id": "dash-complaints",
      "name": "Customer Complaints",
      "audience": [
        "QA Manager",
        "Sales"
      ],
      "purpose": "Complaint volume and linked lots.",
      "kpiIds": [
        "kpi-complaint-rate",
        "kpi-batch-pass",
        "kpi-quality-hold"
      ],
      "sections": [
        "Open complaints",
        "Root causes"
      ]
    }
  ],
  "aiAgentRoster": [
    {
      "id": "agent-ceo",
      "name": "CEO Briefing Agent",
      "mission": "Planning record: synthesize plant KPIs into a daily executive brief with suggested priorities only.",
      "permissions": "SUGGEST",
      "inputs": [
        "KPI snapshots",
        "Incidents"
      ],
      "outputs": [
        "Daily brief"
      ],
      "department": "executive"
    },
    {
      "id": "agent-prod-planning",
      "name": "Production Planning Agent",
      "mission": "Planning record: propose line schedules and capacity scenarios; never auto-release orders.",
      "permissions": "SUGGEST",
      "inputs": [
        "Demand plan",
        "Capacity"
      ],
      "outputs": [
        "Schedule draft"
      ],
      "department": "planning"
    },
    {
      "id": "agent-demand-forecast",
      "name": "Demand Forecasting Agent",
      "mission": "Planning record: generate forecast scenarios for planner review.",
      "permissions": "SUGGEST",
      "inputs": [
        "Shipments",
        "Orders"
      ],
      "outputs": [
        "Forecast scenario"
      ],
      "department": "planning"
    },
    {
      "id": "agent-maintenance",
      "name": "Maintenance Advisor Agent",
      "mission": "Planning record: suggest PM prioritization and downtime hypotheses.",
      "permissions": "SUGGEST",
      "inputs": [
        "Telemetry",
        "WO history"
      ],
      "outputs": [
        "PM suggestions"
      ],
      "department": "maintenance"
    },
    {
      "id": "agent-quality",
      "name": "Quality Analysis Agent",
      "mission": "Planning record: analyze QC trends and propose NCR/CAPA steps for human approval.",
      "permissions": "APPROVAL_REQUIRED",
      "inputs": [
        "QC results",
        "NCR history"
      ],
      "outputs": [
        "Quality insights"
      ],
      "department": "quality"
    },
    {
      "id": "agent-food-safety",
      "name": "Food Safety and Compliance Agent",
      "mission": "Planning record: flag food-safety risks; no autonomous compliance decisions.",
      "permissions": "APPROVAL_REQUIRED",
      "inputs": [
        "HACCP logs",
        "Sanitation"
      ],
      "outputs": [
        "Risk flags"
      ],
      "department": "food-safety"
    },
    {
      "id": "agent-inventory",
      "name": "Inventory Optimization Agent",
      "mission": "Planning record: recommend FEFO picks and expiry-risk actions.",
      "permissions": "SUGGEST",
      "inputs": [
        "Stock",
        "Lots"
      ],
      "outputs": [
        "Transfer suggestions"
      ],
      "department": "warehouse"
    },
    {
      "id": "agent-procurement",
      "name": "Procurement Advisor Agent",
      "mission": "Planning record: propose PO timing based on MRP gaps.",
      "permissions": "SUGGEST",
      "inputs": [
        "MRP",
        "Lead times"
      ],
      "outputs": [
        "PO suggestions"
      ],
      "department": "procurement"
    },
    {
      "id": "agent-sales",
      "name": "Sales Allocation Agent",
      "mission": "Planning record: recommend allocations against ATP without committing stock.",
      "permissions": "SUGGEST",
      "inputs": [
        "Orders",
        "ATP"
      ],
      "outputs": [
        "Allocation draft"
      ],
      "department": "sales"
    },
    {
      "id": "agent-distribution",
      "name": "Distribution Planning Agent",
      "mission": "Planning record: propose load plans for dispatcher approval.",
      "permissions": "SUGGEST",
      "inputs": [
        "Allocated orders",
        "Fleet"
      ],
      "outputs": [
        "Load plan draft"
      ],
      "department": "distribution"
    },
    {
      "id": "agent-finance",
      "name": "Finance / Collections Agent",
      "mission": "Planning record: highlight AR risk for human action.",
      "permissions": "SUGGEST",
      "inputs": [
        "Invoices",
        "Aging"
      ],
      "outputs": [
        "Collection prioritization"
      ],
      "department": "finance"
    },
    {
      "id": "agent-complaint",
      "name": "Customer Complaint Analysis Agent",
      "mission": "Planning record: cluster complaints by lot/SKU and suggest investigation paths.",
      "permissions": "READ_ONLY",
      "inputs": [
        "Complaints",
        "Genealogy"
      ],
      "outputs": [
        "Cluster analysis"
      ],
      "department": "quality"
    }
  ],
  "mockSchema": {
    "entities": [
      {
        "id": "ent-product",
        "name": "Product",
        "description": "Finished or intermediate SKU.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "sku",
            "type": "STRING",
            "required": true
          },
          {
            "name": "name",
            "type": "STRING",
            "required": true
          },
          {
            "name": "productType",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "FG",
              "WIP",
              "RM",
              "PACKAGING"
            ]
          },
          {
            "name": "shelfLifeDays",
            "type": "NUMBER",
            "required": false
          }
        ]
      },
      {
        "id": "ent-bom",
        "name": "BillOfMaterials",
        "description": "BOM header.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "productId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-product"
          },
          {
            "name": "version",
            "type": "STRING",
            "required": true
          },
          {
            "name": "effectiveFrom",
            "type": "DATE",
            "required": true
          }
        ]
      },
      {
        "id": "ent-bom-line",
        "name": "BomLine",
        "description": "BOM component line.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "bomId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-bom"
          },
          {
            "name": "componentProductId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-product"
          },
          {
            "name": "quantity",
            "type": "NUMBER",
            "required": true
          },
          {
            "name": "uom",
            "type": "STRING",
            "required": true
          }
        ]
      },
      {
        "id": "ent-work-center",
        "name": "WorkCenter",
        "description": "Production line.",
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
            "name": "capacityPerHour",
            "type": "NUMBER",
            "required": true
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "AVAILABLE",
              "DOWN",
              "MAINTENANCE"
            ]
          }
        ]
      },
      {
        "id": "ent-production-order",
        "name": "ProductionOrder",
        "description": "Batch/production order.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "productId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-product"
          },
          {
            "name": "workCenterId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-work-center"
          },
          {
            "name": "plannedQty",
            "type": "NUMBER",
            "required": true
          },
          {
            "name": "actualQty",
            "type": "NUMBER",
            "required": false
          },
          {
            "name": "plannedStart",
            "type": "DATETIME",
            "required": true
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "PLANNED",
              "RELEASED",
              "IN_PROGRESS",
              "DONE",
              "CANCELLED"
            ]
          }
        ]
      },
      {
        "id": "ent-batch",
        "name": "Batch",
        "description": "Manufactured lot.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "batchCode",
            "type": "STRING",
            "required": true
          },
          {
            "name": "productionOrderId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-production-order"
          },
          {
            "name": "productId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-product"
          },
          {
            "name": "quantity",
            "type": "NUMBER",
            "required": true
          },
          {
            "name": "producedAt",
            "type": "DATETIME",
            "required": true
          },
          {
            "name": "expiryDate",
            "type": "DATE",
            "required": false
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "IN_PROCESS",
              "QUARANTINE",
              "RELEASED",
              "HOLD",
              "REJECTED"
            ]
          }
        ]
      },
      {
        "id": "ent-supplier",
        "name": "Supplier",
        "description": "Material supplier.",
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
            "name": "leadTimeDays",
            "type": "NUMBER",
            "required": true
          },
          {
            "name": "qualityScore",
            "type": "NUMBER",
            "required": false
          }
        ]
      },
      {
        "id": "ent-purchase-order",
        "name": "PurchaseOrder",
        "description": "Purchase order.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "supplierId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-supplier"
          },
          {
            "name": "orderedAt",
            "type": "DATE",
            "required": true
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "DRAFT",
              "SENT",
              "PARTIAL",
              "RECEIVED",
              "CLOSED"
            ]
          },
          {
            "name": "totalAmount",
            "type": "CURRENCY",
            "required": false
          }
        ]
      },
      {
        "id": "ent-goods-receipt",
        "name": "GoodsReceipt",
        "description": "Inbound receipt.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "purchaseOrderId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-purchase-order"
          },
          {
            "name": "receivedAt",
            "type": "DATETIME",
            "required": true
          },
          {
            "name": "lotCode",
            "type": "STRING",
            "required": true
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "QUARANTINE",
              "ACCEPTED",
              "REJECTED"
            ]
          }
        ]
      },
      {
        "id": "ent-qc-result",
        "name": "QcResult",
        "description": "QC inspection result.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "batchId",
            "type": "REFERENCE",
            "required": false,
            "referenceEntityId": "ent-batch"
          },
          {
            "name": "goodsReceiptId",
            "type": "REFERENCE",
            "required": false,
            "referenceEntityId": "ent-goods-receipt"
          },
          {
            "name": "stage",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "INCOMING",
              "IN_PROCESS",
              "FINISHED"
            ]
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
        "id": "ent-customer",
        "name": "Customer",
        "description": "Wholesale/retail customer.",
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
            "name": "paymentTermsDays",
            "type": "NUMBER",
            "required": true
          }
        ]
      },
      {
        "id": "ent-sales-order",
        "name": "SalesOrder",
        "description": "Customer sales order.",
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
            "name": "orderedAt",
            "type": "DATE",
            "required": true
          },
          {
            "name": "requestedShipDate",
            "type": "DATE",
            "required": true
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "OPEN",
              "ALLOCATED",
              "SHIPPED",
              "INVOICED",
              "CANCELLED"
            ]
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
            "name": "salesOrderId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-sales-order"
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
              "LOADED",
              "IN_TRANSIT",
              "DELIVERED"
            ]
          }
        ]
      },
      {
        "id": "ent-inventory-balance",
        "name": "InventoryBalance",
        "description": "On-hand by product/location.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "productId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-product"
          },
          {
            "name": "batchId",
            "type": "REFERENCE",
            "required": false,
            "referenceEntityId": "ent-batch"
          },
          {
            "name": "location",
            "type": "STRING",
            "required": true
          },
          {
            "name": "quantity",
            "type": "NUMBER",
            "required": true
          },
          {
            "name": "asOf",
            "type": "DATETIME",
            "required": true
          }
        ]
      },
      {
        "id": "ent-maintenance-wo",
        "name": "MaintenanceWorkOrder",
        "description": "Maintenance work order.",
        "fields": [
          {
            "name": "id",
            "type": "STRING",
            "required": true
          },
          {
            "name": "workCenterId",
            "type": "REFERENCE",
            "required": true,
            "referenceEntityId": "ent-work-center"
          },
          {
            "name": "type",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "PREVENTIVE",
              "CORRECTIVE"
            ]
          },
          {
            "name": "status",
            "type": "ENUM",
            "required": true,
            "enumValues": [
              "OPEN",
              "IN_PROGRESS",
              "DONE"
            ]
          },
          {
            "name": "dueAt",
            "type": "DATETIME",
            "required": false
          }
        ]
      },
      {
        "id": "ent-complaint",
        "name": "CustomerComplaint",
        "description": "Customer complaint.",
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
            "name": "batchId",
            "type": "REFERENCE",
            "required": false,
            "referenceEntityId": "ent-batch"
          },
          {
            "name": "openedAt",
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
              "INVESTIGATING",
              "CLOSED"
            ]
          }
        ]
      }
    ],
    "relationships": [
      {
        "fromEntityId": "ent-product",
        "toEntityId": "ent-bom",
        "type": "ONE_TO_MANY",
        "description": "Product has BOM versions."
      },
      {
        "fromEntityId": "ent-bom",
        "toEntityId": "ent-bom-line",
        "type": "ONE_TO_MANY",
        "description": "BOM has component lines."
      },
      {
        "fromEntityId": "ent-work-center",
        "toEntityId": "ent-production-order",
        "type": "ONE_TO_MANY",
        "description": "Work center runs production orders."
      },
      {
        "fromEntityId": "ent-production-order",
        "toEntityId": "ent-batch",
        "type": "ONE_TO_MANY",
        "description": "Production order yields batches."
      },
      {
        "fromEntityId": "ent-batch",
        "toEntityId": "ent-qc-result",
        "type": "ONE_TO_MANY",
        "description": "Batch has QC results."
      },
      {
        "fromEntityId": "ent-supplier",
        "toEntityId": "ent-purchase-order",
        "type": "ONE_TO_MANY",
        "description": "Supplier has POs."
      },
      {
        "fromEntityId": "ent-purchase-order",
        "toEntityId": "ent-goods-receipt",
        "type": "ONE_TO_MANY",
        "description": "PO has receipts."
      },
      {
        "fromEntityId": "ent-customer",
        "toEntityId": "ent-sales-order",
        "type": "ONE_TO_MANY",
        "description": "Customer has sales orders."
      },
      {
        "fromEntityId": "ent-sales-order",
        "toEntityId": "ent-shipment",
        "type": "ONE_TO_MANY",
        "description": "Sales order has shipments."
      },
      {
        "fromEntityId": "ent-product",
        "toEntityId": "ent-inventory-balance",
        "type": "ONE_TO_MANY",
        "description": "Product has inventory balances."
      },
      {
        "fromEntityId": "ent-work-center",
        "toEntityId": "ent-maintenance-wo",
        "type": "ONE_TO_MANY",
        "description": "Work center has maintenance WOs."
      },
      {
        "fromEntityId": "ent-customer",
        "toEntityId": "ent-complaint",
        "type": "ONE_TO_MANY",
        "description": "Customer has complaints."
      }
    ]
  },
  "terminology": {
    "OEE": [
      "Overall Equipment Effectiveness",
      "اثربخشی کلی تجهیزات"
    ],
    "Batch": [
      "Lot",
      "بچ",
      "سری ساخت"
    ],
    "FEFO": [
      "First Expire First Out",
      "اول انقضا اول خروج"
    ],
    "HACCP": [
      "Hazard Analysis Critical Control Points"
    ],
    "MRP": [
      "Material Requirements Planning",
      "برنامه‌ریزی نیازمندی مواد"
    ],
    "NCR": [
      "Nonconformance Report",
      "گزارش عدم انطباق"
    ],
    "CAPA": [
      "Corrective and Preventive Action"
    ],
    "ATP": [
      "Available to Promise"
    ],
    "Semolina": [
      "Semolina flour",
      "سمانولینا"
    ],
    "Changeover": [
      "SKU changeover",
      "تعویض محصول"
    ]
  },
  "risks": [
    "Food-safety noncompliance can force holds, recalls, or regulatory action.",
    "Unplanned downtime cascades into missed plan attainment and stockouts.",
    "Expiry-risk inventory erodes margin and increases waste.",
    "Supplier delays on flour/semolina or packaging halt lines.",
    "AI agents are planning records only; humans must approve quality and release decisions."
  ],
  "recommendedIntegrations": [
    {
      "name": "ERP / MES",
      "category": "core",
      "purpose": "Orders, BOM, production confirmation, inventory."
    },
    {
      "name": "WMS",
      "category": "warehouse",
      "purpose": "Lot tracking, FEFO picks, transfers."
    },
    {
      "name": "QMS / LIMS",
      "category": "quality",
      "purpose": "QC results, NCR/CAPA, batch release."
    },
    {
      "name": "CMMS",
      "category": "maintenance",
      "purpose": "PM schedules and downtime work orders."
    },
    {
      "name": "TMS / logistics",
      "category": "distribution",
      "purpose": "Load planning and POD capture."
    },
    {
      "name": "Accounting / AR",
      "category": "finance",
      "purpose": "Invoicing, aging, and collections."
    }
  ]
} satisfies IndustryPack;
