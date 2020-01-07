// Top scores
export const TopScoresRoute = "/scores/:mode"; // GET
export interface TopScoresRequestParameters {
    mode: number;
}

export interface TopScoresRequestQuery {
    includeSeeds: boolean | undefined;
}

export interface TopScore {
    initials: string;
    score: number;
    seed?: string;
}

export type TopScoresResponseBody = TopScore[];

// Get a specific score
export const GetScoreRoute = "/scores/:mode/:seed"; // GET
export interface GetScoreRequestParameters {
    mode: number;
    seed: string;
}

export interface GetScoreResponseBody {
    mode: number;
    seed: string;
    host: string;
    initials: string;
    score: number;
    timestamp: string;
    replay: string;
}

// Add score
export const AddScoreRoute = "/scores/:mode/:seed"; // POST
export interface AddScoreRequestParameters {
    mode: number;
    seed: string;
}

export interface AddScoreRequestBody {
    host: string;
    initials: string;
    score: number;
    replay: string;
}

export type AddScoreResponse = void;

// TODO: Get replay (by seed or other stuff?)
