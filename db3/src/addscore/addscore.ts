import * as LZString from "lz-string";
import * as Firebase from "firebase-admin";
import * as fbc from "fbc";
import { createStringValidator, createNumberValidator, createValidator, createJsonAsTextHandler } from "slambda";

// Input validation
// Note: If this gets obscured, this logic will probably need to change
const maxScore = 999999;
const base64Pattern = /^[A-Za-z0-9+/=]*$/;

interface Score {
    mode: number;
    seed: string;
    host: string;
    initials: string;
    score: number;
    replay: string;
}

const validateScore = createValidator<Score>({
    mode: createNumberValidator(1, 3),
    seed: createStringValidator(/^[0-9a-f]{32}$/),
    host: createStringValidator(/^[a-z]{15}$/),
    initials: createStringValidator(/^[a-z]{3}$/),
    score: createNumberValidator(0, maxScore), 

    replay: (x: any): string => {
        if (typeof(x) === "string" && base64Pattern.test(x) && LZString.decompressFromBase64(x).length >= 6) {
            return x;
        } else {
            throw new Error("Invalid replay");
        }
    },
});

// Database integration
const root = Firebase
    .initializeApp({ credential: Firebase.credential.cert(fbc as Firebase.ServiceAccount) }, "addscore")
    .firestore()
    .collection("fbg-scores");

interface ScoreDocument {
    // Document name is the seed
    mode: number;
    host: string;
    initials: string;
    score: number;
    timestamp: Firebase.firestore.Timestamp;
    replay: Buffer;
}

function scoreDocumentFromScore(record: Score): ScoreDocument {
    const { mode, host, initials, score } = record;
    return {
        mode,
        host,
        initials,
        score,
        timestamp: Firebase.firestore.Timestamp.now(),
        replay: Buffer.from(record.replay),
    }
}

export const handler = createJsonAsTextHandler<Score, object>(validateScore, async (score) => {
    await root.doc(score.seed).set(scoreDocumentFromScore(score));
    return {};
});
