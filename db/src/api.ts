import Serverless from "serverless-http";
import Koa from "koa";
import Router from "@koa/router";
import Cors from "@koa/cors";
import BodyParser from "koa-bodyparser";
import * as Validize from "validize";
import * as Contract from "fbg-db-contract";
import LZString from "lz-string";

const router = new Router();
router.prefix("/.netlify/functions/api");

// Top scores
const validateMode = Validize.createIntegerValidator(1, 3, true);

router.get(
    Contract.TopScoresRoute,
    Validize.handle({
        validateParameters: Validize.createValidator<Contract.TopScoresRequestParameters>({ mode: validateMode }),
        validateQuery: Validize.createValidator<Contract.TopScoresRequestQuery>({ includeSeeds: Validize.createOptionalValidator(Validize.createBooleanValidator(true)) }),
        process: async (request) => {
            return `Here are the top scores for mode ${request.parameters.mode} (include scores: ${request.query.includeSeeds === true})`;
        },
    }));

// Add score
const base64Pattern = /^[A-Za-z0-9+/=]*$/;
const validateSeed =  Validize.createStringValidator(/^[0-9a-f]{32}$/);
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

router.post(
    Contract.AddScoreRoute,
    Validize.handle({
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
