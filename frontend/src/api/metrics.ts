import { api } from "./client";
import type { MetricsSummaryResponse } from "../types/metrics";

export const getMetricsSummaryRequest = async (params?: {
  start_date?: string;
  end_date?: string;
  event_status?: string;
  organizer_id?: string;
}): Promise<MetricsSummaryResponse> => {
  const { data } = await api.get<MetricsSummaryResponse>("/metrics/summary", { params });
  return data;
};
