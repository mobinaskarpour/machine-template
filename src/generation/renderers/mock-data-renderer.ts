import type { CompanyOSBlueprint } from "../../blueprints/company-os-blueprint-schema.js";
import { AppError } from "../../shared/errors.js";
import { nowIso } from "../../shared/ids.js";
import { createSeededRandom } from "../generation-types.js";

export type MockRecord = Record<string, unknown> & { id: string };

export type MockDataBundle = {
  schemaVersion: "1.0";
  seed: string;
  generatedAt: string;
  totals: Record<string, number>;
  chartSeries: Array<{ name: string; value: number }>;
  records: Record<string, MockRecord[]>;
  meta: {
    currencyAssumption: string;
    calendarAssumption: string;
    mockDataVersion: "1.0";
  };
};

const FA_FIRST = [
  "آیدا",
  "نیما",
  "سارا",
  "کامران",
  "لیلا",
  "پویا",
  "نازنین",
  "رضا",
  "مینا",
  "بهراد",
];
const FA_LAST = [
  "نوروزی",
  "کاویانی",
  "رادمان",
  "شایگان",
  "بهشتی",
  "سامانی",
  "آذرخش",
  "پارسامهر",
  "کیانی",
  "دادگر",
];
const EN_FIRST = [
  "Aria",
  "Noah",
  "Lila",
  "Omar",
  "Maya",
  "Evan",
  "Nora",
  "Sam",
  "Iris",
  "Leo",
];
const EN_LAST = [
  "Carter",
  "Nguyen",
  "Patel",
  "Brooks",
  "Hassan",
  "Ortiz",
  "Keller",
  "Singh",
  "Diaz",
  "Walsh",
];
const PRODUCT_STEMS = [
  "Aurora",
  "Cedar",
  "Delta",
  "Echo",
  "Falcon",
  "Glacier",
  "Harbor",
  "Ivory",
  "Juniper",
  "Kepler",
];
const COMPANY_STEMS = [
  "Northwind Trading Co",
  "Blue Harbor Supplies",
  "Summit Ridge Partners",
  "Cascade Valley Goods",
  "Silverline Commerce",
  "Pinecrest Distributors",
  "Amber Field Industrials",
  "Riverstone Wholesale",
];

function capVolume(targetCount: number): number {
  if (targetCount <= 0) return 0;
  return Math.max(5, Math.min(targetCount, 40));
}

function pick<T>(rand: () => number, items: readonly T[]): T {
  return items[Math.floor(rand() * items.length) % items.length]!;
}

function pad(n: number, width = 4): string {
  return String(n).padStart(width, "0");
}

function classifyEntity(id: string, name: string): string {
  const key = `${id} ${name}`.toLowerCase().replace(/[_-]+/g, " ");
  const compact = key.replace(/\s+/g, "");
  if (/customer|client/.test(compact)) return "customer";
  if (/salesorderitem|orderitem|lineitem/.test(compact)) return "sales_order_item";
  if (/salesorder/.test(compact)) return "sales_order";
  if (/purchaseorder|\bpo\b/.test(key) || /purchaseorder/.test(compact)) return "purchase_order";
  if (/supplier|vendor/.test(compact)) return "supplier";
  if (/warehouse/.test(compact)) return "warehouse";
  if (/inventory/.test(compact)) return "inventory";
  if (/productionorder/.test(compact)) return "production_order";
  if (/batch/.test(compact)) return "batch";
  if (/\bqc\b|quality|qcresult/.test(key) || /qcresult/.test(compact)) return "qc";
  if (/downtime/.test(compact)) return "downtime";
  if (/maintenance/.test(compact)) return "maintenance";
  if (/machine|equipment|workcenter/.test(compact)) return "machine";
  if (/product|sku/.test(compact) && !/category/.test(compact)) return "product";
  if (/shipment/.test(compact)) return "shipment";
  if (/complaint/.test(compact)) return "complaint";
  return "generic";
}

function dateInRange(rand: () => number, startIso: string, endIso: string): string {
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return new Date(Date.UTC(2025, 0, 1 + Math.floor(rand() * 28))).toISOString().slice(0, 10);
  }
  const t = start + Math.floor(rand() * (end - start + 1));
  return new Date(t).toISOString().slice(0, 10);
}

function personName(rand: () => number, locale: string): string {
  const persian = /^fa/i.test(locale);
  if (persian) return `${pick(rand, FA_FIRST)} ${pick(rand, FA_LAST)}`;
  return `${pick(rand, EN_FIRST)} ${pick(rand, EN_LAST)}`;
}

function idsFor(entityId: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${entityId}-${pad(i + 1)}`);
}

/**
 * Validate foreign-key style references across the mock bundle.
 * Throws AppError when orphan references are found.
 */
export function validateInternalReferences(bundle: MockDataBundle): void {
  const byEntity = bundle.records;
  const idSets = new Map<string, Set<string>>();
  for (const [entityId, rows] of Object.entries(byEntity)) {
    idSets.set(entityId, new Set(rows.map((r) => String(r.id))));
  }

  const refChecks: Array<{ from: string; field: string; toCandidates: string[] }> = [
    { from: "sales_order", field: "customerId", toCandidates: entityIdsMatching(byEntity, "customer") },
    { from: "sales_order_item", field: "salesOrderId", toCandidates: entityIdsMatching(byEntity, "sales_order") },
    { from: "sales_order_item", field: "productId", toCandidates: entityIdsMatching(byEntity, "product") },
    { from: "purchase_order", field: "supplierId", toCandidates: entityIdsMatching(byEntity, "supplier") },
    { from: "inventory", field: "warehouseId", toCandidates: entityIdsMatching(byEntity, "warehouse") },
    { from: "inventory", field: "productId", toCandidates: entityIdsMatching(byEntity, "product") },
    { from: "batch", field: "productionOrderId", toCandidates: entityIdsMatching(byEntity, "production_order") },
    { from: "qc", field: "batchId", toCandidates: entityIdsMatching(byEntity, "batch") },
    { from: "downtime", field: "machineId", toCandidates: entityIdsMatching(byEntity, "machine") },
    { from: "maintenance", field: "machineId", toCandidates: entityIdsMatching(byEntity, "machine") },
    { from: "shipment", field: "salesOrderId", toCandidates: entityIdsMatching(byEntity, "sales_order") },
    { from: "complaint", field: "customerId", toCandidates: entityIdsMatching(byEntity, "customer") },
  ];

  for (const check of refChecks) {
    const fromEntities = entityIdsMatching(byEntity, check.from);
    for (const fromEntityId of fromEntities) {
      const rows = byEntity[fromEntityId] ?? [];
      for (const row of rows) {
        const ref = row[check.field];
        if (ref === undefined || ref === null || ref === "") continue;
        const refStr = String(ref);
        let ok = false;
        for (const toEntityId of check.toCandidates) {
          if (idSets.get(toEntityId)?.has(refStr)) {
            ok = true;
            break;
          }
        }
        if (!ok && check.toCandidates.length > 0) {
          throw new AppError(
            "GENERATION_VALIDATION_FAILED",
            `Orphan mock reference ${check.field}=${refStr} on ${fromEntityId}`,
            { details: { fromEntityId, field: check.field, ref: refStr } },
          );
        }
      }
    }
  }
}

function entityIdsMatching(
  records: Record<string, MockRecord[]>,
  kind: string,
): string[] {
  return Object.keys(records).filter((id) => classifyEntity(id, id) === kind);
}

function findEntityId(
  entities: CompanyOSBlueprint["dataModel"]["entities"],
  kind: string,
): string | undefined {
  return entities.find((e) => classifyEntity(e.id, e.name) === kind)?.id;
}

export function generateMockDataBundle(
  blueprint: CompanyOSBlueprint,
  seed: string,
): MockDataBundle {
  const rand = createSeededRandom(seed);
  const locale = blueprint.mockDataPlan.locale || blueprint.company.language;
  const start = blueprint.mockDataPlan.timeRange.start;
  const end = blueprint.mockDataPlan.timeRange.end;
  const currency =
    blueprint.mockDataPlan.currency ?? blueprint.company.currency ?? "IRR";

  const volumeById = new Map<string, number>();
  for (const v of blueprint.mockDataPlan.entityVolumes) {
    volumeById.set(v.entityId, capVolume(v.targetCount));
  }
  for (const entity of blueprint.dataModel.entities) {
    if (!volumeById.has(entity.id)) {
      volumeById.set(entity.id, capVolume(8));
    }
  }

  const entities = blueprint.dataModel.entities;
  const records: Record<string, MockRecord[]> = {};

  const customerId = findEntityId(entities, "customer");
  const productId = findEntityId(entities, "product");
  const supplierId = findEntityId(entities, "supplier");
  const warehouseId = findEntityId(entities, "warehouse");
  const salesOrderId = findEntityId(entities, "sales_order");
  const salesOrderItemId = findEntityId(entities, "sales_order_item");
  const purchaseOrderId = findEntityId(entities, "purchase_order");
  const inventoryId = findEntityId(entities, "inventory");
  const productionOrderId = findEntityId(entities, "production_order");
  const batchId = findEntityId(entities, "batch");
  const qcId = findEntityId(entities, "qc");
  const machineId = findEntityId(entities, "machine");
  const downtimeId = findEntityId(entities, "downtime");
  const maintenanceId = findEntityId(entities, "maintenance");
  const shipmentId = findEntityId(entities, "shipment");
  const complaintId = findEntityId(entities, "complaint");

  // Base entities first
  if (customerId) {
    const n = volumeById.get(customerId) ?? 5;
    records[customerId] = idsFor(customerId, n).map((id, i) => ({
      id,
      name: personName(rand, locale),
      code: `CUS-${pad(i + 1, 3)}`,
      status: pick(rand, ["ACTIVE", "ACTIVE", "PENDING"]),
      createdAt: dateInRange(rand, start, end),
    }));
  }

  if (productId) {
    const n = volumeById.get(productId) ?? 5;
    records[productId] = idsFor(productId, n).map((id, i) => ({
      id,
      name: `${pick(rand, PRODUCT_STEMS)} ${pad(i + 1, 2)}`,
      sku: `SKU-${pad(i + 1, 3)}`,
      unitPrice: Math.round(10_000 + rand() * 90_000),
      status: "ACTIVE",
      createdAt: dateInRange(rand, start, end),
    }));
  }

  if (supplierId) {
    const n = volumeById.get(supplierId) ?? 5;
    records[supplierId] = idsFor(supplierId, n).map((id, i) => ({
      id,
      name: pick(rand, COMPANY_STEMS),
      code: `SUP-${pad(i + 1, 3)}`,
      status: "ACTIVE",
      createdAt: dateInRange(rand, start, end),
    }));
  }

  if (warehouseId) {
    const n = volumeById.get(warehouseId) ?? 5;
    records[warehouseId] = idsFor(warehouseId, n).map((id, i) => ({
      id,
      name: `Warehouse ${pad(i + 1, 2)}`,
      code: `WH-${pad(i + 1, 2)}`,
      status: "ACTIVE",
      createdAt: dateInRange(rand, start, end),
    }));
  }

  if (machineId) {
    const n = volumeById.get(machineId) ?? 5;
    records[machineId] = idsFor(machineId, n).map((id, i) => ({
      id,
      name: `Line ${pad(i + 1, 2)}`,
      code: `MC-${pad(i + 1, 2)}`,
      status: pick(rand, ["RUNNING", "IDLE", "MAINTENANCE"]),
      createdAt: dateInRange(rand, start, end),
    }));
  }

  const customers = customerId ? records[customerId] ?? [] : [];
  const products = productId ? records[productId] ?? [] : [];
  const suppliers = supplierId ? records[supplierId] ?? [] : [];
  const warehouses = warehouseId ? records[warehouseId] ?? [] : [];
  const machines = machineId ? records[machineId] ?? [] : [];

  if (salesOrderId) {
    const n = volumeById.get(salesOrderId) ?? 5;
    records[salesOrderId] = idsFor(salesOrderId, n).map((id, i) => ({
      id,
      name: `SO-${pad(i + 1, 4)}`,
      customerId: customers.length ? pick(rand, customers).id : null,
      totalAmount: Math.round(50_000 + rand() * 500_000),
      quantity: Math.max(1, Math.floor(1 + rand() * 40)),
      status: pick(rand, ["OPEN", "CONFIRMED", "FULFILLED", "CANCELLED"]),
      createdAt: dateInRange(rand, start, end),
    }));
  }

  const salesOrders = salesOrderId ? records[salesOrderId] ?? [] : [];

  if (salesOrderItemId) {
    const n = volumeById.get(salesOrderItemId) ?? Math.min(40, Math.max(5, salesOrders.length * 2));
    records[salesOrderItemId] = idsFor(salesOrderItemId, n).map((id, i) => {
      const order = salesOrders.length ? salesOrders[i % salesOrders.length]! : null;
      const product = products.length ? pick(rand, products) : null;
      const qty = Math.max(1, Math.floor(1 + rand() * 20));
      return {
        id,
        name: `Line ${pad(i + 1, 3)}`,
        salesOrderId: order?.id ?? null,
        productId: product?.id ?? null,
        quantity: qty,
        unitPrice: product && typeof product.unitPrice === "number" ? product.unitPrice : 1000,
        amount: qty * (product && typeof product.unitPrice === "number" ? product.unitPrice : 1000),
        status: "ACTIVE",
        createdAt: dateInRange(rand, start, end),
      };
    });
  }

  if (purchaseOrderId) {
    const n = volumeById.get(purchaseOrderId) ?? 5;
    records[purchaseOrderId] = idsFor(purchaseOrderId, n).map((id, i) => ({
      id,
      name: `PO-${pad(i + 1, 4)}`,
      supplierId: suppliers.length ? pick(rand, suppliers).id : null,
      totalAmount: Math.round(20_000 + rand() * 300_000),
      quantity: Math.max(1, Math.floor(1 + rand() * 50)),
      status: pick(rand, ["DRAFT", "ORDERED", "RECEIVED"]),
      createdAt: dateInRange(rand, start, end),
    }));
  }

  if (inventoryId) {
    const n = volumeById.get(inventoryId) ?? 5;
    records[inventoryId] = idsFor(inventoryId, n).map((id, i) => ({
      id,
      name: `INV-${pad(i + 1, 3)}`,
      warehouseId: warehouses.length ? pick(rand, warehouses).id : null,
      productId: products.length ? pick(rand, products).id : null,
      quantity: Math.max(0, Math.floor(rand() * 500)),
      status: "AVAILABLE",
      createdAt: dateInRange(rand, start, end),
    }));
  }

  if (productionOrderId) {
    const n = volumeById.get(productionOrderId) ?? 5;
    records[productionOrderId] = idsFor(productionOrderId, n).map((id, i) => ({
      id,
      name: `MO-${pad(i + 1, 4)}`,
      productId: products.length ? pick(rand, products).id : null,
      quantity: Math.max(1, Math.floor(10 + rand() * 200)),
      status: pick(rand, ["PLANNED", "IN_PROGRESS", "DONE"]),
      createdAt: dateInRange(rand, start, end),
    }));
  }

  const productionOrders = productionOrderId ? records[productionOrderId] ?? [] : [];

  if (batchId) {
    const n = volumeById.get(batchId) ?? 5;
    records[batchId] = idsFor(batchId, n).map((id, i) => ({
      id,
      name: `BATCH-${pad(i + 1, 4)}`,
      productionOrderId: productionOrders.length
        ? productionOrders[i % productionOrders.length]!.id
        : null,
      quantity: Math.max(1, Math.floor(5 + rand() * 100)),
      status: pick(rand, ["OPEN", "CLOSED", "QUARANTINE"]),
      createdAt: dateInRange(rand, start, end),
    }));
  }

  const batches = batchId ? records[batchId] ?? [] : [];

  if (qcId) {
    const n = volumeById.get(qcId) ?? 5;
    records[qcId] = idsFor(qcId, n).map((id, i) => ({
      id,
      name: `QC-${pad(i + 1, 4)}`,
      batchId: batches.length ? batches[i % batches.length]!.id : null,
      quantity: Math.max(0, Math.floor(rand() * 20)),
      status: pick(rand, ["PASS", "FAIL", "RETEST"]),
      createdAt: dateInRange(rand, start, end),
    }));
  }

  if (downtimeId) {
    const n = volumeById.get(downtimeId) ?? 5;
    records[downtimeId] = idsFor(downtimeId, n).map((id, i) => ({
      id,
      name: `DT-${pad(i + 1, 3)}`,
      machineId: machines.length ? pick(rand, machines).id : null,
      minutes: Math.max(0, Math.floor(rand() * 240)),
      status: "RECORDED",
      createdAt: dateInRange(rand, start, end),
    }));
  }

  if (maintenanceId) {
    const n = volumeById.get(maintenanceId) ?? 5;
    records[maintenanceId] = idsFor(maintenanceId, n).map((id, i) => ({
      id,
      name: `WO-${pad(i + 1, 3)}`,
      machineId: machines.length ? pick(rand, machines).id : null,
      status: pick(rand, ["OPEN", "IN_PROGRESS", "CLOSED"]),
      createdAt: dateInRange(rand, start, end),
    }));
  }

  if (shipmentId) {
    const n = volumeById.get(shipmentId) ?? 5;
    records[shipmentId] = idsFor(shipmentId, n).map((id, i) => ({
      id,
      name: `SH-${pad(i + 1, 4)}`,
      salesOrderId: salesOrders.length ? pick(rand, salesOrders).id : null,
      status: pick(rand, ["PENDING", "SHIPPED", "DELIVERED"]),
      createdAt: dateInRange(rand, start, end),
    }));
  }

  if (complaintId) {
    const n = volumeById.get(complaintId) ?? 5;
    records[complaintId] = idsFor(complaintId, n).map((id, i) => ({
      id,
      name: `CMP-${pad(i + 1, 3)}`,
      customerId: customers.length ? pick(rand, customers).id : null,
      status: pick(rand, ["OPEN", "RESOLVED"]),
      createdAt: dateInRange(rand, start, end),
    }));
  }

  // Remaining entities not covered by relational generators
  for (const entity of entities) {
    if (records[entity.id]) continue;
    const kind = classifyEntity(entity.id, entity.name);
    const n = volumeById.get(entity.id) ?? 5;
    records[entity.id] = idsFor(entity.id, n).map((id, i) => ({
      id,
      name: `${entity.name} ${pad(i + 1, 3)}`,
      status: "ACTIVE",
      quantity: kind === "generic" ? Math.max(0, Math.floor(rand() * 100)) : undefined,
      createdAt: dateInRange(rand, start, end),
    }));
  }

  const totals: Record<string, number> = {};
  for (const dash of blueprint.dashboards) {
    for (const widget of dash.widgets) {
      for (const kpiId of widget.kpiIds) {
        if (totals[kpiId] !== undefined) continue;
        const entityIds = widget.dataEntityIds.length
          ? widget.dataEntityIds
          : Object.keys(records);
        let aggregate = 0;
        for (const eid of entityIds) {
          const rows = records[eid] ?? [];
          for (const row of rows) {
            if (typeof row.totalAmount === "number") aggregate += row.totalAmount;
            else if (typeof row.quantity === "number") aggregate += row.quantity;
            else if (typeof row.amount === "number") aggregate += row.amount;
            else if (typeof row.minutes === "number") aggregate += row.minutes;
            else aggregate += 1;
          }
        }
        if (aggregate === 0) {
          aggregate = Math.round(10 + rand() * 990);
        }
        totals[kpiId] = Math.round(aggregate);
      }
    }
  }

  const chartSeries = Array.from({ length: 8 }, (_, i) => ({
    name: `W${i + 1}`,
    value: Math.round(30 + rand() * 70),
  }));

  const bundle: MockDataBundle = {
    schemaVersion: "1.0",
    seed,
    generatedAt: nowIso(),
    totals,
    chartSeries,
    records,
    meta: {
      currencyAssumption: `Demo currency formatting uses ${currency} labels unless confirmed`,
      calendarAssumption: "Demo dates use ISO Gregorian display unless confirmed",
      mockDataVersion: "1.0",
    },
  };

  validateInternalReferences(bundle);
  return bundle;
}
