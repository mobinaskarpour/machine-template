import { company, navigation } from "@/lib/demo/config";

export const APP_NAME = company.productName;

export const pageLabels = {
  ...navigation.pageLabels,
  brand: company.productName,
} as const;

export const uiLabels = navigation.uiLabels;

/** Six-item rail — Overview · AI · Evidence · Dashboards · Workflows · Connections */
export const railItems = navigation.railItems.map((item) => ({
  id: item.id,
  label:
    navigation.pageLabels[item.labelKey as keyof typeof navigation.pageLabels],
  href: item.href,
  icon: item.icon,
})) as ReadonlyArray<{
  id: string;
  label: string;
  href: string;
  icon: string;
}>;
