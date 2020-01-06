// Top scores
export const TopScoresRoute = "/scores/:mode"; // GET
export interface TopScoresRequestParameters {
    mode: number;
}
// TODO: Consider optional flag to retrieve seeds...

export interface TopScore {
    initials: string;
    score: number;
}

export type TopScoresResponseBody = TopScore[];

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
