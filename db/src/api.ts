import Serverless from "serverless-http";
import Koa from "koa";
import Router from "@koa/router";
import Cors from "@koa/cors";
import BodyParser from "koa-bodyparser";
import * as Validize from "validize";
import * as Contract from "fbg-db-contract";
import * as LZString from "lz-string";

const base64Pattern = /^[A-Za-z0-9+/=]*$/;
const validateMode = Validize.createIntegerValidator(1, 3, true);
const validateSeed =  Validize.createStringValidator(/^[0-9a-f]{32}$/);

const validateTopScoresParameters = Validize.createValidator<Contract.TopScoresRequestParameters>({
    mode: validateMode,
});

const validateTopScoresQuery = Validize.createValidator<Contract.TopScoresRequestQuery>({
    includeSeeds: Validize.createOptionalValidator(Validize.createBooleanValidator(true)),
});

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

const router = new Router();
router.prefix("/.netlify/functions/api");

router
    .get(
        Contract.TopScoresRoute,
        Validize.validate((context) => {
            context.validated = {
                parameters: validateTopScoresParameters(context.params),
                query: validateTopScoresQuery(context.query),
            };
        }),
        (context) => {
            const parameters: Contract.TopScoresRequestParameters = context.validated.parameters;
            const query: Contract.TopScoresRequestQuery = context.validated.query;
            context.status = 200;
            context.body = `Here are the top scores for mode ${parameters.mode} (include scores: ${query.includeSeeds === true})`;
        })

    .post(
        Contract.AddScoreRoute,
        Validize.validate((context) => {
            context.validated = {
                parameters: validateAddScoreParameters(context.params),
                body: validateAddScoreBody(JSON.parse(context.request.rawBody)),
            };
        }),
        (context) => {
            const parameters: Contract.AddScoreRequestParameters = context.validated.parameters;
            const body: Contract.AddScoreRequestBody = context.validated.body;

            context.status = 200;
            context.body = "";
            console.log(`New score for mode ${parameters.mode} by ${body.initials} (${body.host}): ${body.score}\n${parameters.seed}\n${body.replay}`);
        })
;

const app = new Koa();
app.use(Cors());
app.use(BodyParser({ enableTypes: [ "text" ] }));
app.use(router.routes());
// app.use(router.allowedMethods());

export const handler = Serverless(app);
