/** How the project targets a Dataverse solution. */
export type SolutionMode = 'new' | 'existing';

/** A solution record as returned by getSolutions(). */
export interface SolutionSummary {
  solutionid: string;
  uniquename: string;
  friendlyname: string;
  version: string;
  ismanaged: boolean;
}

/** A publisher record as returned from the publishers entity set. */
export interface PublisherSummary {
  publisherid: string;
  friendlyname: string;
  uniquename: string;
  customizationprefix: string;
}

/** Draft of a brand-new solution to create. */
export interface NewSolutionDraft {
  friendlyName: string;
  uniqueName: string;
  version: string;
  /** When set, an existing publisher is reused. */
  existingPublisherId?: string;
  /** Customization prefix of the reused existing publisher. */
  existingPublisherPrefix?: string;
  /** When creating a new publisher. */
  newPublisher?: {
    friendlyName: string;
    uniqueName: string;
    prefix: string;
  };
}

/** The solution target for the whole project. */
export interface SolutionTarget {
  mode: SolutionMode;
  /** Set when mode === 'existing'. */
  existing?: SolutionSummary & { prefix: string };
  /** Set when mode === 'new'. */
  draft?: NewSolutionDraft;
}
