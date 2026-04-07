type AnyRecord = Record<string, any>;

export function applyDealTabAllFilters(prev: AnyRecord): AnyRecord {
  const next = { ...prev };
  delete next.stage_id;
  delete next.approval_status;
  delete next.include_archived;
  delete next.include_lost;
  return next;
}

export function applyDealTabLostFilters(prev: AnyRecord): AnyRecord {
  const next = { ...prev };
  delete next.stage_id;
  delete next.include_archived;
  next.include_lost = true;
  return next;
}

export function applyDealTabDeletedFilters(prev: AnyRecord): AnyRecord {
  const next = { ...prev };
  delete next.stage_id;
  delete next.include_lost;
  next.include_archived = true;
  return next;
}

export function applyDealTabRejectedFilters(prev: AnyRecord): AnyRecord {
  const next = { ...prev };
  delete next.stage_id;
  delete next.include_lost;
  delete next.include_archived;
  next.approval_status = "rejected";
  return next;
}

export function applyDealTabStageFilters(prev: AnyRecord, stageId: string): AnyRecord {
  const next = { ...prev };
  delete next.include_archived;
  delete next.include_lost;
  next.stage_id = stageId;
  return next;
}
