import { ActorMeta, ReportState } from './store';
import { Event } from './query';

function lookupActor(
  report: ReportState,
  id: number | undefined,
): ActorMeta | undefined {
  const friendly = report.friendlies.find(({ id: lid }) => id === lid);
  if (friendly) {
    return friendly;
  }
  return report.enemies.find(({ id: lid }) => id === lid);
}

function lookupActorName(
  report: ReportState,
  id: number | undefined,
  default_value: string
): string {
  const actor = lookupActor(report, id);
  if (actor === undefined) {
    return default_value;
  } else {
    return actor.name;
  }
}

export function actorNameTransform<T extends Event>(event: T, report: ReportState): T & { sourceName: string, targetName: string } {
  return {
    ...event,
    sourceName: lookupActorName(report, event.sourceID, "Unknown"),
    targetName: lookupActorName(report, event.targetID, "Unknown")
  }
}

export function encounterNameTransform<T extends Event>(event: T, report: ReportState): T & { encounterName: string } {
  return {
    ...event,
    encounterName: report.fights.find(({ id }) => id === event.fight)!.name,
  }
}
