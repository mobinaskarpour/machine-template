import runtimeJson from "@/data/blueprint-runtime.json";
import mockJson from "@/data/mock-data.json";

export type RuntimeBlueprint = typeof runtimeJson;
export type MockBundle = typeof mockJson;

export const runtime = runtimeJson as RuntimeBlueprint;
export const mockData = mockJson as MockBundle;
