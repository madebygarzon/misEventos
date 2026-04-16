import { api } from "./client";
import type {
  SessionSpeakerAssignPayload,
  SessionSpeakerItem,
  SpeakerCreatePayload,
  SpeakerItem
} from "../types/speaker";

export const listSpeakersRequest = async (activeOnly = false): Promise<SpeakerItem[]> => {
  const { data } = await api.get<SpeakerItem[]>("/speakers", {
    params: { active_only: activeOnly }
  });
  return data;
};

export const createSpeakerRequest = async (payload: SpeakerCreatePayload): Promise<SpeakerItem> => {
  const { data } = await api.post<SpeakerItem>("/speakers", payload);
  return data;
};

export const listSessionSpeakersRequest = async (sessionId: string): Promise<SessionSpeakerItem[]> => {
  const { data } = await api.get<SessionSpeakerItem[]>(`/sessions/${sessionId}/speakers`);
  return data;
};

export const assignSpeakerToSessionRequest = async (
  sessionId: string,
  speakerId: string,
  payload: SessionSpeakerAssignPayload
): Promise<SessionSpeakerItem> => {
  const { data } = await api.post<SessionSpeakerItem>(`/sessions/${sessionId}/speakers/${speakerId}`, payload);
  return data;
};

export const removeSpeakerFromSessionRequest = async (sessionId: string, speakerId: string): Promise<void> => {
  await api.delete(`/sessions/${sessionId}/speakers/${speakerId}`);
};
