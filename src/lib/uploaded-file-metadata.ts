type UploadedFileMetadataShape = Record<string, unknown> & {
  contributorAttribution?: ContributorUploadAttribution;
};

export type ContributorUploadAttribution = {
  source: "collaborator_invite";
  inviteId: string;
  inviteName?: string | null;
  siblingIndex?: number;
  siblingName?: string;
  taskId?: string;
  taskTitle?: string;
  workspace?: string;
  uploadedAt?: string;
};

export function parseUploadedFileMetadata(
  metadata: string | null | undefined
): UploadedFileMetadataShape {
  if (!metadata) {
    return {};
  }

  try {
    const parsed = JSON.parse(metadata);
    return parsed && typeof parsed === "object"
      ? (parsed as UploadedFileMetadataShape)
      : {};
  } catch {
    return {};
  }
}

export function getContributorUploadAttribution(
  metadata: string | null | undefined
): ContributorUploadAttribution | null {
  const parsed = parseUploadedFileMetadata(metadata);
  const attribution = parsed.contributorAttribution;

  if (!attribution || attribution.source !== "collaborator_invite") {
    return null;
  }

  return attribution;
}
