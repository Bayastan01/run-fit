import { api, unwrap } from "./client";

export interface GuildListItem {
  id: string;
  name: string;
  tag: string;
  level: number;
  treasury: number;
  memberCount: number;
  factionColor: string;
  factionName: string;
  isMine: boolean;
}

export interface GuildDetail {
  id: string;
  name: string;
  tag: string;
  level: number;
  treasury: number;
  ownerId: string;
  faction: { id: string; name: string; color: string };
  members: { id: string; displayName: string; level: number; xp: number; avatarUrl: string | null }[];
  segmentsOwned: number;
  isMine: boolean;
}

export async function listGuilds(): Promise<GuildListItem[]> {
  return (await unwrap<{ items: GuildListItem[] }>(api.get("api/guilds"))).items;
}

export async function fetchGuild(id: string): Promise<GuildDetail> {
  return (await unwrap<{ guild: GuildDetail }>(api.get(`api/guilds/${id}`))).guild;
}

export async function createGuild(name: string, tag: string): Promise<GuildListItem> {
  return (await unwrap<{ guild: GuildListItem }>(
    api.post("api/guilds", { json: { name, tag } }),
  )).guild;
}

export async function joinGuild(id: string): Promise<void> {
  await unwrap(api.post(`api/guilds/${id}/join`));
}

export async function leaveGuild(id: string): Promise<void> {
  await unwrap(api.delete(`api/guilds/${id}`));
}
