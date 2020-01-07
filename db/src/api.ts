import Serverless from "serverless-http";
import Koa from "koa";
import Router from "@koa/router";
import Cors from "@koa/cors";
import BodyParser from "koa-bodyparser";
import * as Validize from "validize";
import * as Contract from "fbg-db-contract";
import LZString from "lz-string";
import * as Firebase from "firebase-admin";
import * as fbc from "fbc";
import * as sharedData from "shared-data";

// Database integration
const root = Firebase
    .initializeApp({ credential: Firebase.credential.cert(fbc as Firebase.ServiceAccount) }, "api")
    .firestore()
    .collection(sharedData.collection);

const router = new Router();
router.prefix("/.netlify/functions/api");

// Top scores
const validateMode = Validize.createIntegerValidator(1, 3, true);

router.get(Contract.TopScoresRoute, Validize.handle({
    validateParameters: Validize.createValidator<Contract.TopScoresRequestParameters>({ mode: validateMode }),
    validateQuery: Validize.createValidator<Contract.TopScoresRequestQuery>({ includeSeeds: Validize.createOptionalValidator(Validize.createBooleanValidator(true)) }),
    process: async (request) => {
        const records = await root
            .where("mode", "==", request.parameters.mode)
            .select("initials", "score")
            .orderBy("score", "desc")
            .limit(10)
            .get();

        let response: Contract.TopScoresResponseBody = [];
        records.forEach(doc => {
            const data = doc.data();
            let topScore: Contract.TopScore = {
                initials: data.initials,
                score: data.score,
            };

            if (request.query.includeSeeds === true) {
                topScore.seed = doc.id;
            }

            response.push(topScore);
        });

        return response;
    },
}));

// Get score
const validateSeed =  Validize.createStringValidator(/^[0-9a-f]{32}$/);
const validateGetScoreParameters = Validize.createValidator<Contract.GetScoreRequestParameters>({
    mode: validateMode,
    seed: validateSeed,
});

router.get(Contract.GetScoreRoute, Validize.handle({
    validateParameters: validateGetScoreParameters,
    process: async (request) => {
        const record = await root.doc(request.parameters.seed).get();
        if (record.exists) {
            const { mode, host, initials, score, timestamp, replay } = record.data();
            const result: Contract.GetScoreResponseBody = {
                mode,
                seed: record.id,
                host,
                initials,
                timestamp: (timestamp as Firebase.firestore.Timestamp).toDate().toISOString(),
                score,
                replay: (replay as Buffer).toString("base64"),
            };
            return result;
        } else {
            throw new Validize.NotFoundError("Invalid seed"); // TODO: Make message optional?
        }
    },
}));

// Add score
const base64Pattern = /^[A-Za-z0-9+/=]*$/;
const validateAddScoreParameters = Validize.createValidator<Contract.AddScoreRequestParameters>({
    mode: validateMode,
    seed: validateSeed,
});

const validateAddScoreBody = Validize.createValidator<Contract.AddScoreRequestBody>({
    host: Validize.createStringValidator(/^[a-z]{15}$/),
    initials: Validize.createStringValidator(/^[a-z]{3}$/),
    score: Validize.createIntegerValidator(0, 999999),

    replay: (x: any): string => {
        if (typeof(x) === "string" && base64Pattern.test(x) && LZString.decompressFromBase64(x).length >= 6) {
            return x;
        } else {
            throw new Error("Invalid replay");
        }
    },
})

router.post(Contract.AddScoreRoute, Validize.handle({
    validateParameters: validateAddScoreParameters,
    validateBody: validateAddScoreBody,
    process: async (request) => {
        console.log(`New score for mode ${request.parameters.mode} by ${request.body.initials} (${request.body.host}): ${request.body.score}\n${request.parameters.seed}\n${request.body.replay}`);
    },
}));

// Set up app and handler
const app = new Koa();
app.use(Cors());
app.use(BodyParser({ extendTypes: { json: [ "text/plain" ] } }));
app.use(router.routes());
// app.use(router.allowedMethods());

export const handler = Serverless(app);
