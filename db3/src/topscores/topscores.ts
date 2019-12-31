import * as Firebase from "firebase-admin";
import * as fbc from "fbc";
import { createNumberValidator, createValidator, createJsonAsTextGetHandler } from "slambda";

// Input validation
interface TopScoresRequest {
    mode: number;
}

const validateTopScoresRequest = createValidator<TopScoresRequest>({
    mode: createNumberValidator(1, 3),
});

// Database integration
// TODO: Share collection name!
const root = Firebase
    .initializeApp({ credential: Firebase.credential.cert(fbc as Firebase.ServiceAccount) }, "topscores")
    .firestore()
    .collection("fbg-scores");

export const handler = createJsonAsTextGetHandler<TopScoresRequest, object>(validateTopScoresRequest, async (request) => {
    console.log(`Top scores for mode: ${request.mode}`);
    return {};
});
