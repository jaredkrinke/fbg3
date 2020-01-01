import * as Firebase from "firebase-admin";
import * as Slambda from "slambda";
import * as sharedData from "shared-data";
import * as fbc from "fbc";

// Input validation
interface TopScoresRequest {
    mode: number;
}

interface TopScore {
    initials: string;
    score: number;
}

type TopScoresResponse = TopScore[];

const validateTopScoresRequest = Slambda.createValidator<TopScoresRequest>({
    mode: Slambda.createNumberValidator(1, 3),
});

// Database integration
const root = Firebase
    .initializeApp({ credential: Firebase.credential.cert(fbc as Firebase.ServiceAccount) }, "topscores")
    .firestore()
    .collection(sharedData.collection);

export const handler = Slambda.createHandler<TopScoresRequest, TopScoresResponse>({
    method: "GET",
    parse: Slambda.parseQueryString,
    validate: validateTopScoresRequest,
    createHeaders: Slambda.createCorsWildcardHeaders,

    handle: async (request) => {
        const records = await root
            .where("mode", "==", request.mode)
            .select("initials", "score")
            .orderBy("score", "desc")
            .limit(10)
            .get();

        let response: TopScoresResponse = [];
        records.forEach(doc => response.push(doc.data() as TopScore));

        return response;
    },
});
