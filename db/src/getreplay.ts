import * as LZString from "lz-string";
import * as Firebase from "firebase-admin";
import * as Slambda from "slambda";
import * as sharedData from "shared-data";
import * as fbc from "fbc";

const { createStringValidator, createNumberValidator } = Slambda;

// Input validation
// Note: If this gets obscured, this logic will probably need to change
// TODO: Move into shared code lib
const maxScore = 999999;

interface GetReplayRequest {
    mode: number;
    initials: string;
    score: number;
}

interface GetReplayResponse {
    replay: string;
}

const validateScore = Slambda.createValidator<GetReplayRequest>({
    mode: createNumberValidator(1, 3),
    initials: createStringValidator(/^[a-z]{3}$/),
    score: createNumberValidator(0, maxScore),
});

// Database integration
const root = Firebase
    .initializeApp({ credential: Firebase.credential.cert(fbc as Firebase.ServiceAccount) }, "getreplay")
    .firestore()
    .collection(sharedData.collection);

// TODO: Share?
interface ScoreDocument {
    // Document name is the seed
    mode: number;
    host: string;
    initials: string;
    score: number;
    timestamp: Firebase.firestore.Timestamp;
    replay: Buffer;
}

export const handler = Slambda.createHandler<GetReplayRequest, GetReplayResponse>({
    method: "GET",
    parse: Slambda.parseQueryString,
    createHeaders: Slambda.createCorsWildcardHeaders,

    validate: Slambda.createValidator<GetReplayRequest>({
        mode: createNumberValidator(1, 3),
        initials: createStringValidator(/^[a-z]{3}$/),
        score: createNumberValidator(0, maxScore),
    }),

    handle: async (request) => {
        const docs = (await root
            .where("mode", "==", request.mode)
            .where("score", "==", request.score)
            .where("initials", "==", request.initials)
            .select("replay")
            .get()).docs;

        if (docs.length <= 0) {
            // TODO: Throw a specific error to result in a 404
            throw new Error("Not found");
        }

        const replay = docs[0].get("replay").toString("base64");
        return { replay };
    },
});

